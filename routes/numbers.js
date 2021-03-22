const express = require('express');
const router = express.Router();
const { Customer, Destination, Dr_gateway } = require("../utils/sequelize_db.js");

const NumberController = require('../controller/NumberController')

const { InfoLogger } = require("../utils/logger.js");

// AuthController.js
var VerifyToken = require('../config/verifyToken');

router.use(VerifyToken);

router.get('/', NumberController.getNumbers);

router.post('/add', NumberController.addNumber);

router.post('/order', NumberController.orderNumber);

router.post('/search', NumberController.searchNumber);

router.post('/route', NumberController.routeNumbers);

router.post('/unroute', NumberController.unrouteNumbers);

router.post('/assign', NumberController.assignNumbers);

router.post('/unassign', NumberController.unassignNumbers);

router.post('/remove', NumberController.removeNumbers);

router.post('/mobileroute', NumberController.mobilerouteNumbers);

router.post('/sipuriroute', NumberController.routesipuriNumbers);

router.post('/change', NumberController.changeNumbers);

router.post('/replace', NumberController.replaceNumber);

router.get('/get_carrier_ip', NumberController.getcarrierIp);

router.post('/history', NumberController.getHistory);


module.exports = router;