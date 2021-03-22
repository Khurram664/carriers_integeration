const axios = require('axios')
//authenticate windstream
const moment = require('moment');
var DOMParser = require('xmldom').DOMParser;
parser = new DOMParser();
let fastparser = require('fast-xml-parser');

const Intelliquent_Client_Id = 'sVDhzI3yPq5wppifytQNIKLMtEMa';
const Intelliquent_Client_Secret = '_LzFjqGsylCmOklsTcucoHMiHyUa';
const Intelliquent_Token_URL = 'https://services-token.inteliquent.com/oauth2/token';
const Intelliquent_Inventory_URL = 'https://services.inteliquent.com/Services/2.0.0/tnInventory';
const Intelliquent_Order_URL = 'https://services.inteliquent.com/Services/2.0.0/tnOrder';

const FormData = require('form-data');
var querystring = require('querystring');



const intelliquent_order_number = async (areacodes, numberset) => {

    var config = {
        headers:
            { "Content-Type": "application/x-www-form-urlencoded" }
    };

    var intelli_numbers = [];
    var areacodes_found = [];

    var areacodes = areacodes;
    console.log(areacodes);

    let token_response = await axios.post(Intelliquent_Token_URL, querystring.stringify({
        client_id: Intelliquent_Client_Id,
        client_secret: Intelliquent_Client_Secret,
        grant_type: "client_credentials"
    }), config).then(res => {
        return res;
    }).catch(err => console.log(err));

    console.log(`Response`);
    console.log(token_response.data.access_token);

    if (token_response.status == 200) {
        var token = token_response.data.access_token;

        var config = {
            headers:
            {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        var inventory_response;

        for (areacode of areacodes) {

            console.log(areacode);

            inventory_response = await axios.post(Intelliquent_Inventory_URL, {
                privateKey: Intelliquent_Client_Id,
                tnWildcard: `${areacode}*`,
                quantity: numberset,
                searchOnNetOnly: "Y"
            }, config)
                .then(function (response) {
                    return response
                })
                .catch(function (error) {
                    console.log(error);
                });

            if (inventory_response.data.status == 200) {

                var tnResult = inventory_response.data.tnResult;
                console.log(inventory_response);
                console.log(`tnResult`);
                console.log(tnResult);

                if (inventory_response.data.size >= numberset) {

                    areacodes_found.push(areacode);

                    for (tn of tnResult) {

                        console.log(tn.telephoneNumber);

                        intelli_numbers.push(tn.telephoneNumber);

                    }

                }
            } else {
                return {
                    intelliquent_reserved_numbers: [],
                    intelliquent_reserved_areacodes: []
                };
            }

        }

        console.log('Intelli numbers');
        console.log(intelli_numbers);

        if (intelli_numbers.length > 0) {

            var array_of_numbers = [];

            intelli_numbers.forEach(element => {

                var arr = {
                    tn: element,
                    trunkGroup: "STTLWAWBCCS_1046"
                }
                array_of_numbers.push(arr);
            });

            console.log(array_of_numbers);

            // var arr2 = [];
            // arr2["tnItem"] = array_of_numbers;

            // var arr3 = [];
            // arr3["tnList"] = arr2;


            // console.log(arr3);
            // console.log(config);


            order_response = await axios.post(Intelliquent_Order_URL, {
                privateKey: Intelliquent_Client_Id,
                tnOrder: {
                    tnList: {
                        tnItem: array_of_numbers
                    }
                }
            }, config)
                .then(function (response) {
                    return response;
                })
                .catch(function (error) {
                    console.log(error);
                });


            console.log('order_response');
            console.log(order_response.data.statusCode);

            if (order_response.data.statusCode == 200) {
                //order succesfuly

                return {
                    intelliquent_reserved_numbers: intelli_numbers,
                    intelliquent_reserved_areacodes: areacodes_found
                };
            } else {

                console.log('Error while ordering Numbers');

                return {
                    intelliquent_reserved_numbers: [],
                    intelliquent_reserved_areacodes: []
                };

            }

        }

    } else {
        console.log('Error getting Token');
    }

}

// let result = await intelliquent_order_number([201, 202, 205], 2);

// console.log('result');

// console.log(result);

module.exports = intelliquent_order_number;
