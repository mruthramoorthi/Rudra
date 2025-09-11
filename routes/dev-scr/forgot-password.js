const express = require("express");
const bcrypt =require("bcryptjs");
const backendController = require('../../controllers/backend-functions');
const router = express.Router();
const htmls = require('../../helpers');
const { jsPDF } = require("jspdf");
require("jspdf-autotable");

// // POST route to handle form submission
// router.post('/check-user',async (req, res) => {
//     const { phone } = req.body;
//     let html = "";
//     if (phone && phone.length==10) {
//         try {
//             // Call the `deleted()` function with the necessary arguments
//             const check = await backendController.selectQuery('select * from users where deleteon=? and primaryphonenumber=? order by uniqueid desc',['0000-00-00',phone]);
//             const logins = await backendController.selectQuery('select * from users_auth where deleteon=? and userid=? order by uniqueid desc',['0000-00-00',check[0].userid]);
//             const OTP = backendController.generateOTP();
//             const insert = await backendController.insert({body:{tableName:"otp",data:{ userid:check[0].userid, mobilenumber:phone, otp:OTP, status:"initiated" }}});
//             if (logins[0])
//             {
//                 html += htmls.createInputElement({type:"number", id:"otp", placeholder:"OTP for "+phone});
//                 html += '<button type="button" id="verify" name="verify">Verify</button><input type="hidden" id="mobile" name="mobile" value="'+phone+'">';
//                 res.json({ success: true, response: html, msg: "ok" });
//             }
//             else
//                 return res.json({msg:"You Are Not Registered as a User", msg_type : 'error', success: false });
//         } catch (error) {
//           console.error('Error in deleting:', error.message);
//           return res.json({msg:"You Are Not Registered as a User", msg_type : 'error', success: false });
//         }
//     }
//     else
//         return res.json({msg:"Enter Phone Number to Get OTP", msg_type : 'error', success: false });
// });

// // POST route to handle form submission
// router.post('/otpVerify',async (req, res) => {
//     const { mobile,otp } = req.body;
//     let html = "";
//     if (otp) {
//         try {
//             // Call the `deleted()` function with the necessary arguments
//             const check = await backendController.selectQuery('select * from users where deleteon=? and primaryphonenumber=? order by uniqueid desc',['0000-00-00',mobile]);
//             const logins = await backendController.selectQuery('select * from otp where deleteon=? and userid=? and otp=? order by uniqueid desc',['0000-00-00',check[0].userid,otp]);
//             const insert = await backendController.updateQry(`update otp set status=? where deleteon=? and userid=? and mobilenumber=? order by uniqueid desc`,['success','0000-00-00',check[0].userid,mobile]);
//             if (logins[0])
//             {
//                 html += `<div><center><h3>New Credentials</h3></center> `;
//                 html += htmls.createInputElement({ type:"text", id:"username", placeholder:"Username"});
//                 html += htmls.createInputElement({ type:"text", id:"password", placeholder:"Password"});
//                 html += '<button type="button" id="change" name="change">Update Login Credentioals</button><input type="hidden" id="userid" name="userid" value="'+check[0].userid+'"></div>';
//                 res.json({ success: true, response: html, msg: "ok" });
//             }
//             else
//                 return res.json({msg:"Entered OTP Was Wrong", msg_type : 'error', success: false });
//         } catch (error) {
//           console.error('Error in deleting:', error.message);
//           return res.json({msg:"You Are Not Registered as a User", msg_type : 'error', success: false });
//         }
//     }
//     else
//         return res.json({msg:"Enter Phone Number to Get OTP", msg_type : 'error', success: false });
// });

// // POST route to handle form submission
// router.post('/change',async (req, res) => {
//     const { username,password,userid } = req.body;
//     const check = await backendController.selectQuery('select * from users_auth where deleteon=? and userid!=? and username=? order by uniqueid desc',['0000-00-00',userid,username]);
//     if(!username)
//         return res.json({msg:"Please Enter Username", msg_type : 'error', success: false });
//     if(!password)
//         return res.json({msg:"Please Enter Strong Password", msg_type : 'error', success: false });
//     if(check[0])
//         return res.json({msg:"This Username is Already Exist", msg_type : 'error', success: false });
//     let enc_pass = await bcrypt.hash(password,8);
//     try {
//         const insert = await backendController.updateQuery("users_auth",{username,password:enc_pass},"userid=? and deleteon=?",[userid,'0000-00-00']);
//         if (insert)
//         {
//             return res.json({ msg: "Credentials Changes Updated...", msg_type: "success", success: true });
//         }
//         else
//             return res.json({msg:"Entered OTP Was Wrong", msg_type : 'error', success: false });
//     } catch (error) {
//         console.error('Error in deleting:', error.message);
//         return res.json({msg:"You Are Not Registered as a User", msg_type : 'error', success: false });
//     }
// });

module.exports = router;
