const express = require("express");
const backendController = require('../../controllers/backend-functions');
const router = express.Router();
const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default;

// Route to generate and serve PDF
router.get("/pdf", async (req, res) => {
    try {
        // Fetch data from the database
        const all_users = await backendController.selectQuery("SELECT t1.account_name as accs,t2.name as name,t2.entity_type as entype,t1.uniqueid as uniqueid,t2.uniqueid as uniqueid2 FROM chart_of_accounts as t1 join entities as t2 on t1.uniqueid=t2.account_id where t1.deleteon=? and t2.deleteon=? and t1.branch=? and t2.branch=?",['0000-00-00','0000-00-00',userToken.site,userToken.site]);
        
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
        doc.text("Accounts Headers", centerX, 10, { align: "center" });


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
            row.accs, 
            row.name, 
            row.entype,
        ]);

        const columns = ["#", "Accounts", "Name", "Entity"];

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
    styles: {
        lineWidth: 0.1, // Set line width for cell borders
        lineColor: [255, 255, 255], // Black text color
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

router.post("/insert", async (req, res)=>{
    const {header,newheader,accountname,newaccount,entitytype,entity,uniquekey,account,} = req.body;
    // Validate the 'pages' and 'roles' fields (should not be "nd")
    // const exist_users = await backendController.selectQuery(`SELECT * FROM chart_of_accounts where deleteon=? and account_name=? and uniqueid!=?`,['0000-00-00',newheader,uniquekey]);
    if(account==="nd")
        return res.json({ msg: "Account Must be Selected", msg_type: 'error', success: false });
    if(header==="nd")
        return res.json({ msg: "Header Must be Selected", msg_type: 'error', success: false });
    if (header === 'others' && newheader==="") {
        return res.json({ msg: "New Header Invalid", msg_type: 'error', success: false });
    }
    
    // if (accountname === 'others' && !newaccount) {
    //     return res.json({ msg: "New Account Name Invalid", msg_type: 'error', success: false });
    // }
    
    // if (entitytype === 'others' && !entity) {
    //     return res.json({ msg: "New Entity Name Invalid", msg_type: 'error', success: false });
    // }
    // if (uniquekey) {
        
    // }      
    try
    {
        let insertResponse = '';
        // let insertResponseAcc = '';
        const query = 'select account_code from chart_of_accounts';
            const account_codes = await backendController.getUniqueRandomNumbers(query, 4, 1);
        if(header==="others")
        {
            insertResponse = await backendController.insert({body: {tableName: 'chart_of_accounts',data: { account_name:newheader,account_type_id:account, account_code:account_codes}, column:"id"}});
            // if(entitytype==="others" && accountname==="others")
            //     insertResponseAcc = await backendController.insert({body: {tableName: 'entities',data: { account_id:insertResponse.lastInsertId, name:newaccount, entity_type:entity}, column:"id"}});
            // else if((entitytype!="others"&&entitytype!="nd") && accountname==="others")
            //     insertResponseAcc = await backendController.insert({body: {tableName: 'entities',data: { account_id:insertResponse.lastInsertId, name:newaccount, entity_type:entitytype}, column:"id"}});
            // else if((accountname!="others"&&accountname!="nd") && entitytype==="others")
            //     insertResponseAcc = await backendController.insert({body: {tableName: 'entities',data: { account_id:insertResponse.lastInsertId, name:accountname, entity_type:entity}, column:"id"}});
        }
        else
        {
            insertResponse = await backendController.insert({body: {tableName: 'chart_of_accounts',data: { account_name:header,account_type_id:account, account_code:account_codes}, column:"id"}});
            // if(entitytype==="others" && accountname==="others")
            //     insertResponseAcc = await backendController.insert({body: {tableName: 'entities',data: { account_id:header, name:newaccount, entity_type:entity}, column:"id"}});
            // else if((entitytype!="others"&&entitytype!="nd") && accountname==="others")
            //     insertResponseAcc = await backendController.insert({body: {tableName: 'entities',data: { account_id:header, name:newaccount, entity_type:entitytype}, column:"id"}});
            // else if((accountname!="others"&&accountname!="nd") && entitytype==="others")
            //     insertResponseAcc = await backendController.insert({body: {tableName: 'entities',data: { account_id:header, name:accountname, entity_type:entity}, column:"id"}});
        }
        res.json({success: true, msg: 'Accounts Created Successfully', msg_type: 'success'});
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
});

// POST route to handle form submission
router.post('/delete',async (req, res) => {
    const { uniquekey, uniquekey2 } = req.body;
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const deleteid = await backendController.deleted({ body : {'tableName' :'chart_of_accounts', 'whereCondition': `uniqueid=?`,'values':[uniquekey]}});
          // Call the `deleted()` function with the necessary arguments
        //   const deleteid2 = await backendController.deleted({ body : {'tableName' :'entities', 'whereCondition': `uniqueid=?`,'values':[uniquekey2]}});
          if (deleteid2.success)
            res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});

router.post("/select", async (req, res) => {
    try
    {
        // const results = await backendController.selectQuery(`SELECT t1.account_name as accs,t2.name as name,t2.entity_type as entype,t1.uniqueid as uniqueid,t2.uniqueid as uniqueid2 FROM chart_of_accounts as t1 join entities as t2 on t1.uniqueid=t2.account_id where t1.deleteon=? and t2.deleteon=? and t1.branch=? and t2.branch=?`,['0000-00-00','0000-00-00',userToken.site,userToken.site]);
        const results = await backendController.selectQuery(`SELECT * FROM chart_of_accounts where deleteon=? and branch=?`,['0000-00-00',userToken.site]);
        const totalRows = await backendController.selectQuery(`SELECT count(*) as total FROM chart_of_accounts as t1 join entities as t2 on t1.uniqueid=t2.account_id where t1.deleteon=? and t2.deleteon=? and t1.branch=? and t2.branch=?`,['0000-00-00','0000-00-00',userToken.site,userToken.site]);
        const htmls = await generateHTMLData(results);
        res.json({ success: true, response: htmls, total: totalRows[0].total, msg: "ok" });

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
            // const check = await backendController.selectQuery();
            let edit_and_delete = `<div class='flex-with-space-edit-delete'>`;
                if(!userToken.rights_result||userToken.rights_result.delete_rights===0)
                        edit_and_delete += `<img src="/images/delete.png" class="delete-icon" title="" width="25" height="25" id="delete-user${item.uniqueid}" uniquekey="${item.uniqueid}" uniquekey2="${item.uniqueid2}" datas='${JSON.stringify(item)}'/>`;
                    edit_and_delete += `</div>`;
                sno++;
                htmlContent += `<tr><td>${sno}</td><td>${item.id}</td><td>${backendController.caps(item.account_name)}</td><td>${item.account_code}</td><td>${edit_and_delete}</td></tr>`;
        });
        sno = 0;
        if (!htmlContent)
            htmlContent = "There is No Data to Load";
        return htmlContent;
    } catch (error) {
        console.error('Error in generateHTMLData:', error);  // Handle rejection properly here
        throw error;  // Re-throw error for higher-level handling
    }
}

router.get("/loadHeader", async (req, res) => {
    const account = req.headers.data;
    backendController.selectQuery(`SELECT * FROM chart_of_accounts where deleteon=? and branch=? and account_type_id=?`,['0000-00-00', userToken.site, account])
    .then(results => {
        let options_arr = [];
        options_arr.push(`<option value="others">Others</option>`);
        results.forEach(item => {
            options_arr.push(`<option value="${item['id']}">${item['account_name']}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.get("/loadAccount", async (req, res) => {
    backendController.selectQuery(`SELECT * FROM account_types where deleteon=? and branch=?`,['0000-00-00', userToken.site])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['id']}">${item['name']}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.get("/accType", async (req, res) => {
    let options_arr = [];
    options_arr.push(`<option value="personal">Personal</option>`);
    options_arr.push(`<option value="general">General</option>`);
    options_arr.push(`<option value="bank">Bank</option>`);
    options_arr.push(`<option value="cash">Cash</option>`);
    const html = options_arr.join('');
    res.json({ success: true, response: html });
});

router.get("/loadAcc", async (req, res) => {
    const account = req.headers.data;
    backendController.selectQuery(`SELECT distinct name FROM entities where deleteon=? and branch=? and account_id=?`,['0000-00-00', userToken.site, account])
    .then(results => {
        let options_arr = [];
        options_arr.push(`<option value="others">Others</option>`);
        results.forEach(item => {
            options_arr.push(`<option value="${item['name']}">${item['name']}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.get("/loadEnt", async (req, res) => {
    const account = req.headers.data;
    backendController.selectQuery(`SELECT distinct entity_type FROM entities where deleteon=? and branch=? and account_id=?`,['0000-00-00', userToken.site, account])
    .then(results => {
        let options_arr = [];
        options_arr.push(`<option value="others">Others</option>`);
        results.forEach(item => {
            options_arr.push(`<option value="${item['entity_type']}">${item['entity_type']}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

module.exports = router;