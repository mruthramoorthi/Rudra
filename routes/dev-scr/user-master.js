const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const { options } = require("pdfkit");
const { route } = require("../pages");
const { jsPDF } = require("jspdf");
const bcrypt =require("bcryptjs");
const autoTable = require("jspdf-autotable").default;
const router = express.Router();

router.get("/pdf", async (req, res) => {
    try {
        // Fetch data from the database
        const all_users = await backendController.selectQuery("select distinct t1.userid as userid,group_concat(t1.roles) as roles,t2.name as name from user_roles as t1 join users as t2 on t1.userid=t2.userid where t1.deleteon=? and t2.deleteon=? group by t1.userid,t2.userid", ["0000-00-00", "0000-00-00"]);
        
        // Create a new PDF document with A4 size
        const doc = new jsPDF({
            orientation: "portrait", // "portrait" or "landscape"
            unit: "mm",              // Measurement unit (mm)
            format: "a4",            // Set format to A4
        });

        // Add the heading "All Users"
        doc.setFontSize(16);

        // Get the page width and calculate the center
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;

        // Add the text, centered at the calculated position
        doc.text("All Users With Roles", centerX, 10, { align: "center" });


        // Get the current date and time
        const currentDate = new Date();
        const dateString = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;

        // Set font size for the date
        doc.setFontSize(10);

        // Get page width and calculate the right corner position
        const textWidth = doc.getTextWidth(dateString);
        const xPosition = pageWidth - textWidth - 15; // 10 is for padding from the edge

        // Add the date string to the top-right corner
        doc.text(dateString, xPosition, 10, { align: "left" });


        // Prepare the data for the table
        const filteredRows = all_users.map((row, index) => [
            index + 1, 
            row.name, 
            row.roles
        ]);

        const columns = ["#", "Names", "Roles"];

        // Add the table to the PDF
autoTable(doc, {
    head: [columns], // Add column headers
    body: filteredRows, // Add filtered data
    startY: 15, // Start position (Y-axis) for the table
    headStyles: {
        halign: 'center', // Center align the heading columns
        fontSize: 13, // Font size for headers
        textColor: [255, 255, 255], // Black text color
    },
});


        // Generate PDF as a buffer
        const pdfBuffer = doc.output("arraybuffer");

        // Set the headers to serve the PDF
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline; filename=output.pdf");
        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).send("Error generating PDF.");
    }
});
router.get("/loaduser", async (req, res) => {
    backendController.selectQuery(`SELECT userid,name FROM users where deleteon='0000-00-00'`)
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            let optionTag = `<option value="${item['userid']}[u=1]${item['name']}">${item['name']}</option>`;
            options_arr.push(optionTag);
        });
        
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.get("/loadrole", async (req, res) => {
    backendController.selectQuery(`SELECT role,companyname,priority FROM roles where deleteon='0000-00-00'`)
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
                let optionTag = `<option value="${item['role']}">${item['role']}</option>`;
                options_arr.push(optionTag);
        });
        
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.get("/branch", async (req, res) => {
    backendController.selectQuery(`SELECT code,companyname FROM companies where deleteon=?`,['0000-00-00'])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
                let optionTag = `<option value="${item['code']}">${item['companyname']}</option>`;
                options_arr.push(optionTag);
        });
        
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.post("/select", async (req, res) => {
    let { page = 1, limit = 10, datas } = req.body;  // Default page 1 and limit 10
    // const offset = (page - 1) * limit;
    try
    {
        const results = await backendController.selectQuery(`SELECT * FROM  users u JOIN user_roles ur ON ur.userid = u.userid WHERE ur.deleteon = ?`,['0000-00-00']);
        const totalRecode = await backendController.selectQuery(`SELECT count(*) as total FROM  users u JOIN user_roles ur ON ur.userid = u.userid WHERE ur.deleteon = ?`,['0000-00-00']);
        const htmls = await generateHTMLData(results);
        res.json({ success: true, response: htmls, total:totalRecode[0].total, msg: "ok" });

    }catch(error) {
            console.error('Error:', error);  // Handle rejection properly here
            res.status(500).json({ success: false, msg: "Server Error" });
        };
});
let sno = 0;
async function generateHTMLData(results) {
    let htmlContent = '';
    try {
        results.forEach(item => {
            let edit_and_delete = `<div class='flex-with-space-edit-delete'>
                        <img src="/images/edit.png" width="25" height="25" class="edit-icon" title="" id="edit-user${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>
                        <img src="/images/delete.png" class="delete-icon" title="" width="25" height="25" id="delete-user${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>
                    </div>`;
                sno++;
                htmlContent += `<tr><td>${sno}</td><td>${item.name}</td><td>${item.roles}</td><td>${item.branches}</td><td>${edit_and_delete}</td></tr>`;
        });

        sno = 0;
        if (!htmlContent)
            htmlContent = "There is No Data to Load";
        return htmlContent;
    } catch (error) {
        console.error('Error in generateHTMLData:', error); // Handle rejection properly here
        throw error;  // Re-throw error for higher-level handling
    }
}

