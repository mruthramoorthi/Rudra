const express = require("express");
const backendController = require('../controllers/backend-functions');
const htmls = require('../helpers');
const router = express.Router();
const bcrypt =require("bcryptjs");
const jwt = require("jsonwebtoken");


router.get("/AppData", async (req, res) => {
    const userId = req.query.userid;
    const token = req.query.token;
    console.log(token)
    // howmany branch // state // district
    let login_details = [];
    if(userId!="null")
        login_details = await backendController.selectQuery("select * from login_users where deleteon=? and userid=? and cookie=? order by uniqueid desc", ['0000-00-00', userId, token]);
    if(userId=="null")
    {
        let options_comp = {};
        const results = await backendController.selectQuery(`SELECT distinct companyname,code FROM companies where deleteon=? order by companyname asc`,['0000-00-00'])
        results.forEach(item => {
            options_comp[item.companyname] = item.code; // Or any other value
        });
        let options_obj = {};
        const maps = await backendController.selectQuery(`SELECT distinct state FROM maps where deleteon=? order by state asc`,['0000-00-00'])
        maps.forEach(item => {
            options_obj[item.state] = item.state; // Or any other value
        });
        const getStateDistrictMap = async () => {
            try {
                // Get all state-district pairs in one query
                const results = await backendController.selectQuery(
                `SELECT state, districtname 
                FROM maps 
                WHERE deleteon=? 
                ORDER BY state ASC, districtname ASC`,
                ['0000-00-00']
                );

                // Transform to the desired structure
                const stateMap = {};
                
                    results.forEach(item => {
                    const { state, districtname } = item;
                    
                    // Initialize state if not exists
                    if (!stateMap[state]) {
                        stateMap[state] = { districts: {} };
                    }
                    
                    // Add district (key and value same)
                    stateMap[state].districts[districtname] = districtname;
                    });

                    return stateMap;

            } catch (error) {
                console.error('Error:', error);
                throw error;
            }
        };
        // Usage
        const stateDistrictMap = await getStateDistrictMap();
        return res.json({ states: options_obj, companys: options_comp, districts: stateDistrictMap, login:"0" });
    }
    else
    {
        let options_comp = {};
        const results = await backendController.selectQuery(`SELECT distinct companyname,code FROM companies where deleteon=? order by companyname asc`,['0000-00-00'])
        results.forEach(item => {
            options_comp[item.companyname] = item.code; // Or any other value
        });
        let options_obj = {};
        const maps = await backendController.selectQuery(`SELECT distinct state FROM maps where deleteon=? order by state asc`,['0000-00-00'])
        maps.forEach(item => {
            options_obj[item.state] = item.state; // Or any other value
        });
        const getStateDistrictMap = async () => {
            try {
                // Get all state-district pairs in one query
                const results = await backendController.selectQuery(
                `SELECT state, districtname 
                FROM maps 
                WHERE deleteon=? 
                ORDER BY state ASC, districtname ASC`,
                ['0000-00-00']
                );

                // Transform to the desired structure
                const stateMap = {};
                
                    results.forEach(item => {
                    const { state, districtname } = item;
                    
                    // Initialize state if not exists
                    if (!stateMap[state]) {
                        stateMap[state] = { districts: {} };
                    }
                    
                    // Add district (key and value same)
                    stateMap[state].districts[districtname] = districtname;
                    });

                    return stateMap;

            } catch (error) {
                console.error('Error:', error);
                throw error;
            }
        };
        // Usage
        const stateDistrictMap = await getStateDistrictMap();
    
        const savings_numbers = await backendController.selectQuery(`SELECT GROUP_CONCAT(savings_number) AS sav FROM customer_savings_enroll WHERE deleteon=? AND id=?`,['0000-00-00', login_details[0].userid]);
        const completed_savings = await backendController.selectQuery(`SELECT * FROM customer_savings_enroll WHERE deleteon=? AND id=? AND closed=?`,['0000-00-00', login_details[0].userid, '1']);
        let savings_number_list = "";
        console.log(savings_numbers)
        if(savings_numbers[0].sav)
        savings_number_list = savings_numbers[0].sav.split(','); // Convert it into an array
        const savings_transactions = await backendController.selectQuery(`SELECT * FROM savings_transactions WHERE deleteon=? AND savingnumber IN (?) ORDER BY uniqueid DESC`, ['0000-00-00', savings_number_list]) || [];
        const savings_finished = await backendController.selectQuery(`SELECT * FROM closed_savings where deleteon=? and id=?`,['0000-00-00', login_details[0].userid]);
        const savings_enroll = await backendController.selectQuery(`SELECT * FROM customer_savings_enroll where deleteon=? and id=? and closed=?`,['0000-00-00', login_details[0].userid, '0']);
        const company = await backendController.selectQuery(`SELECT distinct companyname,code FROM companies where deleteon=? and code=?`,['0000-00-00', login_details[0].site])
        const gold = await backendController.selectQuery(`SELECT price FROM rate_master WHERE deleteon=? AND branch=? and category=?`, ['0000-00-00', login_details[0].site, "gold22k"]);
        const silver = await backendController.selectQuery(`SELECT price FROM rate_master WHERE deleteon=? AND branch=? and metal=? order by uniqueid desc`, ['0000-00-00', login_details[0].site, "silver"]);
        const exist_users = await backendController.selectQuery(`SELECT * FROM users where deleteon=? and userid=? and branch=?`,['0000-00-00', userId, login_details[0].site]);
        return res.json({
                    state: exist_users[0].state, 
                    company: company[0].companyname, 
                    code: company[0].code, 
                    pin: exist_users[0].pincode, 
                    gender: exist_users[0].gender, 
                    email: exist_users[0].email, 
                    address: exist_users[0].address, 
                    phone: exist_users[0].primaryphonenumber, 
                    district: exist_users[0].district, 
                    branch: exist_users[0].branch, 
                    photo: exist_users[0].profile ? "" : "", 
                    goldprice: gold[0].price, 
                    silverprice: silver[0].price, 
                    userid: exist_users[0].userid,
                    login: "1", 
                    auth: login_details[0].cookie,
                    username: login_details[0].username,
                    firstname: exist_users[0].name,
                    lastname: exist_users[0].lastname,
                    dob: exist_users[0].dob,
                    landmark: exist_users[0].landmark,
                    states: options_obj,
                    companys: options_comp,
                    districts: stateDistrictMap,
                    finished_schemes: savings_finished,
                    enroll_schemes: savings_enroll,
                    transactions: savings_transactions,
                    completed_savings: completed_savings
                });
    }
});

