const express = require('express');
const router = express.Router();

const DIDGroupController = require('../controller/DIDGroupController')

const { InfoLogger } = require("../utils/logger.js");
// AuthController.js
var VerifyToken = require('../config/verifyToken');

router.use(VerifyToken);

router.get('/', DIDGroupController.getDIDGroups);

router.post('/create', DIDGroupController.addGroup);

router.get('/:id', DIDGroupController.getGroup);

// gets group against customer
router.get('/customer/:id', DIDGroupController.getGroupAgainstCustomer);

// get number against group
router.get('/numbers/:id', DIDGroupController.getNumberAgainstGroup);

router.put('/:id', DIDGroupController.editGroup);

router.post('/assigncustomer', DIDGroupController.assignCustomer);


module.exports = router;