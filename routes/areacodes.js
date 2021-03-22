const express = require('express');
const router = express.Router();
const { Areacode } = require("../utils/sequelize_db.js");
const bcrypt = require("bcrypt");
const { InfoLogger } = require("../utils/logger.js");

// Note: using `force: true` will drop the table if it already exists
//User.sync({ force: true }) // Now the `users` table in the database corresponds to the model definition
/* GET users listing. */
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
        const count = await Areacode.count();
        const areacodes = await Areacode.findAll();

        //InfoLogger("Get / All");
        res.status(200).send({
            total_count: count,
            data: areacodes
        });
    } catch (error) {
        console.error(error)
    }
});


module.exports = router;