router.post("/userRegistration", async (req, res) => {
    let options_comp = {};
        const results = await backendController.selectQuery(`SELECT distinct companyname,code FROM companies where deleteon=? order by companyname asc`,['0000-00-00'])
        results.forEach(item => {
            options_comp[item.companyname] = item.code; // Or any other value
        });
        let options_obj = {};
        const maps = await backendController.selectQuery(`SELECT distinct state FROM maps where deleteon=? order by state asc`,['0000-00-00'])
        maps.forEach(item => {
            options_obj[item.state] = item.state; // Or any other value
        });
        const getStateDistrictMap = async () => {
            try {
                // Get all state-district pairs in one query
                const results = await backendController.selectQuery(
                `SELECT state, districtname 
                FROM maps 
                WHERE deleteon=? 
                ORDER BY state ASC, districtname ASC`,
                ['0000-00-00']
                );

                // Transform to the desired structure
                const stateMap = {};
                
                    results.forEach(item => {
                    const { state, districtname } = item;
                    
                    // Initialize state if not exists
                    if (!stateMap[state]) {
                        stateMap[state] = { districts: {} };
                    }
                    
                    // Add district (key and value same)
                    stateMap[state].districts[districtname] = districtname;
                    });

                    return stateMap;

            } catch (error) {
                console.error('Error:', error);
                throw error;
            }
        };
        // Usage
        const stateDistrictMap = await getStateDistrictMap();
    
    const { firstname, lastname, dob, gender, phone, address, imgpath_profile, email, username, password, state, district, area, branch, pin } = req.body;
    const userid = backendController.generateUniqueId();
    const joinon = backendController.getCurrentDate();
    const data = { 
        userid,
        name: firstname,
        lastname,
        dob,
        primaryphonenumber: phone,
        address,
        joindate: joinon,
        // profile: imgpath_profile,
        typeofpeople: "customer",
        branch,
        landmark: area,
        gender,
        state, 
        district,
        pincode: pin,
        email
    };
    const data_entity = {userid,entity_type:"customer",name: firstname,alias: firstname,doj: joinon,ph1: phone,address};
    const exist_users = await backendController.selectQuery(`SELECT * FROM users where deleteon=? and branch=? and (primaryphonenumber=? or secondaryphonenumber=?)`,['0000-00-00', branch,phone,phone]);
    const exist_user_name = await backendController.selectQuery(`SELECT * FROM users_auth where deleteon=? and username=?`,['0000-00-00', username]);
    const exist_num2 = await backendController.selectQuery(`SELECT * FROM users where deleteon=? and (primaryphonenumber=? or secondaryphonenumber=?)`,['0000-00-00',phone,phone]);
    // const exist_aadhar = await backendController.selectQuery(`SELECT * FROM users where deleteon=? and branch=? and aadhaar=? and uniqueid!=?`,['0000-00-00', branch,aadhaar,uniquekey]);
    // const exist_pan = await backendController.selectQuery(`SELECT * FROM users where deleteon=? and branch=? and pan=? and uniqueid!=?`,['0000-00-00', branch,pannum,uniquekey]);
    if (!firstname || firstname.length < 3 || !/^[A-Za-z]+$/.test(firstname)) {
        return res.json({msg:"Name Invalid", msg_type : 'error', success: false });
    }
    else if (!lastname || lastname.length < 1 || !/^[A-Za-z]+$/.test(lastname)) {
        return res.json({msg:"lastname Invalid", msg_type : 'error', success: false });
    }
    else if(gender=="nd" && !gender){
        return res.json({msg:"Please Select Gender", msg_type : 'error', success: false });
    }
    else if (backendController.isAtLeast18YearsOld(dob)) {
        return res.json({msg:"Date of Birth Invalid!.. Above 18 Years Old People Only", msg_type : 'error', success: false });
    }
    else if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.json({msg:"Email is Invalid", msg_type: 'error', success: false });
    }
    else if (!address || address.length < 11) {
        return res.json({msg:"Address Invalid", msg_type : 'error', success: false });
    }
    else if (!phone || phone.length > 13 || !/^\d+$/.test(phone)) {
        return res.json({msg:"Primary Number Invalid", msg_type : 'error', success: false });
    }
    else if(exist_num2[0]){
        return res.json({msg:"Phone Number Already Exist", msg_type : 'error', success: false });
    }
    else if(state=="nd" || !state){
        return res.json({msg:"Please Select State", msg_type : 'error', success: false });
    }
    else if(district=="nd" || !district){
        return res.json({msg:"Please Select State", msg_type : 'error', success: false });
    }
    else if(!area){
        return res.json({msg:"Area is Invalid", msg_type : 'error', success: false });
    }
    else if(branch=="nd" && !branch){
        return res.json({msg:"Please Select Branch", msg_type : 'error', success: false });
    }
    if (!username || exist_user_name[0]) {
        return res.json({msg:"Username Invalid", msg_type : 'error', success: false });
    }
    if (!password) {
        return res.json({msg:"Password Invalid", msg_type : 'error', success: false });
    }
    else if (exist_users[0]) {
        return res.json({msg:"Primary Number Already Exist", msg_type : 'error', success: false });
    }
    let hashedPassword = await bcrypt.hash(password,8);
    
    try {
        const gold = await backendController.selectQuery(`SELECT price FROM rate_master WHERE deleteon=? AND branch=? and category=?`, ['0000-00-00', branch, "gold22k"]);
        const silver = await backendController.selectQuery(`SELECT price FROM rate_master WHERE deleteon=? AND branch=? and metal=? order by uniqueid desc`, ['0000-00-00', branch, "silver"]);
        const company = await backendController.selectQuery(`SELECT distinct companyname,code FROM companies where deleteon=? and code=?`,['0000-00-00', branch])
        const insertResponse = await backendController.insert_app({
            body: {
                tableName: 'users',
                data: data
            }
        });
        const token = jwt.sign({ id: userid }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN,
            });
        const insertResponse1 = await backendController.insert_app({body: {tableName: 'entities',data: data_entity, column:"id"}});
        const insertResponse2 = await backendController.insert_app({body : {tableName: "login_users", data: {userid, name: firstname, username: username, site: branch, rights: "customer", cookie:token,status:1 , statuswords:"active"}}}, res);
        const insertResponse3 = await backendController.insert_app({body: {tableName: 'users_auth',data: {name: firstname, userid, username, password:hashedPassword}}});
        const insertResponse4 = await backendController.insert_app({body: {tableName: 'user_roles',data: {userid, roles:"customer", recognition:"customer", branches: branch}}});
        if (insertResponse.success && insertResponse1.success&& insertResponse2.success && insertResponse3.success && insertResponse4.success)
            return res.json({
                                msg: {
                                    state: state, 
                                    company: company[0].companyname, 
                                    code: company[0].code, 
                                    pin: pin, 
                                    gender: gender, 
                                    email: email, 
                                    address: address, 
                                    phone: phone, 
                                    district: district, 
                                    branch: branch, 
                                    photo: imgpath_profile ? "" : "", 
                                    goldprice: gold[0].price, 
                                    silverprice: silver[0].price, 
                                    userid: userid,
                                    login: "1", 
                                    auth: token,
                                    username: username,
                                    firstname, firstname,
                                    lastname: lastname,
                                    dob: dob,
                                    landmark: area,
                                    states: options_obj,
                                    companys: options_comp,
                                    districts: stateDistrictMap
                                }, 
                                msg_type : 'success', 
                                success: true
                            });
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
});

