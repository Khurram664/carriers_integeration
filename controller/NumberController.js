const Ready_Service = require('../services/on_ready_numbers');
const Windstream_Service = require('../services/windstream');
const Intelliquent_Service = require('../services/intelliquent');
const Number_Route_Service = require('../services/numberRoute');
const { Customer, Dr_gateway, Dr_rules, Areacode, Number_Inventory, DID_Group, Destination, Carrier, Dialplan, OutboundCarrier, History } = require("../utils/sequelize_db.js");
const { Op } = require("sequelize");
const dr_reload_function = require('../services/dr_reload');
const dp_reload_function = require('../services/dp_reload');
const _ = require('underscore');
var mysql = require('mysql');

const orderNumber = async (req, res) => {

    let params = req.body;

    let areacodes = params.areacodes;
    let customer = params.customer_id;
    let number_set = params.number_set;

    areacodes = [...new Set(areacodes)];

    //this will call ready numbers and return areacodes and numbers
    let { reserved_onready_numbers, reserved_onready_number_areacodes } = await Ready_Service(areacodes, customer, number_set, params);
    //number_route_service = Number_Route_Service.number_route(reserved_numbers, params);

    areacodes = _.difference(areacodes, reserved_onready_number_areacodes);

    let { intelliquent_reserved_numbers, intelliquent_reserved_areacodes } = await Intelliquent_Service(areacodes, number_set);

    areacodes = _.difference(areacodes, intelliquent_reserved_areacodes);

    reserved_numbers = await Windstream_Service(areacodes, number_set);

    reserved_numbers = reserved_numbers.concat(reserved_onready_numbers);
    reserved_numbers = reserved_numbers.concat(intelliquent_reserved_numbers);

    number_route_service = Number_Route_Service.number_route(req, reserved_numbers, params, reserved_onready_numbers, intelliquent_reserved_numbers);

    res.status(200).send({
        message: "Number Ordered Successfully",
        data: reserved_numbers
    });

}

const searchNumber = async (req, res) => {

    let params = req.body;
    let number_txt = params.number_txt;

    try {
        const numbers = await Number_Inventory.findAll({
            where: {
                number: {
                    [Op.like]: `%${number_txt}%`,
                }
            },
            include: [
                { model: Customer },
                { model: Carrier }
            ]
        });
        res.status(200).send(numbers);
    } catch (error) {
        console.error(error)
    }
}

const getNumbers = async (req, res) => {

    let { limit, offset } = req.query;

    if (limit == undefined)
        limit = 10;

    if (offset == undefined)
        offset = 0;

    try {

        const count = await Number_Inventory.count();
        const numbers = await Number_Inventory.findAll({
            include: [
                { model: Customer },
                { model: Carrier }
            ],
            offset: offset,
            limit: limit,
            order: [
                ['updated_at', 'DESC'],
            ]
        });
        res.send({
            total_count: count,
            numbers: numbers
        });
    } catch (error) {
        console.error(error)
    }
}

const addNumber = async (req, res) => {


    let params = req.body;
    let numbers = params.numbers;
    let customer_id = params.customer_id;
    var total_numbers = 0;

    var records = [];
    var history_records = [];

    for (const number of numbers) {

        let isnumberexists = await isNumberExists(number);

        if (isnumberexists) {
            //Update number status to unroute
            await Number_Inventory.update({ customer_id: customer_id }, { where: { number: number } });
        }
        else {
            records.push({ number: number, customer_id: customer_id, status: 'Resting' });
            history_records.push({ number: number, text: `Created by  ${req.adminName}` });
        }
    }

    try {
        const number_obj = await Number_Inventory.bulkCreate(records);
        const history_obj = await History.bulkCreate(history_records);

    } catch (error) {
        console.error(error)
    }

    total_numbers = records.length;

    res.status(200).send({
        message: `${total_numbers} numbers added manually`
    });
}

