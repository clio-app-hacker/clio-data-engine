const fs = require('fs');
const ApiServer = require('./apiServer');

/**
 * Blocking sleep function
 * 
 * This is used to wait for rate limit timeout to expire
 */
function sleep(miliseconds) {
    var currentTime = new Date().getTime();
    while (currentTime + miliseconds >= new Date().getTime()) {
    }
}

/**
 * Read all fake data into a map. This is need so we can build relationship links as
 * ID's become available when we store the data in CLIO. 
 */
function readAll() {
    console.log("DataGenerator.readAll");
    let manifest = JSON.parse(fs.readFileSync('./manifests/manifest.create.json'));
    let dataMap = {};
    // read data files
    for (let i = 0; i < manifest.length; i++) {
        const instance = manifest[i];
        const { name, data: dataFile } = instance;
        dataMap[name] = {
            instance,
            store: JSON.parse(fs.readFileSync(dataFile))
        };
    }
    return dataMap;
}

function updatefields(source, linkType, sourceData, target, store, data) {
    //console.log("updatefields", source, sourceData, target)
    const sourceValue = sourceData[source];
    // find the target in the store where the value of target is equal to sourceValue
    const selectedObject = store.find((obj) => {
        //console.log("Comparing :" + obj[target] + " with" + sourceValue);
        return obj[target] === sourceValue;
    });
    // update object link if found
    if (selectedObject) {
        // linkType can field or object
        if (linkType === "field") {
            // assign only the field value
            selectedObject[target] = data[source];
        } else {
            // assignvi  the entire object
            selectedObject[target] = data;
        }
        //console.log("SelectedObject:", selectedObject);
    }
    return store;
}

/**
 * Process a chunk of data
 * @param {*} map the entire fake data map
 * @param {*} key the key for the current data
 * @param {*} token the clio token
 */
async function processData(map, key, token) {
    console.log("-----------------------------------------" + key + " processData");
    const store = map[key].store
    console.log(key + "Store length: " + store.length)
    const instance = map[key].instance
    const { api: url, link } = instance;

    for (let d = 0; d < store.length; d++) {
        const data = store[d];
        try {
            const response = await ApiServer.post(url, { data: data }, token);
            //console.log("posted", data);
            //console.log("Response", response.data.data)
            if (link && link.length > 0) {
                const { source, target, name, type } = link[0];
                map[name].store = updatefields(source, type, data, target, map[name].store, response.data.data);
            }
        } catch (error) {
            console.log("posted", data);
            console.log("-------------------------------------\n\n\n", error.response.data.error, "\n-------------------------------------\n\n");
            if (error.response.data.error.type == 'RateLimited') {
                // keep retrying
                d--;
                // wait until rate limit timeout is over - blocking in this case which is ok
                sleep(error.response.headers['retry-after'] * 1005);
            }
        }
    }
    return true;
}


async function create(token) {
    console.log("DataGenerator.create");
    const map = readAll();
    // read data files
    for (let key in map) {
        await processData(map, key, token)
    }
}

function destroy(token) {
    console.log("DataGenerator.destroy");
    // read data manifest.destroy
    // read data files
    // create data as specified in manifest
}

const DataGenerator = {
    run: (type, token) => {
        switch (type) {
            case "create":
                create(token);
                break;
            case "destroy":
                destroy(token);
                break;
        }
        return "Done";
    }
};

module.exports = DataGenerator;
