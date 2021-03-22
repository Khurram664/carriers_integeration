const { DID_Group, Number_Inventory, Customer, Dr_gateway, Dr_rules } = require("../utils/sequelize_db.js");
const dr_reload_function = require('../services/dr_reload');
const dp_reload_function = require('../services/dp_reload');

const isValidIp = destination_addr => (/^(?:(?:^|\.)(?:2(?:5[0-5]|[0-4]\d)|1?\d?\d)){4}$/.test(destination_addr) ? true : false);

const deleteDestination = async (req, res) => {

    let params = req.body;
    let destination_addr = params.destination_ip;
    let customer_id = params.customer_id;


    //do not let destination to be deleted if there is only destination left against a customer

    //first check customer exists in dr_gateways table
    const dr_gateways = await Dr_gateway.findAll({
        where: {
            customer_id: customer_id
        }
    });

    if (dr_gateways.length <= 1) {
        res.status(500).send({ message: "You can't delete since customer needs to have one destination atleast." });
    }

    Dr_gateway.destroy({
        where: {
            customer_id: customer_id,
            address: destination_addr,
        }
    }).then(async (rowDeleted) => { // rowDeleted will return number of rows deleted
        if (rowDeleted === 1) {

            console.log('Deleted successfully');
            //Update Dr_rules

            let dr_gateways_gwids = await Dr_gateway.findAll({
                where: {
                    customer_id: customer_id
                },
                attributes: [`gwid`],
                raw: true
            });

            gwids = dr_gateways_gwids.reduce((r, obj) => r.concat(obj.gwid), []);

            gwids_string = gwids.join(',');

            var customer_obj = await Customer.findOne({
                where: {
                    id: customer_id
                }
            }).then(customer => { return customer });

            var traffic_order = customer_obj.traffic_order;

            if (traffic_order == 'loadbalance') {
                var length_of_gwids = gwids.length;
                var value_of_each_balance = Math.floor(100 / length_of_gwids);
                var gwids_balance = [];

                gwids.forEach(value => {
                    gwids_balance.push(`${value}=${value_of_each_balance}`);
                });
                gwids_string = gwids_balance.join(",");
            }

            await Dr_rules.update({ gwlist: gwids_string }, { where: { attrs: `id_cc_card=${customer_id}` } });

            res.status(200).send({ message: "Destination Deleted Successfully" });
        } else {
            res.status(404).send({ message: "Destination Not Found" });
        }
    }, function (err) {
        console.log(err);
    });

}

const addDestination = async (req, res) => {

    let params = req.body;
    let destination_addr = params.destination_ip;
    let customer_id = params.customer_id;

    if (isValidIp(destination_addr) == false) {
        res.status(500).send("Please send valid Ip Address.");
        return;
    }

    //first check customer exists in dr_gateways table
    const dr_gateways = await Dr_gateway.findAll({
        where: {
            customer_id: customer_id
        }
    });

    var dr_gateways_params;
    //if not exists
    //customer_id value  into 100 insert into gwid,
    if (dr_gateways.length == 0) {

        let gwid = customer_id * 100;
        dr_gateways_params = {
            gwid: gwid.toString(),
            customer_id: customer_id,
            address: destination_addr,
            strip: 0,
            type: 0,
            pri_prefix: null,
            attrs: null,
            socket: null,
            description: null
        };

    } else {

        let pre_gwids = [];
        dr_gateways.forEach(element => {
            let pre_gwid = parseInt(element.gwid);
            pre_gwids.push(pre_gwid);
        });

        var max = pre_gwids.reduce(function (a, b) {
            return Math.max(a, b);
        });
        max_gwid = max + 1;
        dr_gateways_params = {
            gwid: max_gwid.toString(),
            customer_id: customer_id,
            address: destination_addr,
            strip: 0,
            type: 0,
            pri_prefix: null,
            attrs: null,
            socket: null,
            description: null
        };

    }

    try {
        const dr_gateway = await Dr_gateway.create(dr_gateways_params);

        //Update Dr_rules

        let dr_gateways_gwids = await Dr_gateway.findAll({
            where: {
                customer_id: customer_id
            },
            attributes: [`gwid`],
            raw: true
        });

        gwids = dr_gateways_gwids.reduce((r, obj) => r.concat(obj.gwid), []);

        gwids_string = gwids.join(',');

        var customer_obj = await Customer.findOne({
            where: {
                id: customer_id
            }
        }).then(customer => { return customer });

        var traffic_order = customer_obj.traffic_order;

        if (traffic_order == 'loadbalance') {
            var length_of_gwids = gwids.length;
            var value_of_each_balance = Math.floor(100 / length_of_gwids);
            var gwids_balance = [];

            gwids.forEach(value => {
                gwids_balance.push(`${value}=${value_of_each_balance}`);
            });
            gwids_string = gwids_balance.join(",");
        }

        await Dr_rules.update({ gwlist: gwids_string }, { where: { attrs: `id_cc_card=${customer_id}` } })

        res.status(200).send({
            message: "dr_gateway created Successfully",
            data: dr_gateway
        });
    } catch (error) {
        console.error(error)
        res.status(500).send("Something went wrong while creating new dr_gateway");
    }
}

const editDestination = async (req, res) => {

    let params = req.body;
    let new_destination_addr = params.new_destination_ip;
    let old_destination_addr = params.old_destination_ip;
    let customer_id = params.customer_id;


    //do not let destination to be deleted if there is only destination left against a customer

    //first check customer exists in dr_gateways table
    const dr_gateways = await Dr_gateway.findAll({
        where: {
            address: old_destination_addr
        }
    });

    console.log(dr_gateways);

    if (dr_gateways.length == 0) {
        res.status(500).send({ message: "You can't Edit destination IP that doesn't exists." });
        return;
    }

    Dr_gateway.update({ address: new_destination_addr }, {
        where: {
            customer_id: customer_id,
            address: old_destination_addr,
        }
    }).then(async () => { // rowDeleted will return number of rows deleted

        console.log('Edited successfully');
        //Update Dr_rules

        let dr_gateways_gwids = await Dr_gateway.findAll({
            where: {
                customer_id: customer_id
            },
            attributes: [`gwid`],
            raw: true
        });

        gwids = dr_gateways_gwids.reduce((r, obj) => r.concat(obj.gwid), []);

        gwids_string = gwids.join(',');

        var customer_obj = await Customer.findOne({
            where: {
                id: customer_id
            }
        }).then(customer => { return customer });

        var traffic_order = customer_obj.traffic_order;

        if (traffic_order == 'loadbalance') {
            var length_of_gwids = gwids.length;
            var value_of_each_balance = Math.floor(100 / length_of_gwids);
            var gwids_balance = [];

            gwids.forEach(value => {
                gwids_balance.push(`${value}=${value_of_each_balance}`);
            });
            gwids_string = gwids_balance.join(",");
        }

        await Dr_rules.update({ gwlist: gwids_string }, { where: { attrs: `id_cc_card=${customer_id}` } });

        //call dr_reload
        await dr_reload_function();

        res.status(200).send({ message: "Destination Edited Successfully" });
    }, function (err) {
        console.log(err);
    });

}


module.exports = {
    deleteDestination,
    addDestination,
    editDestination
}