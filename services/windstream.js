const axios = require('axios')
//authenticate windstream
const moment = require('moment');
var DOMParser = require('xmldom').DOMParser;
parser = new DOMParser();
let fastparser = require('fast-xml-parser');

const WINDSTREAM_USERNAME = 'o7b2z6n3';
const WINDSTREAM_PASSWORD = 'sTWYAsfrJd';
const WINDSTREAM_END_POINT_URL = 'https://xml.windstreamwholesale.com/cgi-bin/voip/live/wholesale.cgi';

const headers = `<header>
<username>${WINDSTREAM_USERNAME}</username>
<password>${WINDSTREAM_PASSWORD}</password>       
</header>`;

const FormData = require('form-data');
var querystring = require('querystring');


const windstream_order_number = async (areacodes, numberset) => {

    let items = '';
    let timestamp = moment().unix();
    areacodes.forEach(element => {
        items += `<item>
            <item_id>${timestamp}</item_id> 
            <action>INFO</action>
            <info_action>GET_NUMBERS</info_action> 
            <info_detail>
                <npa>${element}</npa>
                <tier>A</tier>
                <fax>F</fax>
            </info_detail>
        </item>`;
        timestamp++;
    });

    var xmlBodyStr = `<?xml version=\"1.0\"?><packet>${headers}<data>${items}</data></packet>`;
    //xmlDoc = parser.parseFromString(xmlBodyStr, "text/xml");

    //var FormDataXML = new FormData();
    //FormDataXML.append('xml', xmlBodyStr);

    var config = {
        headers:
            { "Content-Type": "application/x-www-form-urlencoded" }
    };

    let get_numbers_response = await axios.post(WINDSTREAM_END_POINT_URL, querystring.stringify({
        xml: xmlBodyStr
    }), config).then(res => {
        return res.data;
    }).catch(err => console.log(err));


    //RES numbers

    // when a tag has attributes
    var options = {
        attrPrefix: "@_"
    };

    console.log(xmlBodyStr);
    console.log(get_numbers_response);


    var jsonObj = fastparser.parse(get_numbers_response, options);

    items = jsonObj.packet.data.item;


    var numbers_array = {};

    let npa_nxx_item_xml = {};
    var prev_number = '';
    var number_iter = 1;

    console.log(`items`);
    console.log(items);

    if (!Array.isArray(items)) {
        items = [];
        items.push(jsonObj.packet.data.item);
    }


    if (items !== undefined && items.length > 0) {

        items.forEach(element => {

            if (element.number) {

                console.log(element.number)
                let numbers = element.number;
                numbers.forEach(number => {

                    console.log("NPA...." + number['npa'] + "....NPX:" + number['nxx']);
                    //detect number change
                    if (number['npa'] == prev_number && number_iter >= numberset) {
                        console.log('do nothing');
                    }
                    else {
                        if (number['npa'] != prev_number)
                            number_iter = 1;
                        else
                            number_iter++

                        let number_npa = number['npa'];
                        let number_nxx = number['nxx'];

                        timestamp++;
                        npa_nxx_item_xml += `<item>
                            <item_id>${timestamp}</item_id> 
                            <action>RES</action>
                            <number> 
                                <npa>${number_npa}</npa>
                                <nxx>${number_nxx}</nxx> 
                                <tier>A</tier>
                                <fax>F</fax>
                            </number>
                            </item>`
                    }

                    prev_number = number['npa'];
                })
            }
        });
    }


    var xmlBodyStr_Res = `<?xml version=\"1.0\"?><packet>${headers}<data>${npa_nxx_item_xml}</data></packet>`;

    // var xmlBodyStr_Res = `<?xml version=\"1.0\"?><packet>${headers}<data>${items}</data></packet>`;
    // //xmlDoc = parser.parseFromString(xmlBodyStr_Res, "text/xml");

    // //var FormDataXML_Res = new FormData();
    // //FormDataXML_Res.append('xml', xmlBodyStr);

    var config = {
        headers:
            { "Content-Type": "application/x-www-form-urlencoded" }
    };


    let res_numbers_response = await axios.post(WINDSTREAM_END_POINT_URL, querystring.stringify({
        xml: xmlBodyStr_Res
    }), config).then(res => {

        return res.data;
    }).catch(err => console.log(err));

    var jsonObjRes = fastparser.parse(res_numbers_response, options);

    var reserved_numbers = new Array();

    if (jsonObjRes.packet !== undefined) {

        items = jsonObjRes.packet.data.item;

        console.log(typeof items);
        console.log("ITEMS");
        console.log(items);

        if (!Array.isArray(items)) {
            items = [];
            items.push(jsonObjRes.packet.data.item);
        }

        let number_item_xml = '';

        items.forEach(element => {

            let reserved_number = element.number;
            number_item_xml += `<item>
                <item_id>${timestamp}</item_id>
                <action>MOD</action>
                <mod_action>ADD_NUMBER</mod_action>
                <sipe>63583</sipe>
                <modification>
                    <number>${reserved_number}</number>
                </modification>
            </item>`
            reserved_numbers.push(reserved_number.toString());
            timestamp++;
        });



        var xmlBodyStr_Add = `<?xml version=\"1.0\"?><packet>${headers}<data>${number_item_xml}</data></packet>`;

        let add_numbers_response = await axios.post(WINDSTREAM_END_POINT_URL, querystring.stringify({
            xml: xmlBodyStr_Add
        }), config).then(res => {
            return res.data;
        }).catch(err => console.log(err));

    }

    return reserved_numbers;
}

module.exports = windstream_order_number;