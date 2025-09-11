const express = require("express");
const backendController = require('../../controllers/backend-functions');
const userController = require('../../controllers/users');
const router = express.Router();

router.get("/loadcomp", userController.isLoggedIn, async (req, res) => {
    backendController.selectQuery(`SELECT distinct t1.companyname,t1.code FROM companies as t1 join user_roles as t2 on t2.branches=t1.code where t1.deleteon=? and t2.deleteon=? and t2.userid=?`,['0000-00-00','0000-00-00',req.user.userid])
    .then(results => {
        const html = backendController.loadOptions(results, 'companyname', 'code');
        res.json({ success: true, response: html, msg: "ok" });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg: "Server Error" });
    });
});

router.post("/changeShop", userController.isLoggedIn, async (req, res) => {
    try {
        // Fetch the login user data from the database based on userid and deleteon value
        const login_user_role = await backendController.selectQuery(
            `SELECT * FROM user_roles where deleteon=? and userid=? and branches=?`,
            ['0000-00-00', req.user.userid, req.body.company]
        );
        const login_user = await backendController.selectQuery(
            `SELECT * FROM login_users where deleteon=? and userid=?`,
            ['0000-00-00', req.user.userid]
        );
        
        // Update the company/site value in the login_users table
        const update = await backendController.updateQuery(
            "login_users",
            { site: req.body.company, rights: login_user_role[0].roles },
            'uniqueid=?',
            [login_user[0].uniqueid]
        );
        
        // Optionally, you can call the isLoggedIn function here again if needed
        await userController.isLoggedIn(req, res, () => {
            // This callback ensures that after the isLoggedIn function, you continue your response flow.
            res.json({
                success: true,
                msg_type: "success",
                msg: "Company Changed Successfully"
            });
        });

    } catch (error) {
        console.error(error);
        res.json({
            success: false,
            msg_type: "error",
            msg: "An error occurred while changing the company"
        });
    }
});


module.exports = router;