router.post("/newRegistration", async (req, res) => {
    res.json({ message: 'This is your API response' });
});

router.post("/payNow", async (req, res) => {
    console.log(req.body)
});

router.post("/logIn", async (req, res) => {
    const {who,pass} = req.body;
    // howmany branch // state // district
    const login_details = await backendController.selectQuery("select * from users_auth where deleteon=? and username=? order by uniqueid desc", ['0000-00-00', who]);

    if (!who){
        return res.json({msg:"Username is Invalid", msg_type : 'error', success: false });
    }
    if (!pass){
        return res.json({msg:"Password is Invalid", msg_type : 'error', success: false });
    }
    bcrypt.compare(pass, login_details[0].password, (err, passwordMatch) => {
        if (err || !passwordMatch)
            return res.json({msg: "Incorrect Password", msg_type: "error", success: true});
    });
    const savings_numbers = await backendController.selectQuery(`SELECT GROUP_CONCAT(savings_number) AS sav FROM customer_savings_enroll WHERE deleteon=? AND id=?`,['0000-00-00', login_details[0].userid]);
    const completed_savings = await backendController.selectQuery(`SELECT * FROM customer_savings_enroll WHERE deleteon=? AND id=? AND closed=?`,['0000-00-00', login_details[0].userid, '1']);
    let savings_number_list = ""
    if(savings_numbers[0].sav)
    savings_number_list = savings_numbers[0].sav.split(','); // Convert it into an array
    const savings_transactions = await backendController.selectQuery(`SELECT * FROM savings_transactions where deleteon=? and savingnumber in (?) order by uniqueid desc`,['0000-00-00', savings_number_list]);
    const exist_users = await backendController.selectQuery(`SELECT * FROM users where deleteon=? and userid=?`,['0000-00-00', login_details[0].userid]);
    const savings_finished = await backendController.selectQuery(`SELECT * FROM closed_savings where deleteon=? and id=?`,['0000-00-00', login_details[0].userid]);
    const savings_enroll = await backendController.selectQuery(`SELECT * FROM customer_savings_enroll where deleteon=? and id=? and closed=?`,['0000-00-00', login_details[0].userid, '1']);
    const company = await backendController.selectQuery(`SELECT distinct companyname,code FROM companies where deleteon=? and code=?`,['0000-00-00', exist_users[0].branch])
    const gold = await backendController.selectQuery(`SELECT price FROM rate_master WHERE deleteon=? AND branch=? and category=?`, ['0000-00-00', exist_users[0].branch, "gold22k"]);
    const silver = await backendController.selectQuery(`SELECT price FROM rate_master WHERE deleteon=? AND branch=? and metal=? order by uniqueid desc`, ['0000-00-00', exist_users[0].branch, "silver"]);
    const token = jwt.sign({ id: exist_users[0].userid }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
    let options_comp = {};
        const results = await backendController.selectQuery(`SELECT distinct companyname,code FROM companies where deleteon=? order by companyname asc`,['0000-00-00'])
        results.forEach(item => {
            options_comp[item.companyname] = item.code; // Or any other value
        });
        let options_obj = {};
        const maps = await backendController.selectQuery(`SELECT distinct state FROM maps where deleteon=? order by state asc`,['0000-00-00'])
        maps.forEach(item => {
            options_obj[item.state] = item.state; // Or any other value
        });
        const getStateDistrictMap = async () => {
            try {
                // Get all state-district pairs in one query
                const results = await backendController.selectQuery(
                `SELECT state, districtname 
                FROM maps 
                WHERE deleteon=? 
                ORDER BY state ASC, districtname ASC`,
                ['0000-00-00']
                );

                // Transform to the desired structure
                const stateMap = {};
                
                    results.forEach(item => {
                    const { state, districtname } = item;
                    
                    // Initialize state if not exists
                    if (!stateMap[state]) {
                        stateMap[state] = { districts: {} };
                    }
                    
                    // Add district (key and value same)
                    stateMap[state].districts[districtname] = districtname;
                    });

                    return stateMap;

            } catch (error) {
                console.error('Error:', error);
                throw error;
            }
        };
        // Usage
        const stateDistrictMap = await getStateDistrictMap();
    
    await backendController.insert_app({body : {tableName: "login_users", data: {userid: exist_users[0].userid, name: exist_users[0].name, username: login_details[0].username, site: exist_users[0].branch, rights: "customer", cookie:token, status:1, statuswords:"active"}}}, res);
    return res.json({
                msg: {
                        state: exist_users[0].state, 
                        company: company[0].companyname, 
                        code: company[0].code, 
                        pin: exist_users[0].pincode, 
                        gender: exist_users[0].gender, 
                        email: exist_users[0].email, 
                        address: exist_users[0].address, 
                        phone: exist_users[0].primaryphonenumber, 
                        district: exist_users[0].district, 
                        branch: exist_users[0].branch, 
                        photo: exist_users[0].profile ? "" : "", 
                        goldprice: gold[0].price, 
                        silverprice: silver[0].price, 
                        userid: exist_users[0].userid,
                        login: "1", 
                        auth: token,
                        username: login_details[0].username,
                        firstname: exist_users[0].name,
                        lastname: exist_users[0].lastname,
                        dob: exist_users[0].dob,
                        landmark: exist_users[0].landmark,
                        states: options_obj,
                        companys: options_comp,
                        districts: stateDistrictMap,
                        finished_schemes: savings_finished,
                        enroll_schemes: savings_enroll,
                        transactions: savings_transactions,
                        completed_savings: completed_savings
                },
                msg_type: "success",
                success: true
            });
});

router.post("/userUpdate", async (req, res) => {
    res.json({ message: 'This is your API response' });
});

router.post("/forgotPassword", async (req, res) => {
    res.json({ message: 'This is your API response' });
});

router.post("/payment", async (req, res) => {
    res.json({ message: 'This is your API response' });
});

router.post("/rating", async (req, res) => {
    const {rating, feedback, staffs, branch} = req.body;
    if(!feedback)
        return res.json({msg: "Please Give us a Valid Feedback", msg_type: "error", success: true})
    try{
        const insert_feed = await backendController.insert_app({body: {tableName:"rating", data: {feedback, stars: rating, staffs, branch: branch}}})
        if(insert_feed.success)
            return res.json({msg: "Thank You! For Your Valueable Feedback", msg_type: "error", success: true})
        else
            return res.json({msg: "Your Feedback Not Posted Successfully! contact a developer", msg_type: "error", success: true})
    }
    catch(e)
    {
        console.error('Error App:', e);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    }
});

function call_me()
{
    return "hi buddy";
}
call_me();

module.exports = router;