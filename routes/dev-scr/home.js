const express = require("express");
const userController = require('../../controllers/users');
const backendController = require('../../controllers/backend-functions');
const router = express.Router();
const htmls = require('../../helpers');
const { jsPDF } = require("jspdf");
require("jspdf-autotable");
router.get("/loadRightsPage", userController.isLoggedIn,async (req, res) => {
    const check_lastLoginOfCookie = await backendController.selectQuery('select * from login_users where deleteon=? and cookie=? order by uniqueid desc', ['0000-00-00', req.user.cookie]);
      if(check_lastLoginOfCookie[0])
      {
        const users_rights = await backendController.selectQuery('select group_concat(roles) as item from user_roles where deleteon=? and userid=? and branches=? order by uniqueid desc', ['0000-00-00', check_lastLoginOfCookie[0].userid, check_lastLoginOfCookie[0].site]);
        const rolesList = users_rights[0].item.split(','); // Convert it into an array
        const access_files = await backendController.selectQuery("select t1.path as path,t2.pagename from all_pages_roles as t1 join all_pages_details as t2 on t1.path=t2.path where t1.deleteon=? and t1.role in (?) and t1.status='1' group by t1.path,t2.path", ['0000-00-00', rolesList]);
        let options_arr = [];
        access_files.forEach(item => {
            let optionTag = null;
            let lastOne = item['path'].split("\\")[item['path'].split("\\").length - 1];
            if(lastOne.endsWith(".hbs"))
            {
                optionTag = `<option value="${item['path']}">${backendController.capitalizeFirstLetters(item["pagename"])}</option>`;
                options_arr.push(optionTag);
            }
        });
        
        const html = options_arr.join('');
        res.json({ success: true, response: html });
      }
    // backendController.selectQuery(`SELECT distinct path FROM all_pages_roles where deleteon=? and role=?`,['0000-00-00',role])
    // .then(results => {
    //     let options_arr = [];
    //     results.forEach(item => {
    //         let optionTag = null;
    //         let lastOne = item['path'].split("\\")[item['path'].split("\\").length - 1];
    //         if(lastOne.endsWith(".hbs"))
    //         {
    //             optionTag = `<option value="${item['path']}">${lastOne}</option>`;
    //             options_arr.push(optionTag);
    //         }
    //     });
        
    //     const html = options_arr.join('');
    //     res.json({ success: true, response: html });
    // })
    // .catch(error => {
    //     console.error('Error:', error);  // Handle rejection properly here
    //     res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    // });
});
module.exports = router;