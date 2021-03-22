const axios = require('axios');
SERVER_END_POINT = 'http://localhost:8880/mi';

const dr_reload_function = async () => {

    let dr_reload_call = await axios.post(SERVER_END_POINT, {
        "method": "dr_reload",
        "id": 0,
        "jsonrpc": "2.0"
    })
        .then(function (response) {
            //console.log(response);
            return response;
        })
        .catch(function (error) {
            console.log(error);
        });

    return dr_reload_call;
}

module.exports = dr_reload_function;