const getCustomerfromNumber = async (number) => {

    var customer_id;
    try {
        const number_obj = await Number_Inventory.findAll({
            where: {
                number: number
            },
            attributes: [`customer_id`],
            raw: true
        });
        customer_id = number_obj[0].customer_id;
    } catch (error) {
        console.error(error)
    }
    return customer_id;
}
const changeNumbers = async (req, res) => {

    let params = req.body;
    var numbers;
    var customer_id = params.customer_id;

    if (params.numbers) {
        numbers = params.numbers;
    }
    else if (params.group_id) {
        //Get numbers from group id
        try {
            group_numbers = await Number_Inventory.findAll({
                where: {
                    group_id: params.group_id
                },
                attributes: [`number`],
                raw: true
            });
            numbers = group_numbers.reduce((r, obj) => r.concat(obj.number), []);
            //res.status(200).send(numbers);
        } catch (error) {
            console.error(error)
        }
    }

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

        //create did group


        //update number status to routed

        await Number_Inventory.update({ customer_id: customer_id, group_id: null }, { where: { number: number } });

    });

    //call dr_reload
    await dr_reload_function();


    let length = numbers.length;

    console.log(`numbers length ${length}`)

    res.status(200).send({
        message: `${length} numbers routed`
    });

}
const routeNumbers = async (req, res) => {

    let params = req.body;
    var numbers;
    var customer_id;

    if (params.numbers) {
        numbers = params.numbers;
    }
    else if (params.group_id) {
        //Get numbers from group id
        try {
            group_numbers = await Number_Inventory.findAll({
                where: {
                    group_id: params.group_id
                },
                attributes: [`number`],
                raw: true
            });
            numbers = group_numbers.reduce((r, obj) => r.concat(obj.number), []);
            //res.status(200).send(numbers);
        } catch (error) {
            console.error(error)
        }
    }

    if (numbers == undefined) {
        res.status(500).send({
            message: `Please send either numbers array or group id`
        });
        return;
    }

    if (numbers.length > 0) {

        customer_id = await getCustomerfromNumber(numbers[0]);
    }
    else {

        res.status(500).send({
            message: `0 numbers routed`
        });
        return;
    }

    if (customer_id == null) {
        res.status(500).send({
            message: `You can only route numbers that have customer_id not Null`
        });
    }

    let pre_gwids = await Dr_gateway.findAll({
        where: {
            customer_id: customer_id
        },
        attributes: ['gwid'],
        raw: true
    }).then(function (gateways) {
        return _.map(gateways, function (gateway) { return gateway.gwid; })
    });

    if (pre_gwids.length > 0) {

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
            await routeNumber(number, customer_id, string_gwids, req);

        });

        //call dr_reload
        await dr_reload_function();

        let length = numbers.length;

        res.status(200).send({
            message: `${length} numbers routed`
        });
    }
    else {
        res.status(500).send({
            message: `Customer Destination doesnt exist`
        });
        return;
    }

}

const unrouteNumbers = async (req, res) => {


    let params = req.body;
    var numbers;

    if (params.numbers) {
        numbers = params.numbers;
        console.log(numbers);
    }
    else if (params.group_id) {

        //Get numbers from group id
        try {
            group_numbers = await Number_Inventory.findAll({
                where: {
                    group_id: params.group_id
                },
                attributes: [`number`],
                raw: true
            });
            numbers = group_numbers.reduce((r, obj) => r.concat(obj.number), []);
        } catch (error) {
            console.error(error)
        }
    }

    if (numbers == undefined) {
        res.status(500).send({
            message: `Please send either numbers array or group id`
        });
        return;
    }


    numbers.forEach(async number => {

        await Dr_rules.destroy({
            where: {
                prefix: number //this will be your id that you want to delete
            }
        }).then(function (rowDeleted) { // rowDeleted will return number of rows deleted
            if (rowDeleted === 1) {
                console.log('Deleted successfully');

            } else {
                console.log('Row not found successfully');
            }
        }, function (err) {
            console.log(err);
        });

        //Update number status to unroute
        await Number_Inventory.update({ routed: false }, { where: { number: number } });
        await History.create({ number: number, text: `Number  UnRouted by ${req.adminName}` });

    });

    //call dr_reload
    await dr_reload_function();

    let length = numbers.length;

    res.status(200).send({
        message: `${length} numbers unrouted`
    });
}


