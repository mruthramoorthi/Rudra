const express = require("express");
const userController = require('../controllers/users')
const retails = require('../controllers/retail')
const bcFun = require('../controllers/backend-functions');
const router = express.Router();

router.post('/register',userController.register);
router.post('/login',userController.login);
router.get("/logout",userController.logout);
router.get("/theme", userController.changeTheme);
router.post('/price',retails.price);
router.get("/bank",retails.bank);
router.get("/transactiontype", retails.transactionType);
router.get("/modes", retails.modes);
module.exports = router;
