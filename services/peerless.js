const axios = require('axios')
//authenticate windstream
const moment = require('moment');
var DOMParser = require('xmldom').DOMParser;
parser = new DOMParser();
let fastparser = require('fast-xml-parser');

const PEERLESS_CUSTOMER = 'ContactCenterSpecial';
const PEERLESS_PASSCODE = 'XIBFH7XF';
const PEERLESS_USERID = 'info@contactcenterspecialists.com';

const PEERLESS_ENDPOINT = 'https://animate.peerlessnetwork.com:8181/animateapi/axis/APIService';

const openSoapEnvelope = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pub="http://publicapi.api.s2.peerless.com/">';
const soapHeader = ' <soapenv:Header/>';
const closeSoapEnvelope = '</soapenv:Envelope>';

const generateSoapRequest = (soapBody) => {

    return `${openSoapEnvelope}${soapHeader}${soapBody}${closeSoapEnvelope}`;

}

const xmlstr = `<soapenv:Body><pub:searchNumbers>
                     <authentication>
                        <customer>${PEERLESS_CUSTOMER}</customer>
                        <passCode>${PEERLESS_PASSCODE}</passCode>
                        <userId>${PEERLESS_USERID}</userId>
                     </authentication>
                     <filters>
                         <npas>203</npas>
                        <quantity>2</quantity>
                        <consecutive>1</consecutive>
                        <categories>
                            <category>1</category>
                        </categories>
                        <selectedTN>
                            <tn>?</tn>
                        </selectedTN>
                     </filters>
                  </pub:searchNumbers>
               </soapenv:Body>`;


let xml_req_xml = generateSoapRequest(xmlstr);

console.log(xml_req_xml);


var config = {
    headers:
        { "Content-Type": "text/xml" }
};

//let xml = parser.parseFromString(xml_req_xml, "text/xml");


let response = axios.post(PEERLESS_ENDPOINT,
    xml_req_xml,
    config).then(res => {
        console.log(res);
        return res;
    }).catch(err => console.log(err));