// POST route to handle form submission
router.post('/delete',async (req, res) => {
    const { uniquekey } = req.body;
    console.log(uniquekey)
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const deleteid = await backendController.deleted({ body : {'tableName' :'user_roles', 'whereCondition': `uniqueid = ?`, 'values':[uniquekey]}});
          if (deleteid.success)
            res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});

// POST route to handle form submission
router.post('/update',async (req, res) => {
    const { clickedId } = req.body;
    const uniquekey = [clickedId.split("status")[1]];
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const results = await backendController.selectQuery(`SELECT * FROM all_pages_details where deleteon=? and uniqueid=?`,['0000-00-00',...uniquekey])
          let sts = 1;
          if(results[0].status=='1')
            sts = 0;
            const all_path = results[0].path.split("\\");
            for (const item of all_path) 
            {  
                const update = await backendController.updateQuery("all_pages_details",{status:sts},'path=? and route=?',[results[0].path,item])
                if (update.success && item.endsWith(".hbs"))
                    res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
            }
        } catch (error) {
          console.error('Error in update:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});


router.post("/insert", async (req, res)=>{
    const { users, roles, display, uniquekey, user, password, branch} = req.body;
    // Validate the 'pages' and 'roles' fields (should not be "nd")
    if (users === 'nd') {
        return res.json({ msg: "Users value is invalid", msg_type: 'error', success: false });
    }
    if (roles === 'nd') {
        return res.json({ msg: "Role value is invalid", msg_type: 'error', success: false });
    }
    if (branch === 'nd') {
        return res.json({ msg: "Branch value is invalid", msg_type: 'error', success: false });
    }
    if(!user || user.length<5)
    {
        return res.json({ msg: "User Name Must Contain 5 Characters", msg_type: 'error', success: false });
    }
    // Check if password has at least one uppercase letter, one number, and is at least 8 characters long
    const hasUpperCase = /[A-Z]/.test(password);   // checks for uppercase
    const hasNumber = /[0-9]/.test(password);      // checks for a number
    const isValidLength = password.length >= 8;    // checks for length >= 8

    if (!hasUpperCase || !hasNumber || !isValidLength) {
        return res.json({ msg: "Password Must Contain Capital Letter, Numbers and 8 Characters", msg_type: 'error', success: false });
    }
    const data = {
        userid: users.split("[u=1]")[0],
        roles,
        recognition:display,
        branches: branch,
    }
    let hashedPassword = await bcrypt.hash(password,8);
    let userids = users.split("[u=1]")[0];
    let names = users.split("[u=1]")[1];
    const data2 = {
        userid: userids,
        name: names,
        username: user,
        password: hashedPassword,
    }
    const users_check = await backendController.selectQuery(`SELECT * FROM users_auth where deleteon=? and username=?`,['0000-00-00',user]);
    if(users_check[0])
    {
        console.log(users_check[0])
        return res.json({ msg: "Username Already Taken", msg_type: 'error', success: false });
    }
        if (uniquekey)
        {
            try {
                const update = await backendController.updateQuery("user_roles",data,'uniqueid=?',[uniquekey]);
                const update2 = await backendController.updateQuery("users_auth",data2,'userid=?',[userids]);
                if (update.success && update2.success)
                    res.json({msg: "Data Updated successfully", msg_type : 'success', success: true});
            } catch (error) {
            console.error('Error in deleting:', error.message);
            }
        }      
        else
        {
            try
            {    
                // Insert the new record if no existing record found
                const response = await backendController.insert({body: {tableName: 'user_roles',data: data}});
                // Insert the new record if no existing record found
                const response2 = await backendController.insert({body: {tableName: 'users_auth',data: data2}});
                // Ensure you handle the response outside of the asynchronous block
                if (response.success && response2.success)
                    res.json({ msg: "Data entered successfully", msg_type: 'success', success: true });
                else
                {
                    console.log('Insert failed');
                    res.json({
                        success: false,
                        msg: 'Error occurred while inserting data',
                        msg_type: 'error',
                        error: response.message || 'Unknown error'
                    });
                }
            }
            catch (error)
            {
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