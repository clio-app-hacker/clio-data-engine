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

function updatefields(source, sourceData, target, targetList, data) {
    console.log("updatefields", source, sourceData, target)
    const sourceValue = sourceData[source];
    // find the target in the target list where the value of target is equal to sourceValue
    const selectedObject = targetList.find((obj) => {
        console.log("Comparing :" + obj[target] + " with" + sourceValue);
        return obj[target] === sourceValue;
    });
    // update object if found
    if (selectedObject) {
        selectedObject[target] = data;
        console.log("SelectedObject:", selectedObject);
    }
}

async function create(token) {
    console.log("DataGenerator.create");
    const map = readAll();

    // read data files
    for (let key in map) {
        const instance = map[key].instance
        const { api: url } = instance;
        const dataStore = map[key].store
        console.log("Data File content-> ", dataStore);

        // TODO: run 50 at a time then pause for 45 secs to avoid rate limiting
        for (let d = 0; d < dataStore.length; d++) {
            const data = dataStore[d];
            try {
                const response = await ApiServer.post(url, { data: data }, token);
                //console.log("posted", data);
                console.log("Response", response.data.data)
                const { link } = instance;
                if (link && link.length > 0) {
                    const { source, target, name } = link[0];
                    updatefields(source, data, target, map[name].store, response.data.data);
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
