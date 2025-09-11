const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const { body } = require("express-validator");
const router = express.Router();
const { jsPDF } = require("jspdf");
const bcrypt =require("bcryptjs");
require("jspdf-autotable");

router.get("/loadState", async (req, res) => {
    backendController.selectQuery(`SELECT distinct state FROM maps where deleteon=?`,['0000-00-00'])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['state']}">${item['state']}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.get("/loadDistrict", async (req, res) => {
    const id = req.headers.data;
    backendController.selectQuery(`SELECT distinct districtname FROM maps where deleteon=? and state=?`,['0000-00-00',id])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['districtname']}">${item['districtname']}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

// POST route to handle form submission
router.post('/insert',async (req, res) => {
    const { name, lastname, dob, number1, number2, address, joinon, aadhaar, pannum, imgpath_profile, imgpath_proof, uniquekey, user_id, email, username, password, cpassword, state, district, area } = req.body;
    const userid = backendController.generateUniqueId();
    const data = { 
        userid,
        name, 
        lastname, 
        dob, 
        primaryphonenumber: number1, 
        secondaryphonenumber: number2, 
        address, 
        joindate: joinon, 
        aadhaar, 
        pan: pannum,
        profile: imgpath_profile,
        aadhaarproof: imgpath_proof,
        typeofpeople: "customer",
    };
    const Updatedata = { 
        name, 
        lastname, 
        dob, 
        primaryphonenumber: number1, 
        secondaryphonenumber: number2, 
        address, 
        joindate: joinon, 
        aadhaar, 
        pan: pannum,
        profile: imgpath_profile,
        aadhaarproof: imgpath_proof,
        typeofpeople: "customer",
    };
    const data_entity = {userid,entity_type:"customer",name,alias:name,doj:joinon,ph1:number1,ph2:number2,address,pan:pannum,profile:imgpath_profile,proof:imgpath_proof};
    const data_edit = {entity_type:"customer",name,alias:name,doj:joinon,ph1:number1,ph2:number2,address,pan:pannum,profile:imgpath_profile,proof:imgpath_proof};
    const exist_users = await backendController.selectQuery(`SELECT * FROM users where deleteon=? and branch=? and (primaryphonenumber=? or secondaryphonenumber=?) and uniqueid!=?`,['0000-00-00', userToken.site,number1,number1,uniquekey]);
    const exist_num2 = await backendController.selectQuery(`SELECT * FROM users where deleteon=? and branch=? and (primaryphonenumber=? or secondaryphonenumber=?) and uniqueid!=?`,['0000-00-00', userToken.site,number2,number2,uniquekey]);
    const exist_aadhar = await backendController.selectQuery(`SELECT * FROM users where deleteon=? and branch=? and aadhaar=? and uniqueid!=?`,['0000-00-00', userToken.site,aadhaar,uniquekey]);
    const exist_pan = await backendController.selectQuery(`SELECT * FROM users where deleteon=? and branch=? and pan=? and uniqueid!=?`,['0000-00-00', userToken.site,pannum,uniquekey]);
    if (!name || name.length < 3 || !/^[A-Za-z]+$/.test(name)) {
        return res.json({msg:"Name Invalid", msg_type : 'error', success: false });
    }
    if (!username) {
        return res.json({msg:"Username Invalid", msg_type : 'error', success: false });
    }
    if (!password) {
        return res.json({msg:"Password Invalid", msg_type : 'error', success: false });
    }
    if (password!=cpassword) {
        return res.json({msg:"Password Invalid", msg_type : 'error', success: false });
    }
    else if (!lastname || lastname.length < 1 || !/^[A-Za-z]+$/.test(lastname)) {
        return res.json({msg:"lastname Invalid", msg_type : 'error', success: false });
    }
    else if (backendController.isAtLeast18YearsOld(dob)) {
        return res.json({msg:"Date of Birth Invalid", msg_type : 'error', success: false });
    }
    else if (exist_users[0]) {
        return res.json({msg:"Primary Number Already Exist", msg_type : 'error', success: false });
    }
    else if (!number1 || number1.length > 13 || !/^\d+$/.test(number1)) {
        return res.json({msg:"Primary Number Invalid", msg_type : 'error', success: false });
    }
    else if (exist_num2[0] && number2) {
        return res.json({msg:"Secondary Number Already Exist", msg_type : 'error', success: false });
    }
    else if (!address || address.length < 11) {
        return res.json({msg:"Address Invalid", msg_type : 'error', success: false });
    }
    else if (exist_aadhar[0] && aadhaar) {
        return res.json({msg:"Aadhaar Number Already Exist", msg_type : 'error', success: false });
    }
    else if (exist_pan[0] && pannum) {
        return res.json({msg:"PAN Number Already Exist", msg_type : 'error', success: false });
    }
    let hashedPassword = await bcrypt.hash(password,8);
    // Proceed with the insertion logic
    if (uniquekey) {
        try {
            // Call the `deleted()` function with the necessary arguments
            const update = await backendController.updateQuery('users', Updatedata, `uniqueid=?`,[uniquekey]);
            const update1 = await backendController.updateQuery('entities', data_edit, `userid=?`,[user_id],"","id");
            const auth = await backendController.updateQuery('users_auth',{name, userid, username, password:hashedPassword}, `userid=?`,[userid]);
            const roles = await backendController.updateQuery('user_roles',{userid, roles:"customer", recognition:"customer", branches: userToken.site}, `userid=?`,[userid]);
            if(update.success && update1.success)
                res.json({msg: "Data Edited successfully", msg_type : 'success', success: true});
            else {
                console.log('Insert failed');
                res.json({
                    success: false,
                    msg: 'Error occurred while inserting data',
                    msg_type: 'error',
                    error: insertResponse.message || 'Unknown error'
                });
            }
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }   
    else
    {   
        try {
            const insertResponse = await backendController.insert({
                body: {
                    tableName: 'users',
                    data: data
                }
            });
            const insertResponse1 = await backendController.insert({body: {tableName: 'entities',data: data_entity, column:"id"}});
            const insertResponse2 = await backendController.insert({body: {tableName: 'users_auth',data: {name, userid, username, password:hashedPassword}}});
            const insertResponse3 = await backendController.insert({body: {tableName: 'user_roles',data: {userid, roles:"customer", recognition:"customer", branches: userToken.site}}});
            if (insertResponse.success)
                res.json({msg: "Data entered successfully", msg_type : 'success', success: true});
            else {
                console.log('Insert failed');
                res.json({
                    success: false,
                    msg: 'Error occurred while inserting data',
                    msg_type: 'error',
                    error: insertResponse.message || 'Unknown error'
                });
            }
        } catch (error) {
            console.error('Error during insert operation:', error);
            res.json({
                success: false,
                msg: 'Error occurred while inserting data',
                msg_type: 'error',
                error: error.message || 'Unknown error'
            });
        }
    }
});

module.exports = router;