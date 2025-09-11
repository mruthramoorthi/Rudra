const express = require("express");
const backendController = require('../../controllers/backend-functions');
const router = express.Router();
const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default;

router.get("/accType", async (req, res) => {
    let options_arr = [];
    options_arr.push(`<option value="personal">Personal</option>`);
    options_arr.push(`<option value="general">General</option>`);
    options_arr.push(`<option value="bank">Bank</option>`);
    options_arr.push(`<option value="cash">Cash</option>`);
    const html = options_arr.join('');
    res.json({ success: true, response: html });
});

router.get("/loadHeader", async (req, res) => {
    backendController.selectQuery(`SELECT * FROM chart_of_accounts where deleteon=? and branch=?`,['0000-00-00', userToken.site])
    .then(results => {
        let options_arr = [];
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
autoTable(doc,{
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
    const {header,entitytype,newentity,name,party,doj,number1,number2,address,gstin,pannum,imgpath_profile,imgpath_proof,state,district,pin,cr,dr,uniquekey} = req.body;
    // Validate the 'pages' and 'roles' fields (should not be "nd")
    const check_account = await backendController.selectQuery(`select * from entities where deleteon=? and branch=? and (name=? or alias=?) and id!=?`,['0000-00-00', userToken.site,name,party,uniquekey]);
    const check_phone = await backendController.selectQuery(`select * from entities where deleteon=? and branch=? and (ph1 like ? or ph1 like ?) and (ph2 like ? or ph2 like ?) and id!=?`,['0000-00-00', userToken.site,`%${number1}%`,`%${number1}%`,`%${number2}%`,`%${number2}%`,uniquekey]);
    if(check_account[0])
        return res.json({ msg: "This Account is Already Exist", msg_type: 'error', success: false });
    if(check_phone[0])
        return res.json({ msg: "This  Phone Number is Already Exist", msg_type: 'error', success: false });
    if(header==="nd")
        return res.json({ msg: "Header Must be Selected", msg_type: 'error', success: false });
    if (entitytype === 'others' && !newentity)
        return res.json({ msg: "New Header Invalid", msg_type: 'error', success: false });
    if (!name)
        return res.json({ msg: "Account Name Invalid", msg_type: 'error', success: false });
    if (!party)
        return res.json({ msg: "Party Name Invalid", msg_type: 'error', success: false });
    if((number1==number2) || (!number1 && !number2) || (number1.length>13 || number2.length>13))
        return res.json({ msg: "Invalid Phone Numbers", msg_type: 'error', success: false });
    let entity = entitytype;
    if(entitytype==="others")
        entity = newentity;
    if(uniquekey)
    {
        try{
            const updateResponse = await backendController.updateQuery('entities', {account_id:header,entity_type:entity,name,alias:party,doj,ph1:number1,ph2:number2,address,gstin,pan:pannum,profile:imgpath_profile,proof:imgpath_proof,state,district,pin,cr,dr}, "id=?",[uniquekey]);
            if(updateResponse.success)
                res.json({success: true, msg: 'Accounts Updated Successfully', msg_type: 'success'});
            else
                res.json({success: false, msg: 'Accounts Not Updated...', msg_type: 'error'});
        }
        catch(error){
            console.error('Error during undate operation:', error);
            res.json({
                success: false,
                msg: 'Error occurred while update data',
                msg_type: 'error',
                error: error.message || 'Unknown error'
            });
        }
    }
    else
    {
        try
        {
            const insertResponse = await backendController.insert({body: {tableName: 'entities',data: {userid:backendController.generateUniqueId(),account_id:header,entity_type:entity,name,alias:party,doj,ph1:number1,ph2:number2,address,gstin,pan:pannum,profile:imgpath_profile,proof:imgpath_proof,state,district,pin,cr,dr}, column:"id"}});
            if(insertResponse.success)
                res.json({success: true, msg: 'Accounts Created Successfully', msg_type: 'success'});
            else
                res.json({success: false, msg: 'Accounts Not Created...', msg_type: 'error'});
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

// POST route to handle form submission
router.post('/delete',async (req, res) => {
    const { uniquekey } = req.body;
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const deleteid = await backendController.deleted({ body : {'tableName' :'entities', 'whereCondition': `id=?`,'values':[uniquekey]}});
          if (deleteid.success)
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
        const results = await backendController.selectQuery(`SELECT * FROM entities where deleteon=? and branch=? and entity_type!=?`,['0000-00-00',userToken.site,"bank"]);
        const totalRows = await backendController.selectQuery(`SELECT count(*) as total FROM entities where deleteon=? and branch=? and entity_type!=?`,['0000-00-00',userToken.site,"bank"]);
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
        for (let i = 0; i < results.length; i++) {
            let item = results[i];
            const acc_exist = await backendController.selectQuery(`select * from transactions where entity_id=? and deleteon=? and branch=? limit 1`,[item.id,'0000-00-00',userToken.site]); 
            let edit_and_delete = `<div class='flex-with-space-edit-delete'>`;
            if(!acc_exist[0])
                if (!userToken.rights_result || userToken.rights_result.delete_rights === 0) {
                    edit_and_delete += `<img src="/images/edit.png" width="25" height="25" class="edit-icon" id="edit-user${item.id}" uniquekey="${item.id}" datas='${JSON.stringify(item)}'/>
                    <img src="/images/delete.png" class="delete-icon" width="25" height="25" id="delete-user${item.id}" uniquekey="${item.id}" datas='${JSON.stringify(item)}'/>`;
                }
        
            edit_and_delete += `</div>`;
            sno++;
        
            htmlContent += `<tr><td>${sno}</td><td>${item.id}</td><td>${backendController.caps(item.name)}</td><td>${item.alias}</td><td>${edit_and_delete}</td></tr>`;
        }        
        sno = 0;
        if (!htmlContent)
            htmlContent = "There is No Data to Load";
        return htmlContent;
    } catch (error) {
        console.error('Error in generateHTMLData:', error);  // Handle rejection properly here
        throw error;  // Re-throw error for higher-level handling
    }
}

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