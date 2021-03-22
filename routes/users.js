const express = require('express');
const router = express.Router();
const { User } = require("../utils/sequelize_db.js");
const bcrypt = require("bcrypt");
const config = require("../config/auth.js");
var jwt = require("jsonwebtoken");

router.get('/', async (req, res) => {

  try {
    const users = await User.findAll();
    res.send(users);
  } catch (error) {
    console.error(error)
  }
});


router.post('/create', async (req, res) => {

  try {

    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      role: req.body.role
    });

    res.status(200).send({
      message: "User created Successfully",
      data: user
    });

  } catch (error) {
    console.error(error)
    res.status(500).send("Some went wrong")
  }
});


router.post('/login', async (req, res) => {

  try {

    User.findOne({
      where: {
        email: req.body.email
      }
    }).then(user => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }
      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 86400 // 24 hours
      });

      res.status(200).send({
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.role,
        accessToken: token
      });
    });

  } catch (error) {
    console.error(error)
    res.status(500).send("Some went wrong")
  }
});

module.exports = router;