const mobilerouteNumbers = async (req, res) => {


    let params = req.body;
    var numbers;
    var customer_id;
    var msisdn = params.msisdn;
    var ip1 = params.carrier_ip;

    if (params.numbers) {
        numbers = params.numbers;
    }
    else if (params.group_id) {
        //Get numbers from group id
        if (params.group_id == '') {
            res.status(500).send({
                message: `Group Id can't be empty`
            });
            return;
        }
        try {
            group_numbers = await Number_Inventory.findAll({
                where: {
                    group_id: params.group_id
                },
                attributes: [`number`],
                raw: true
            });
            numbers = group_numbers.reduce((r, obj) => r.concat(obj.number), []);
            //res.status(200).send(numbers);
        } catch (error) {
            console.error(error)
        }
    }

    if (numbers == undefined) {
        res.status(500).send({
            message: `Please send either numbers array or group id`
        });
        return;
    }



    if (numbers.length > 0) {

        customer_id = await getCustomerfromNumber(numbers[0]);
    }
    else {

        res.status(200).send({
            message: `0 numbers routed`
        });
        return;
    }

    if (customer_id == null) {
        res.status(500).send({
            message: `You can only route numbers that have customer_id not Null`
        });
    }

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

        var number_obj = await Number_Inventory.findOne({
            where: {
                number: number
            }
        }).then(number_obj => { return number_obj });

        console.log(number_obj.routed);

        if (number_obj.routed == false) {

            await routeNumber(number, customer_id, string_gwids, req);
        }


        //Dialplan
        const count_prefix = await Dialplan.count({
            where: {
                match_exp: '^' + number + '$',
            }
        });

        if (count_prefix == 0) {

            await Dialplan.create({
                match_exp: '^' + number + '$',
                repl_exp: msisdn,
                dpid: 1,
                pr: 1,
                match_op: 1,
                match_flags: 0,
                disabled: 0,
                attrs: 'customer_ip=' + ip1
            });

        } else {
            //just update
            let dialplan_update = await Dialplan.update({
                repl_exp: msisdn,
                dpid: 1,
                pr: 1,
                match_op: 1,
                match_flags: 0,
                disabled: 0,
                attrs: 'customer_ip=' + ip1
            }, { where: { match_exp: '^' + number + '$' } });
        }

        //update number status to routed
        await Number_Inventory.update({ route_to_mobile: true }, { where: { number: number } });

        await History.create({ number: number, text: `Number Mobile Routed by ${req.adminName}` });

    });

    //call dr_reload
    await dr_reload_function();

    //call dp_reload
    await dp_reload_function();

    let length = numbers.length;

    console.log(`numbers length ${length}`)

    res.status(200).send({
        message: `${length} numbers routed`
    });

}

