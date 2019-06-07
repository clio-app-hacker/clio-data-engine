const axios = require('axios');
const config = require('./config.json');
const qs = require('qs');

const ApiServer = {
    get: async (url, token) => {
        console.log(`${url} with token = ${token}`)
        let result = await axios.get(url, {
            baseURL: config.apiHost,
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return result;
    },
    post: async (url, data, token) => {
        console.log(`${url} with token = ${token}`)
        const axiosConfig = {
            baseURL: config.apiHost,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        console.log("POST:", data, axiosConfig)
        let result = await axios.post(url, data, axiosConfig);
        return result;
    },
    delete: async (url, data, token) => {
        console.log(`${url} with token = ${token}`)
        const headers = {
            baseURL: config.apiHost,
            headers: { 'Authorization': `Bearer ${token}` }
        };
        let result = await axios.delete(url, { data: data, headers });
        return result;
    }
};

module.exports = ApiServer;
