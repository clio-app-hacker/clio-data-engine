const fs = require('fs');
const ApiServer = require('./apiServer');

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

function updatefields(source, type, sourceData, target, targetList, data) {
    //console.log("updatefields", source, sourceData, target)
    const sourceValue = sourceData[source];
    // find the target in the target list where the value of target is equal to sourceValue
    const selectedObject = targetList.find((obj) => {
        //console.log("Comparing :" + obj[target] + " with" + sourceValue);
        return obj[target] === sourceValue;
    });
    // update object if found
    if (selectedObject) {
        // lin type can field or object
        if (type === "field") {
            // assign only the field value
            selectedObject[target] = data[source];
        } else {
            // assignvi  the entire object
            selectedObject[target] = data;
        }
        console.log("SelectedObject:", selectedObject);
    }
}
function process(start, maxLength, secondsDelay, map, store, instance, token){
    processChunk(start, maxLength, secondsDelay, map, store, instance, token);
}

async function processChunk(start, maxLength, secondsDelay, map, store, instance, token) {
    let end = start + maxLength;
    end = end < store.length ? store.length : end;
    const { api: url, link } = instance;
    for (let d = start; d < end; d++) {
        const data = store[d];
        try {
            const response = await ApiServer.post(url, { data: data }, token);
            //console.log("posted", data);
            console.log("Response", response.data.data)
            if (link && link.length > 0) {
                const { source, target, name, type} = link[0];
                updatefields(source, type, data, target, map[name].store, response.data.data);
            }
        } catch (e) {
            console.log(e);
        }
    }

    if (end < store.length) {
        setTimeout(process, secondsDelay*1000, end + 1, maxLength, secondsDelay, map, store, instance, token);
    }
}

function processChunks(maxLength, secondsDelay, map, store, instance, token) {
    setTimeout(process, secondsDelay*1000, 0, maxLength, secondsDelay, map, store, instance, token);
}

async function create(token) {
    console.log("DataGenerator.create");
    const map = readAll();

    // read data files
    for (let key in map) {
        const instance = map[key].instance
        const store = map[key].store
        const { api: url, link } = instance;

        // console.log("Data File content-> ", dataStore);

        // TODO: run 10 at a time then pause for 45 secs to avoid rate limiting
        // processChunks(5, 45, map, store, instance, token);

        for (let d = 0; d < store.length; d++) {
            const data = store[d];
            try {
                const response = await ApiServer.post(url, { data: data }, token);
                //console.log("posted", data);
                console.log("Response", response.data.data)
                if (link && link.length > 0) {
                    const { source, target, name, type } = link[0];
                    updatefields(source, type, data, target, map[name].store, response.data.data);
                }
            } catch (e) {
                console.log(e);
            }
        }
    }
    // create data as specified in manifest

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