const routesipuriNumbers = async (req, res) => {


    let params = req.body;
    var numbers;
    var customer_id;
    var msisdn = params.msisdn;
    var ip1 = params.carrier_ip;

    if (params.numbers) {
        numbers = params.numbers;
    }
    else if (params.group_id) {
        //Get numbers from group id
        try {
            group_numbers = await Number_Inventory.findAll({
                where: {
                    group_id: params.group_id
                },
                attributes: [`number`],
                raw: true
            });
            numbers = group_numbers.reduce((r, obj) => r.concat(obj.number), []);
        } catch (error) {
            console.error(error)
        }
    }

    if (numbers.length > 0) {

        customer_id = await getCustomerfromNumber(numbers[0]);
    }
    else {

        res.status(200).send({
            message: `0 numbers routed`
        });
    }

    if (customer_id == null) {
        res.status(500).send({
            message: `You can only route numbers that have customer_id not Null`
        });
    }

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

    console.log(numbers[0]);

    numbers.forEach(async number => {

        var number_obj = await Number_Inventory.findOne({
            where: {
                number: number
            }
        }).then(number_obj => { return number_obj });

        console.log(number_obj.routed);

        if (number_obj.routed == false) {

            await routeNumber(number, customer_id, string_gwids, req);
        }


        //Dialplan
        const count_prefix = await Dialplan.count({
            where: {
                match_exp: '^' + number + '$',
            }
        });

        if (count_prefix == 0) {

            await Dialplan.create({
                match_exp: '^' + number + '$',
                repl_exp: msisdn,
                dpid: 1,
                pr: 1,
                match_op: 1,
                match_flags: 0,
                disabled: 0,
                attrs: 'customer_ip=' + ip1
            });

        } else {
            //just update
            let dialplan_update = await Dialplan.update({
                repl_exp: msisdn,
                dpid: 1,
                pr: 1,
                match_op: 1,
                match_flags: 0,
                disabled: 0,
                attrs: 'customer_ip=' + ip1
            }, { where: { match_exp: '^' + number + '$' } });
        }

        //update number status to routed
        await Number_Inventory.update({ route_to_sip_uri: true }, { where: { number: number } });

    });

    //call dr_reload
    await dr_reload_function();

    //call dp_reload
    await dp_reload_function();

    let length = numbers.length;

    console.log(`numbers length ${length}`)

    res.status(200).send({
        message: `${length} numbers routed`
    });

}

const getNumbersfromParams = async (params) => {

    return ['201'];
}

const isNumberExists = async (number) => {

    const count_number = await Number_Inventory.count({
        where: {
            number: number
        }
    });

    console.log(`${count_number} isNumberExists`);

    if (count_number == 0)
        return false;
    else
        return true;
}


const routeNumber = async (number, customer_id, string_gwids, req) => {

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
    await Number_Inventory.update({ routed: true }, { where: { number: number } });

    //history
    await History.create({ number: number, text: `Number Routed by ${req.adminName}` });


}


const assignNumbers = async (req, res) => {

    let params = req.body;
    var numbers;
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
    var campaign = params.campaign;

    var description = params.description;

    var route = params.route;
    var areafill = params.areafill;

    if (params.numbers) {

        numbers = params.numbers;

        if (numbers.length == 0) {
            res.status(500).send({
                message: `Number List is empty`
            });
            return;
        }
    }
    else if (params.group_id) {
        //Get numbers from group id
        try {
            group_numbers = await Number_Inventory.findAll({
                where: {
                    group_id: params.group_id
                },
                attributes: [`number`],
                raw: true
            });
            numbers = group_numbers.reduce((r, obj) => r.concat(obj.number), []);
            //res.status(200).send(numbers);
        } catch (error) {
            console.error(error)
        }
    }

    if (numbers.length > 0) {

        customer_id = await getCustomerfromNumber(numbers[0]);
    }
    else {

        res.status(200).send({
            message: `0 numbers assigned`
        });

    }

    if (customer_id == null) {
        res.status(500).send({
            message: `You can only assign numbers that have customer_id not Null`
        });
    }

    var customer_obj = await Customer.findOne({
        where: {
            id: customer_id
        }
    }).then(customer => { return customer });

    var customer_name = customer_obj.name;


    if (customer_obj.dbserver != '' && customer_obj.dbserver != null) {

        const connection = mysql.createConnection({
            host: customer_obj.dbserver,
            user: customer_obj.dbuser,
            password: customer_obj.dbpass,
            database: 'asterisk'
        });

        try {

            await connection.connect((err) => {
                if (err) {
                    res.status(500).send({
                        message: `Some error occured during connecting to client DB`
                    });
                    return;
                }
                else {
                    console.log('Connected!');
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

                        await Number_Inventory.update({ assigned: true, vicidid: true }, { where: { number: number } });
                        //history
                        await History.create({ number: number, text: `Number Assigned to ${customer_name} by ${req.adminName}` });

                        let length = numbers.length;

                        res.status(200).send({
                            message: `${length} numbers assigned`
                        });

                    });
                }

            });
        }
        catch (e) {
            res.status(500).send({
                message: `Some Error occured`
            });
            return;
        }
    }
    else {
        res.status(500).send({
            message: `No DB Server provided against this customer`
        });
        return;
    }




}

