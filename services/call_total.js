const axios = require('axios');
SERVER_END_POINT = 'http://localhost:8880/mi';

const call_count = async () => {

    let call_count_number = await axios.post(SERVER_END_POINT, {
        "method": "profile_get_size",
        "params": ["system"],
        "id": 0,
        "jsonrpc": "2.0"
    })
        .then(function (response) {
            console.log(response.data.result.Profile.count);
            return response.data.result.Profile.count
        })
        .catch(function (error) {
            console.log(error);
        });

    return call_count_number;
}

module.exports = call_count;