var jwt = require('jsonwebtoken');
const config = require("../config/auth");
const { User } = require("../utils/sequelize_db");

verifyToken = async (req, res, next) => {

    var token = req.headers['x-access-token'];
    if (!token)
        return res.status(403).send({ auth: false, message: 'No token provided.' });

    await jwt.verify(token, config.secret, async function (err, decoded) {
        if (err)
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

        // if everything good, save to request for use in other routes
        req.adminId = decoded.id;

        let userObj = await User.findOne({
            where: {
                id: decoded.id
            }
        })

        req.adminName = userObj.name;


        next();
    });
}

module.exports = verifyToken;