const unassignNumbers = async (req, res) => {


    let params = req.body;
    var numbers;

    if (params.numbers) {

        numbers = params.numbers;
        if (numbers.length == 0) {
            res.status(500).send({
                message: `Number List is empty`
            });
            return;
        }
    }
    else if (params.group_id) {
        //Get numbers from group id
        try {
            group_numbers = await Number_Inventory.findAll({
                where: {
                    group_id: params.group_id
                },
                attributes: [`number`],
                raw: true
            });
            numbers = group_numbers.reduce((r, obj) => r.concat(obj.number), []);
            //res.status(200).send(numbers);
        } catch (error) {
            console.error(error)
        }
    }

    if (numbers.length > 0) {

        customer_id = await getCustomerfromNumber(numbers[0]);
    }
    else {

        res.status(200).send({
            message: `0 numbers assigned`
        });

    }

    var customer_obj = await Customer.findOne({
        where: {
            id: customer_id
        }
    }).then(customer => { return customer });

    var customer_name = customer_obj.name;


    if (customer_obj.dbserver != '' && customer_obj.dbserver != null) {

        const connection = mysql.createConnection({
            host: customer_obj.dbserver,
            user: customer_obj.dbuser,
            password: customer_obj.dbpass,
            database: 'asterisk'
        });

        console.log("Going to connect!");

        connection.connect();


        numbers.forEach(async number => {

            connection.query(`Delete from vicidial_campaign_cid_areacodes where outbound_cid =\'${number}\'`, (error, results, fields) => {
                if (error) throw error;
                //console.log('Result: ', results[0]);
                console.log('result');
                console.log(results);
            });

            connection.query(`Delete from vicidial_inbound_dids where did_pattern =\'${number}\'`, (error, results, fields) => {
                if (error) throw error;
                //console.log('Result: ', results[0]);
                console.log('result');
                console.log(results);
            });

            //Update number status to unroute
            await Number_Inventory.update({ assigned: false, vicidid: false }, { where: { number: number } });

            //history
            await History.create({ number: number, text: `Number Deleted from ${customer_name} by ${req.adminName}` });

        });

        let length = numbers.length;

        res.status(200).send({
            message: `${length} numbers unassigned`
        });
    }
}

const getcarrierIp = async (req, res) => {

    try {
        const outbound_carrier = await OutboundCarrier.findOne();

        res.status(200).send({
            outbound_carrier
        });
    } catch (error) {
        console.error(error)
    }
}

const replaceNumber = async (req, res) => {

    let params = req.body;
    let numbers = params.numbers;

    numbers.forEach(async number => {

        let areacode = number.substring(0, 3);
        let areacodes = [areacode];
        let customer = params.customer_id;
        let number_set = 1;

        //this will call ready numbers and return areacodes and numbers
        let { reserved_onready_numbers, reserved_onready_number_areacodes } = await Ready_Service(areacodes, customer, number_set, params);
        //number_route_service = Number_Route_Service.number_route(reserved_numbers, params);
        reserved_onready_number_areacodes.push(areacode);

        areacodes = _.difference(areacodes, reserved_onready_number_areacodes);

        if (reserved_onready_numbers.length == 0) {
            reserved_numbers = await Windstream_Service(areacodes, customer, number_set);
        }

        reserved_numbers = reserved_numbers.concat(reserved_onready_numbers);

        if (reserved_numbers.length > 0) {

            number_route_service = Number_Route_Service.number_route(reserved_numbers, params, reserved_onready_numbers);
            await removeNumber(number);

        } else {

            res.status(200).send({
                message: `0 numbers replaced`
            });
            return;
        }
    })

}

