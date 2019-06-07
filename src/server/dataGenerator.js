const axios = require('axios');

function create(token) {
    console.log("DataGenerator.create");
    // read data manifest.create
    // read data files
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
