const fs = require('fs');
const ApiServer = require('./apiServer');

function create(token) {
    console.log("DataGenerator.create");
    // read data manifest.create
    let manifest = JSON.parse(fs.readFileSync('./manifests/manifest.create.json'));
    // read data files
    for (let i = 0; i < manifest.length; i++) {
        const instance = manifest[i];
        const { api: url, fields, data: dataFile } = instance;
        const dataStore = JSON.parse(fs.readFileSync(dataFile));
        console.log("Data File content-> ", dataStore);
        for (let d = 0; d < dataStore.length; d++) {
            const data = dataStore[d];

            ApiServer.post(url, { data: data }, token).then(() => {
                console.log("posted", data);
            }).catch(error => {
                console.log("ERROR: ", error);
            })

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