const removeNumber = async (number) => {

    await Dr_rules.destroy({
        where: {
            prefix: number //this will be your id that you want to delete
        }
    }).then(function (rowDeleted) { // rowDeleted will return number of rows deleted
        if (rowDeleted === 1) {
            console.log('Deleted successfully');
        } else {
            console.log('Row not found successfully');
        }
    }, function (err) {
        console.log(err);
    });

    await Dialplan.destroy({
        where: {
            match_exp: '^' + number + '$', //this will be your id that you want to delete
        }
    }).then(function (rowDeleted) { // rowDeleted will return number of rows deleted
        if (rowDeleted === 1) {
            console.log('Deleted successfully');
        } else {
            console.log('Row not found successfully');
        }
    }, function (err) {
        console.log(err);
    });

    //Update number status to unroute
    await Number_Inventory.update({ routed: false, group_id: null, route_to_sip_uri: false, route_to_mobile: false }, { where: { number: number } });

}

const removeNumbers = async (req, res) => {


    let params = req.body;
    var numbers;

    if (params.numbers) {
        numbers = params.numbers;
        console.log(numbers);
    }
    else if (params.group_id) {
        //Get numbers from group id
        try {
            group_numbers = await Number_Inventory.findAll({
                where: {
                    group_id: params.group_id
                },
                attributes: [`number`],
                raw: true
            });
            numbers = group_numbers.reduce((r, obj) => r.concat(obj.number), []);
            //res.status(200).send(numbers);
        } catch (error) {
            console.error(error)
        }
    }

    if (numbers.length > 0) {

        customer_id = await getCustomerfromNumber(numbers[0]);
    }
    else {

        res.status(200).send({
            message: `0 numbers assigned`
        });

    }

    var customer_obj = await Customer.findOne({
        where: {
            id: customer_id
        }
    }).then(customer => { return customer });


    numbers.forEach(async number => {
        //Update number status to unroute
        await removeNumber(number);
    });

    //call dr_reload
    await dr_reload_function();

    var customer_name = customer_obj.name;

    if (customer_obj.dbserver != '' && customer_obj.dbserver != null) {

        const connection = mysql.createConnection({
            host: customer_obj.dbserver,
            user: customer_obj.dbuser,
            password: customer_obj.dbpass,
            database: 'asterisk'
        });

        connection.connect();

        numbers.forEach(async number => {

            connection.query(`Delete from vicidial_campaign_cid_areacodes where outbound_cid =\'${number}\'`, (error, results, fields) => {
                if (error) throw error;
                //console.log('Result: ', results[0]);
            });

            connection.query(`Delete from vicidial_inbound_dids where did_pattern =\'${number}\'`, (error, results, fields) => {
                if (error) throw error;
                //console.log('Result: ', results[0]);
            });

            //Update number status to unroute
            await Number_Inventory.update({ assigned: false, status: 'Resting', routed: false, vicidid: false, viciaccid: false, date_removed: Date.now(), customer_id: null, group_id: null }, { where: { number: number } });
            //history
            await History.create({ number: number, text: `Number Removed from ${customer_name} by ${req.adminName}` });
        });

        let length = numbers.length;

        //call dp_reload
        await dp_reload_function();

        res.status(200).send({
            message: `${length} numbers removed`
        });
    }
}

const getHistory = async (req, res) => {

    let params = req.body;
    let number = params.number;

    let { limit, offset } = req.query;

    if (limit == undefined)
        limit = 10;

    if (offset == undefined)
        offset = 0;

    try {
        const count = await History.count({
            where: {
                number: number
            }
        });
        const histories = await History.findAll({
            where: {
                number: number
            },
            offset: offset,
            limit: limit,
            order: [
                ['updated_at', 'DESC'],
            ]
        });
        res.status(200).send({
            total_count: count,
            data: histories
        });
    } catch (error) {
        console.error(error)
    }
}

module.exports = {
    orderNumber,
    getNumbers,
    searchNumber,
    routeNumbers,
    unrouteNumbers,
    assignNumbers,
    unassignNumbers,
    removeNumbers,
    changeNumbers,
    mobilerouteNumbers,
    getcarrierIp,
    routesipuriNumbers,
    replaceNumber,
    routeNumber,
    addNumber,
    getHistory
}