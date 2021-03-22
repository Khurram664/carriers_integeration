const express = require('express');
const router = express.Router();
const { Customer, Destination, Dr_gateway, DID_Group } = require("../utils/sequelize_db.js");
const CustomerController = require('../controller/CustomerController')
const { InfoLogger } = require("../utils/logger.js");

const isValidIp = destination_addr => (/^(?:(?:^|\.)(?:2(?:5[0-5]|[0-4]\d)|1?\d?\d)){4}$/.test(destination_addr) ? true : false);

// AuthController.js
var VerifyToken = require('../config/verifyToken');

router.use(VerifyToken);

router.get('/', async (req, res) => {

    let { limit, offset } = req.query;

    if (limit == undefined)
        limit = 10;

    if (offset == undefined)
        offset = 0;

    try {
        const count = await Customer.count();
        const customers = await Customer.findAll({
            offset: offset,
            limit: limit,
            order: [
                ['updated_at', 'DESC'],
            ]
        });
        res.status(200).send({
            total_count: count,
            data: customers
        });
    } catch (error) {
        console.error(error)
    }
});

router.post('/create', async (req, res) => {

    let params = req.body;
    try {
        const customer = await Customer.create(params);

        let customer_id = customer.id;
        let group_id = parseInt(customer_id) * 1000;

        group_params = {
            "group_id": group_id,
            "customer_id": customer_id,
            "campaign": 'Main',
            "description": "CID",
            "did_route": "IN_GROUP",
            "list_id": '995',
            "did_location": "CallerID",
            "call_handle_method": "CIDLOOKUP",
            "filter_inbound_number": "GROUP",
            "filter_phone_group_id": "blocklist"
        };

        const did_group = await DID_Group.create(group_params);

        res.status(200).send({
            message: "Customer created Successfully",
            data: customer
        });
    } catch (error) {
        console.error(error)
        res.status(500).send("Some went wrong")
    }
});

router.put('/:id', async (req, res) => {

    const { id } = req.params;
    let body = req.body;

    Customer.update(
        body,
        { where: { id: id } }
    ).then(result => {
        res.status(200).send({
            message: "Customer Updated"
        });
    }).catch(err => {
        console.log(err);
        res.status(500).send({
            message: "Some error occured during update."
        });
    })
});

router.post('/add-destination', CustomerController.addDestination);
router.post('/delete-destination', CustomerController.deleteDestination);
router.post('/edit-destination', CustomerController.editDestination);


router.delete('/:id', async (req, res) => {

    const { id } = req.params;

    Customer.destroy({
        where: {
            id: id //this will be your id that you want to delete
        }
    }).then(function (rowDeleted) { // rowDeleted will return number of rows deleted
        if (rowDeleted === 1) {
            console.log('Deleted successfully');
            res.status(200).send({ message: "Customer Deleted Successfully" });
        } else {
            res.status(404).send({ message: "Customer Not Found" });
        }
    }, function (err) {
        console.log(err);
    });
});



router.get('/destinationsbycustomer/:id', async (req, res) => {

    const { id } = req.params;
    try {
        const destinations = await Dr_gateway.findAll({
            where: {
                customer_id: id
            }
        });
        res.status(200).send(destinations);

    } catch (error) {
        console.error(error)
        res.status(500).send("Something went wrong");
    }
});

router.get('/dr_gateways/', async (req, res) => {

    try {
        const dr_gateways = await Dr_gateway.findAll();
        res.status(200).send(dr_gateways);

    } catch (error) {
        console.error(error)
        res.status(500).send("Something went wrong");
    }
});


module.exports = router;