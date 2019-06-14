const fs = require('fs');
const ApiServer = require('./apiServer');

async function refreshToken(token) {
    console.log("Old Token: ", token)
    let accessToken = DataGenerator.oauth.accessToken.create(token);
    const result = await accessToken.refresh();
    token.access_token = result.token.access_token;
    console.log("New token: ", result.token);
    return token;
}
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
            // assign the entire object
            selectedObject[target] = data;
        }
        //console.log("SelectedObject:", selectedObject);
    }
    return store;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}



// TODO: handle loop same way as proceesItem L140
// TODO: only work for activities and matters, create some sort of lookup table and ref in the manifest
async function attachItems(attach, attachObj, map, key, session) {
    const instance = map[attach.name].instance;
    const store = map[attach.name].store;
    const { api: url } = instance;
    const numItems = getRandomInt(attach.min, attach.max)
    console.log("Creating " + numItems + " items for " + attachObj.display_number);
    for (let index = 0; index < numItems; index++) {
        let dataItem = store[index];
        dataItem.user = attachObj.responsible_attorney;
        try {
            dataItem[attach.target] = attachObj;
            await ApiServer.post(url, { data: dataItem }, session.clio_token.access_token);
        } catch (error) {
            console.log("posted", dataItem);
            console.log("-------------------------------------\n\n\n", error.response.data.error, "\n-------------------------------------\n\n");
            console.log("Access Token: ", session.clio_token.access_token)
            if (error.response.data.error.type == 'RateLimited') {
                // refresh token
                // session.clio_token = await refreshToken(session.clio_token);
                // session.save(() => { });
                // console.log("returned token: ", session.clio_token);

                // keep retrying
                index--;
                // wait until rate limit timeout is over - blocking in this case which is ok
                sleep(error.response.headers['retry-after'] * 1005);
            }
        }
    }
}

async function processItem(index, map, key, session) {
    const store = map[key].store;
    const dataItem = store[index];
    const instance = map[key].instance
    const { api: url, link, attach } = instance;
    try {
        const response = await ApiServer.post(url, { data: dataItem }, session.clio_token.access_token);
        //console.log("posted", dataItem);
        //console.log("Response", response.data.data)
        if (link) {
            const { source, target, name, type } = link;
            map[name].store = updatefields(source, type, dataItem, target, map[name].store, response.data.data);
        }
        if (attach) {
            const responseData = response.data.data;
            const mergedData = { ...dataItem, ...responseData };
            await attachItems(attach, mergedData, map, key, session);
        }
    } catch (error) {
        console.log("posted", dataItem);
        // TODO: Handle error function
        if (error && error.response && error.response.data) {

            console.log("posted", dataItem);
            console.log("-------------------------------------\n\n\n", error.response.data.error, "\n-------------------------------------\n\n");
            console.log("Access Token: ", session.clio_token.access_token)
            if (error.response.data.error.type == 'RateLimited') {
                // refresh token
                // session.clio_token = await refreshToken(session.clio_token);
                // session.save(() => { });
                // console.log("returned token: ", session.clio_token);

                // keep retrying
                index--;
                // wait until rate limit timeout is over - blocking in this case which is ok
                sleep(error.response.headers['retry-after'] * 1005);

            } else {
                console.log("---------------not rate limited----------------------\n\n\n", error.response.data.error);
            }
        } else if (error && error.response) {
            console.log("-----------no data--------------------------\n\n\n", error.response);

        } else {
            console.log("-------------no response------------------------\n\n\n", error);
        }
    }
    return index;
}

/**
 * Process a chunk of data
 * @param {*} map the entire fake data map
 * @param {*} key the key for the current data
 * @param {*} token the clio token
 */
async function processData(map, key, session) {
    console.log("----------------------------------------- for \"" + key + "\" processData");
    const store = map[key].store
    console.log(" - \"" + key + "\" - Store length: " + store.length)
    for (let index = 0; index < store.length; index++) {

        index = await processItem(index, map, key, session);
    }
    return true;
}


async function create(session) {
    console.log("DataGenerator.create");
    const map = readAll();
    // read data files
    for (let key in map) {
        if (map[key].instance.create) {
            await processData(map, key, session)
        }
    }
}

function destroy(session) {
    console.log("DataGenerator.destroy");
    // read data manifest.destroy
    // read data files
    // create data as specified in manifest
}

const DataGenerator = {
    oauth: null,
    run: (type, session) => {
        switch (type) {
            case "create":
                create(session);
                break;
            case "destroy":
                destroy(session);
                break;
        }
        return "Done";
    }
};

module.exports = DataGenerator;
