const bcrypt =require("bcryptjs");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const bcFun = require('./backend-functions');
const htmls = require('../helpers');
const { getDb, initializeDatabase } = require('../db-connection');
const { table } = require("console");

initializeDatabase(); // Call this in app.js for initialization
const db = getDb(); // Safely get the connection
exports.login = (req,res) => {
    try{
        const { username, password } = req.body;
        if(!username || !password){
            return res.status(400).render('login',{msg:'Please Enter Your Email and Password',msg_type: "error"});
        }

        db.query('select * from users_auth where username=?',[username],(error,result)=>{
            // const user_roles = bcFun.selectQuery("select group_concat(roles) as role,group_concat(branches) as branch user_roles where deleteon=? and userid=?",['0000-00-00',result[0].userid]);
            if(!result || result.length <= 0)
                return res.status(401).render("login", {
                    msg: "Please Enter Your Email or Password",
                    msg_type: "error"
                });
            else 
                if (!(bcrypt.compare(password, result[0].password)))
                    return res.status(401).render("login", {
                        msg: "Please Enter Your Email or Password Incorrect...",
                        msg_type: "error"
                    });
                else
                {
                    bcFun.selectQuery("select branches from user_roles where userid=? and deleteon=? and branches!='' order by uniqueid asc", [result[0].userid, '0000-00-00'])
                    .then((access_branch) => {
                        bcrypt.compare(password, result[0].password, (err, passwordMatch) => {
                        if (err || !passwordMatch) {
                            return res.status(401).render("login", {
                                msg: "Incorrect Password",
                                msg_type: "error"
                            });
                        }
                        else
                        {
                            bcFun.selectQuery("select group_concat(roles) as roles from user_roles where userid=? and deleteon=? and branches=? order by uniqueid desc", [result[0].userid, '0000-00-00',access_branch[0].branches])
                            .then((access_files) => {
                                if(!access_files[0].roles)
                                    return res.status(401).render("login", {
                                        msg: "You have no Rights to Access",
                                        msg_type: "error"
                                    });
                                const id = result[0].userid;
                                const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {
                                    expiresIn: process.env.JWT_EXPIRES_IN,
                                });
                                const cookieOptions = {
                                    expires: new Date(
                                        Date.now() +
                                            process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                                        ),
                                        httpOnly: true,
                                };
                                let theme = "style";
                                bcFun.selectQuery(`SELECT theme, COUNT(*) AS theme_count FROM login_users WHERE userid=? GROUP BY theme ORDER BY theme_count DESC LIMIT 1`,[result[0].userid])
                                .then((themes) => {
                                if(themes[0])
                                    theme = themes[0].theme;
                                else
                                    theme = "style";              
                                });
                                bcFun.insert({body : {tableName: "login_users", data: {userid: result[0].userid, name: result[0].name, username: result[0].username, site: access_branch[0].branches, rights: access_files[0].roles, cookie:token, theme,status:1, statuswords:"active"}}}, res);
                                res.cookie("userToken",token,cookieOptions);
                                if(req.session.routePath)
                                {
                                    res.status(200).redirect(req.session.routePath);
                                    req.session.routePath="/";
                                }
                                else
                                {
                                    res.status(200).redirect("/");
                                }
                            }).catch((err) => {
                                console.error('Error fetching user roles1:', err);
                                return res.status(500).redirect("/500");
                            });
                        }
                    });
                    }).catch((err) => {
                        console.error('Error fetching user roles2:', err);
                        return res.status(500).redirect("/500");
                    });
                }
        });
    }
    catch (error) {
        console.log("user login "+error);
    }
}

exports.changeTheme = async (req, res) => {
    try {
        const login_user = await bcFun.selectQuery(
            `SELECT * FROM login_users where deleteon=? and userid=? and cookie=?`,
            ['0000-00-00', userToken.userid, req.cookies.userToken]
        );
        let new_theme = "style";
        if(!login_user[0].theme||login_user[0].theme==="style")
            new_theme = "dstyle";
        // Update the company/site value in the login_users table
        const update = await bcFun.updateQuery(
            "login_users",
            { theme: new_theme},
            'uniqueid=?',
            [login_user[0].uniqueid]
        );
        // Optionally, you can call the isLoggedIn function here again if needed
        res.status(200).redirect("/home");

    } catch (error) {
        console.error('Error fetching login details for theme:', error);
        return res.status(500).redirect("/500");
    }
};

exports.register= async (req,res)=>{
    const hash = bcFun.generateUniqueId();
    const {name,email,password,confirm_password} = req.body;
    db.query('select email from users_auth where email=?',
        [email],
        async (error,result)=>{
        if(error)
        {
            console.log("query error "+error);
        }
        if(result.length>0)
        {
            return res.render('register',{msg:'Email id already Taken.',msg_type: "error"});
        }
        else if(password !== confirm_password)
        {
            return res.render('register',{msg:'Password do not Match.',msg_type: "error"});
        }
        let hashedPassword = await bcrypt.hash(password,8);
        db.query('insert into users_auth set ?', 
        { name: name,email: email,password: hashedPassword, userid: hash },
    (error, result) => {
        if(error){
            console.log("Insert Query "+error);
        }
        else{
            return res.render('login',{msg:'User Registration Success.',msg_type: "success"});
        }
    }
    );
   });
};

exports.isLoggedIn = async (req, res, next) => {
    if(req.cookies.userToken){
        try {
            const decode = await promisify(jwt.verify)(
                req.cookies.userToken,
                process.env.JWT_SECRET
            );
            const results = await bcFun.selectQuery("select * from login_users where deleteon=? and userid=? order by uniqueid desc", ['0000-00-00', decode.id]);
            // console.log(results[0])
            // const branches = await bcFun.selectQuery("select * from user_roles where deleteon=? and userid=? and branches=? order by uniqueid desc", ['0000-00-00',  results[0].userid,  results[0].site]);
            // console.log(branches[0])
            // const roles = branches.map(item => item.roles);  // Extract roles
            // const page = await bcFun.selectQuery("select * from page_access_logs where deleteon=? and user_uniqueid=? and rights=? order by uniqueid desc", ['0000-00-00', results[0].userid, results[0].rights]);
            // console.log(page[0])
            const company = await bcFun.selectQuery("select * from companies where deleteon=? and code=? order by uniqueid desc", ['0000-00-00', results[0].site]);
            // if (page[0]) {
            //     const pagePath = page[0].page_name.replaceAll('/masters', '').replaceAll("/", "\\") + ".hbs";
            //     const rights = await bcFun.selectQuery("select * from page_feature_rights where deleteon=? and path=? and role in (?) order by uniqueid desc", ['0000-00-00', pagePath, roles]);
            //     if (rights && rights.length > 0) {
            //         results[0] = { ...results[0], rights_result: rights };  // This merges the rights object into req.user
            //     }
            // }
            if (!results[0]) {
                return next();
            }
            // Capitalize company name and add it to user info
            results[0].company = bcFun.capitalizeFirstLetters(company[0].companyname);
            req.user = results[0];
            global.userToken = results[0];
            return next();
        } catch (error) {
            console.log("Login Check Error: " + error);
            return next();
        }
    } else {
        next();
    }
};


exports.logout = async (req,res) => {
    try{
        await bcFun.deleted({ body: {"tableName": "login_users", "whereCondition": "cookie=?","values":[req.cookies["userToken"]]}});
    }
    catch(e)
    {
        console.log("Log Out Error : "+e.message);
    }
    res.cookie("userToken","",{
        expires: new Date(Date.now() + 2 * 1000),
        httpOnly: true,
    });
    res.status(200).redirect("/");
};
