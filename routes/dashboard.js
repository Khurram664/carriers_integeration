const express = require('express');
const router = express.Router();
const { Customer, Destination, Dr_gateway, DID_Group, Number_Inventory } = require("../utils/sequelize_db.js");
const { InfoLogger } = require("../utils/logger.js");

const call_number_total = require('../services/call_total');
// AuthController.js
var VerifyToken = require('../config/verifyToken');

router.use(VerifyToken);

router.get('/', async (req, res) => {

    var no_of_customers;
    try {
        no_of_customers = await Customer.count();

    } catch (error) {
        console.error(error)
    }

    var number_count;
    try {
        number_count = await Number_Inventory.count();

    } catch (error) {
        console.error(error)
    }

    total_no_of_calls = await call_number_total();

    let dashboard = {
        no_of_customers: no_of_customers,
        number_count: number_count,
        total_no_of_calls: total_no_of_calls
    };
    res.send(dashboard);


});



module.exports = router;