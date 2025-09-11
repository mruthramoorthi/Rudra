const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const userController = require('../controllers/users');
const backendController = require('../controllers/backend-functions');
const { json } = require('stream/consumers');

// Static routes
router.get("/login", userController.isLoggedIn, (req, res) => {
    if (req.user) userController.logout(req, res);
    res.render('login');
});
router.get("/register", userController.isLoggedIn, (req, res) => {
    if (req.user) userController.logout(req, res);
    res.render('register');
});
router.get("/forgot-password", userController.isLoggedIn, (req, res) => {
    if (req.user) userController.logout(req, res);
    res.render('forgot-password');
});
router.get("/profile", userController.isLoggedIn, (req, res) => {
    if (req.user) res.render('profile', { user: req.user });
    else res.redirect('/login');
});
router.get(["/home",'/'], userController.isLoggedIn, (req, res) => {
    if (req.user) res.render("home", { user: req.user });
    else res.redirect('/login');
});
router.get("/404", (req, res) => {
    res.render("404");
});
router.get("/500", (req, res) => {
    res.render("500");
});
module.exports = router;
