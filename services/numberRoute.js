const { Customer, Dr_gateway, Dr_rules, Areacode, Number_Inventory, DID_Group, History } = require("../utils/sequelize_db.js");
const _ = require('underscore');
var mysql = require('mysql');
const moment = require('moment');
const dr_reload_function = require('../services/dr_reload');
const NumberController = require('../controller/NumberController');

const number_route = async (req, numbers, params, onready_numbers, intelliquent_reserved_numbers) => {

    //Get Customer traffic order

    var adminName = req.adminName;
    var ips = params.ips;
    var customer_id = params.customer_id;
    var DID_GROUP_ID = params.group_id;
    var asteriskentry = params.asteriskentry;
    var accidonly = params.accidonly;
    var extension = params.extension;
    var location = params.location;
    var serverip = params.serverip;
    var phone = params.phone;
    var active = params.active;

    var voicemail = params.voicemail;
    var callhandle = params.callhandle;
    var listid = params.listid;
    var filterinbound = params.filterinbound;
    var filterphonegroupid = params.filterphonegroupid;
    var filterurl = params.filterurl;
    var campaign = params.campaign;

    var description = params.description;

    var route = params.route;
    var areafill = params.areafill;

    var VICIDID = false;
    var VICIACCID = false;
    var AreaFill = false;
    var Assigned = false;

    var customer_obj = await Customer.findOne({
        where: {
            id: customer_id
        }
    }).then(customer => { return customer });

    var traffic_order = customer_obj.traffic_order;

    var customer_name = customer_obj.name;

    var group_name = 'WS_' + moment().format('YYYYMMDD') + '-' + moment().unix();

    if (ips[0])
        destination_ip = ips[0];
    else
        destination_ip = '';

    // var DID_GROUP_ID = await DID_Group.create({
    //     group_name: group_name,
    //     destination_ip: destination_ip,
    //     description: description,
    //     campaign: campaign,
    //     customer_id: customer_id,
    //     total_number: numbers.length,
    //     last_assigned: moment().format('DD/MM/YYYY HH:mm:ss'),
    //     did_route: route,
    //     did_location: location,
    //     call_handle_method: callhandle,
    //     filter_inbound_number: filterinbound,
    //     filter_phone_group_id: filterphonegroupid
    // }).then(function (x) {
    //     return x.id;
    // });

    var pre_gwids = await Dr_gateway.findAll({
        where: {
            customer_id: customer_id
        },
        attributes: ['gwid'],
        raw: true
    }).then(function (gateways) {
        return _.map(gateways, function (gateway) { return gateway.gwid; })
    });

    var DestinationExists;

    if (pre_gwids.length > 0)
        DestinationExists = true;
    else
        DestinationExists = false;



    var unique_gwids = [...new Set(pre_gwids)];

    var string_gwids = unique_gwids.join(",");

    if (traffic_order == 'loadbalance') {
        var length_of_gwids = unique_gwids.length;
        var value_of_each_balance = Math.floor(100 / length_of_gwids);
        var gwids_balance = [];

        unique_gwids.forEach(value => {
            gwids_balance.push(`${value}=${value_of_each_balance}`);
        });
        string_gwids = gwids_balance.join(",");
    }

    var onready_numbers = onready_numbers;

    numbers.forEach(async number => {


        if (DestinationExists == true) {
            const count_prefix = await Dr_rules.count({
                where: {
                    prefix: number
                }
            });

            if (count_prefix == 0) {

                await Dr_rules.create({
                    prefix: number,
                    gwlist: string_gwids,
                    groupid: '1',
                    attrs: `id_cc_card=${customer_id}`
                });

            } else {
                //just update
                let dr_rules_update = await Dr_rules.update({ gwlist: string_gwids, attrs: `id_cc_card=${customer_id}` }, { where: { prefix: number } });
            }

            await History.create({
                number: number,
                text: `Number Routed to ${customer_name} by ${adminName}`
            });
        }

        if (asteriskentry == true && customer_obj.dbserver != '' && customer_obj.dbserver != null) {

            try {

                const connection = mysql.createConnection({
                    host: customer_obj.dbserver,
                    user: customer_obj.dbuser,
                    password: customer_obj.dbpass,
                    database: 'asterisk'
                });

                Assigned = true;


                let connection_connect = await connection.connect();

                console.log("Connetion");

                console.log(connection_connect);


                if (accidonly == false) {

                    VICIDID = true;

                    let number_count = await connection.query(`SELECT count(*) as number_count from vicidial_inbound_dids where did_pattern=${number} `, (error, results, fields) => {
                        if (error) {
                            console.log('Error connection remote DB');
                        } else {

                            if (results[0].number_count >= 1) {
                                //Update query
                                connection.query(`Update vicidial_inbound_dids Set  did_description=\'${description}\',
                                    did_route=\'${route}\',extension=\'${extension}\',
                                    user=\'${extension}\',group_id=\'${extension}\',menu_id=\'${location}\',server_ip=\'${serverip}\',
                                    phone=\'${phone}\',voicemail_ext=\'${voicemail}\',
                                    call_handle_method=\'${callhandle}\',list_id=${listid},
                                    filter_inbound_number=\'${filterinbound}\',filter_phone_group_id=\'${filterphonegroupid}\',
                                    filter_url=\\'${filterurl}\\'
                                    where did_pattern = \'${number}\'`, (error, results, fields) => {
                                        if (error) throw error;
                                        //console.log('Result: ', results[0]);
                                    });

                            }
                            else {
                                //Insert Query
                                connection.query(`Insert into vicidial_inbound_dids(did_pattern,did_description,did_route,extension,user,group_id,menu_id,server_ip,phone,voicemail_ext,call_handle_method,list_id,filter_inbound_number,filter_phone_group_id, filter_url) 
                                values(\'${number}\',\'${description}\',\'${route}\',\'${extension}\',\'${extension}\',\'${extension}\',\'${location}\',\'${serverip}\',\'${phone}\',\'${voicemail}\',\'${callhandle}\',${listid},\'${filterinbound}\',\'${filterphonegroupid}\', \'${filterurl}\')`, (error, results, fields) => {
                                        if (error) throw error;
                                        //console.log('Result: ', results[0]);
                                    });
                            }
                            return results[0].number_count;
                        }
                    });
                }

                if (accidonly == false) {

                    VICIACCID = true;

                    let number_count = await connection.query(`SELECT count(*) as number_count from vicidial_campaign_cid_areacodes where outbound_cid=${number} `, (error, results, fields) => {
                        if (error) {
                            console.log('Error connection remote DB');
                        } else {

                            if (results[0].number_count >= 1) {
                                //Update query

                                connection.query(`Update vicidial_campaign_cid_areacodes Set  
                                    campaign_id=\'${campaign}\',
                                    cid_description=\'${description}\',
                                    active=\'${active}\'
                                    where outbound_cid = \'${number}\'`, (error, results, fields) => {
                                        //if (error) throw error;
                                        //console.log('Result: ', results[0]);
                                    });

                            }
                            else {
                                //Insert Query
                                let number_substr = number.substring(0, 3);
                                connection.query(`Insert into vicidial_campaign_cid_areacodes(campaign_id,areacode,outbound_cid,cid_description,active) 
                                Values(\'${campaign}\',\'${number_substr}\',\'${number}\',\'${description}\',\'${active}\')`, (error, results, fields) => {
                                        //if (error) throw error;
                                        //console.log('Result: ', results[0]);
                                    });
                            }
                            return results[0].number_count;
                        }
                    });
                }

                if (areafill == true) {

                    var number_substring = number.substring(0, 3);

                    var areacode_obj = await Areacode.findOne({
                        where: {
                            number: number_substring
                        }
                    }).then(areacode => { return areacode });

                    AreaFill = true;

                    if (areacode_obj.nearby != '') {
                        var areacode_str = areacode_obj.nearby;
                        var areacodes_nearby = areacode_str.split(",");

                        areacodes_nearby.forEach(areacode => {
                            connection.query(`Insert into vicidial_campaign_cid_areacodes(campaign_id,areacode,cid_description,active) 
                            Values(\'${campaign}\',\'${areacode}\',\'${description}\',\'${active}\')`, (error, results, fields) => {
                                    //if (error) throw error;

                                });
                        })
                    }
                }

                await History.create({
                    text: `Number Inserted in DB of ${customer_name} by ${adminName}`,
                    number: number
                });

            }
            catch (e) {
                console.log('Error connection remote DB');
            }
        }

        //call dr_reload
        await dr_reload_function();
        //Donot create on ready number just update it.

        if (onready_numbers.includes(number)) {
            //Update number
            await Number_Inventory.update({

                customer_id: customer_id,
                group_id: DID_GROUP_ID,
                status: 'Assigned',
                assigned: Assigned,
                routed: true,
                deleted: false,
                vicidid: VICIDID,
                viciaccid: VICIACCID,
                areafill: AreaFill
            }, { where: { number: number } });

            await History.create({
                number: number,
                text: `Number Reassigned to ${customer_name} by ${adminName}`
            });

        }
        else {
            //Create number
            let carrier_id;
            if (intelliquent_reserved_numbers.includes(number))
                carrier_id = 2; // intelliquent
            else
                carrier_id = 1; // windstream
            await Number_Inventory.create({
                number: number,
                carrier_id: carrier_id,
                customer_id: customer_id,
                group_id: DID_GROUP_ID,
                order_id: group_name,
                date_acquired: Date.now(),
                date_last_assigned: Date.now(),
                status: 'Assigned',
                assigned: Assigned,
                routed: true,
                deleted: false,
                vicidid: VICIDID,
                viciaccid: VICIACCID,
                areafill: AreaFill
            });

            await History.create({
                number: number,
                text: `Number Created and Assigned to ${customer_name} `
            });
        }
    })

    //call dr_reload
    await dr_reload_function();

    let numbers_in_group = await Number_Inventory.count({ where: { group_id: DID_GROUP_ID } });

    console.log(DID_GROUP_ID);
    console.log(`numbers_in_group`);
    console.log(numbers_in_group);


    await DID_Group.update({
        dbdid: VICIDID,
        accid: VICIACCID,
        areafill: AreaFill,
        total_number: numbers_in_group,
        last_assigned: Date.now(),
    }, { where: { group_id: DID_GROUP_ID } }).then(result => {
    }).catch(err => {
        console.log(err);
    });


};

module.exports = {
    number_route
};