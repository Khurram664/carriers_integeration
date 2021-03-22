const { Customer, Dr_gateway, Dr_rules, Areacode, Number_Inventory, DID_Group } = require("../utils/sequelize_db.js");
const _ = require('underscore');

var mysql = require('mysql');

const moment = require('moment');

const dr_reload_function = require('../services/dr_reload');
const { Op } = require("sequelize");

const route_ready_numbers = async (numbers, customer_id) => {

    let pre_gwids = await Dr_gateway.findAll({
        where: {
            customer_id: customer_id
        },
        attributes: ['gwid'],
        raw: true
    }).then(function (gateways) {
        return _.map(gateways, function (gateway) { return gateway.gwid; })
    });

    let unique_gwids = [...new Set(pre_gwids)];

    var string_gwids = unique_gwids.join(",");

    var customer_obj = await Customer.findOne({
        where: {
            id: customer_id
        }
    }).then(customer => { return customer });

    var traffic_order = customer_obj.traffic_order;

    if (traffic_order == 'loadbalance') {

        var length_of_gwids = unique_gwids.length;
        var value_of_each_balance = Math.floor(100 / length_of_gwids);
        var gwids_balance = [];

        unique_gwids.forEach(value => {
            gwids_balance.push(`${value}=${value_of_each_balance}`);
        });
        string_gwids = gwids_balance.join(",");
    }

    numbers.forEach(async number => {

        const count_prefix = await Dr_rules.count({
            where: {
                prefix: number
            }
        });

        if (count_prefix == 0) {

            let dr_rules_insert = await Dr_rules.create({
                prefix: number,
                gwlist: string_gwids,
                groupid: '1',
                attrs: `id_cc_card=${customer_id}`
            });

        } else {
            //just update
            let dr_rules_update = await Dr_rules.update({ gwlist: string_gwids, attrs: `id_cc_card=${customer_id}` }, { where: { prefix: number } });
        }

        //update number status to routed
        await Number_Inventory.update({ routed: true, status: 'Assigned', customer_id: customer_id }, { where: { number: number } });

    });

    //call dr_reload
    await dr_reload_function();
}

const assign_ready_numbers = async (numbers, customer_id) => {

    var customer_obj = await Customer.findOne({
        where: {
            id: customer_id
        }
    }).then(customer => { return customer });

    if (customer_obj.dbserver != '' && customer_obj.dbserver != null) {

        const connection = mysql.createConnection({
            host: customer_obj.dbserver,
            user: customer_obj.dbuser,
            password: customer_obj.dbpass,
            database: 'asterisk'
        });

        connection.connect();

        numbers.forEach(async number => {

            if (accidonly == false) {

                console.log('accidonly == false');

                let number_count = await connection.query(`SELECT count(*) as number_count from vicidial_inbound_dids where did_pattern=${number} `, (error, results, fields) => {
                    if (error) throw error;

                    if (results[0].number_count >= 1) {
                        //Update query
                        connection.query(`Update vicidial_inbound_dids Set  did_description=\'${description}\',
                                did_route=\'${route}\',extension=\'${extension}\',
                                user=\'${extension}\',group_id=\'${extension}\',menu_id=\'${location}\',server_ip=\'${serverip}\',
                                phone=\'${phone}\',voicemail_ext=\'${voicemail}\',
                                call_handle_method=\'${callhandle}\',list_id=${listid},
                                filter_inbound_number=\'${filterinbound}\',filter_phone_group_id=\'${filterphonegroupid}\'
                                where did_pattern = \'${number}\'`, (error, results, fields) => {
                                if (error) throw error;
                                //console.log('Result: ', results[0]);
                            });

                    }
                    else {
                        //Insert Query
                        connection.query(`Insert into vicidial_inbound_dids(did_pattern,did_description,did_route,extension,user,group_id,menu_id,server_ip,phone,voicemail_ext,call_handle_method,list_id,filter_inbound_number,filter_phone_group_id) 
                            values(\'${number}\',\'${description}\',\'${route}\',\'${extension}\',\'${extension}\',\'${extension}\',\'${location}\',\'${serverip}\',\'${phone}\',\'${voicemail}\',\'${callhandle}\',${listid},\'${filterinbound}\',\'${filterphonegroupid}\')`, (error, results, fields) => {
                                if (error) throw error;
                                //console.log('Result: ', results[0]);
                            });

                        VICIDID = true;

                    }
                    return results[0].number_count;
                });
            }

            if (accidonly == false) {

                let number_count = await connection.query(`SELECT count(*) as number_count from vicidial_campaign_cid_areacodes where outbound_cid=${number} `, (error, results, fields) => {
                    if (error) throw error;

                    if (results[0].number_count >= 1) {
                        //Update query

                        connection.query(`Update vicidial_campaign_cid_areacodes Set  
                                campaign_id=\'${campaign}\',
                                cid_description=\'${description}\',
                                active=\'${active}\'
                                where outbound_cid = \'${number}\'`, (error, results, fields) => {
                                if (error) throw error;
                                //console.log('Result: ', results[0]);
                            });

                    }
                    else {
                        //Insert Query
                        let number_substr = number.substring(0, 3);
                        connection.query(`Insert into vicidial_campaign_cid_areacodes(campaign_id,areacode,outbound_cid,cid_description,active) 
                            Values(\'${campaign}\',\'${number_substr}\',\'${number}\',\'${description}\',\'${active}\')`, (error, results, fields) => {
                                if (error) throw error;
                                //console.log('Result: ', results[0]);
                            });

                        VICIACCID = true;

                    }
                    return results[0].number_count;
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
                                if (error) throw error;

                            });
                    })
                }
            }
            //update number status to routed

            await Number_Inventory.update({ assigned: true, vicidid: 'Y' }, { where: { number: number } });

        });
    }
}


const on_ready_number = async (areacodes, customer, numberset, params) => {

    var reserved_onready_number_areacodes = [];
    var reserved_onready_numbers = [];

    for (const areacode of areacodes) {


        const search_numbers = await Number_Inventory.findAll({
            where: {
                number: {
                    [Op.like]: `${areacode}%`
                },
                status: 'Ready'
            },
            attributes: [`number`],
            raw: true
        });

        numbers = search_numbers.reduce((r, obj) => r.concat(obj.number), []);

        if (numbers.length >= numberset) {

            //await route_ready_numbers(numbers, customer);

            //if (params.asteriskentry == true) {
            //    await assign_ready_numbers(numbers, customer);
            //}
            reserved_onready_number_areacodes.push(areacode);
            reserved_onready_numbers.push(numbers[0]);
        }

    };

    return {
        reserved_onready_numbers: reserved_onready_numbers,
        reserved_onready_number_areacodes: reserved_onready_number_areacodes
    };


}

module.exports = on_ready_number;