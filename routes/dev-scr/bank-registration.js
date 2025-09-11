const express = require("express");
const backendController = require('../../controllers/backend-functions');
const router = express.Router();
const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default;

router.get("/loadHeader", async (req, res) => {
    backendController.selectQuery(`SELECT * FROM chart_of_accounts where deleteon=? and branch=?`,['0000-00-00', userToken.site])
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

// Route to generate and serve PDF
router.get("/pdf", async (req, res) => {
    try {
        // Fetch data from the database
        const all_users = await backendController.selectQuery("select * from banks where deleteon=? and branch=?", ["0000-00-00", userToken.site]);
        
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
        doc.text("All Banks", centerX, 10, { align: "center" });


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
            row.bankname, 
            row.ifsc, 
            row.accno,
            row.branchname,
            row.displayname,
            row.shortname,
        ]);

        const columns = ["#", "Name", "IFSC", "Account", "Branch", "Display","Short"];

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

router.post("/select", async (req, res) => {
    try
    {
        const results = await backendController.selectQuery(`SELECT * FROM banks where deleteon=? and branch=?`,['0000-00-00', userToken.site])
        const totalRows = await backendController.selectQuery(`SELECT count(*) as total FROM banks where deleteon=? and branch=?`,['0000-00-00', userToken.site])
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
            let edit_and_delete = `<div class='flex-with-space-edit-delete'>`;
            if(!userToken.rights_result||userToken.rights_result.edit_rights===0)
                edit_and_delete += `<img src="/images/edit.png" width="25" height="25" class="edit-icon" title="" id="edit-user${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>`;
            if(!userToken.rights_result||userToken.rights_result.delete_rights===0)
                edit_and_delete += `<img src="/images/delete.png" class="delete-icon" title="" width="25" height="25" id="delete-user${item.uniqueid}" uniquekey="${item.uniqueid}"  uniquekey2="${item.entity_ref}" datas='${JSON.stringify(item)}'/>`;
              edit_and_delete += `</div>`;
                sno++;
                htmlContent += `<tr><td>${sno}</td><td>${backendController.caps(item.bankname)}</td><td>${item.accno}</td><td>${item.ifsc}</td><td>${backendController.caps(item.displayname)}</td><td>${item.shortname}</td><td>${backendController.caps(item.branchname)}</td><td>${edit_and_delete}</td></tr>`;
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

router.post("/insert", async (req, res)=>{
    const {bankname,accnum,ifsc,short,display,branch,uniquekey,header,uniquekey2} = req.body;
    // Validate the 'pages' and 'roles' fields (should not be "nd")
    const exist_users = await backendController.selectQuery(`SELECT * FROM banks where deleteon=? and accno=? and uniqueid!=? and branch=?`,['0000-00-00',accnum,uniquekey, userToken.site]);
    const exist_account = await backendController.selectQuery(`SELECT * FROM banks where deleteon=? and displayname=? and uniqueid!=? and branch=?`,['0000-00-00',display,uniquekey, userToken.site]);
    if(header==="nd")
        return res.json({ msg: "Account Must be Selected", msg_type: 'error', success: false });
    if(exist_users[0])
        return res.json({ msg: "Account Number Already Exist.", msg_type: 'error', success: false });
    if(exist_account[0])
        return res.json({ msg: "Account Name Already Exist.", msg_type: 'error', success: false });
    if (bankname === '') {
        return res.json({ msg: "bankname is invalid", msg_type: 'error', success: false });
    }
    if (accnum === '') {
        return res.json({ msg: "Account Number is invalid", msg_type: 'error', success: false });
    }
    if (ifsc === '') {
        return res.json({ msg: "IFSC is invalid", msg_type: 'error', success: false });
    }
    if (short === '') {
        return res.json({ msg: "Short Name is invalid", msg_type: 'error', success: false });
    }
    if (display === '') {
        return res.json({ msg: "Display Name is invalid", msg_type: 'error', success: false });
    }
    if (branch === '') {
        return res.json({ msg: "Branch Name is invalid", msg_type: 'error', success: false });
    }

    const data = { 
        acc_id:header,
        bankname,
        accno:accnum, 
        ifsc, 
        shortname:short, 
        displayname:display, 
        branchname:branch,
    };

    const data1 = {
        entity_type:'bank',
        account_id:header,
        name:display,
        alias:display,
    }

    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const update1 = await backendController.updateQuery('entities', data1, `id=?`,[uniquekey2],"","id",uniquekey2);
          const update = await backendController.updateQuery('banks', data, `uniqueid=? and entity_ref=?`,[uniquekey,uniquekey2],"","entity_ref",uniquekey2);
          if(update.success)
              return res.json({msg: "Data Edited successfully", msg_type : 'success', success: true});
          else {
              console.log('Insert failed');
              return res.json({
                  success: false,
                  msg: 'Error occurred while inserting data',
                  msg_type: 'error',
                  error: insertResponse.message || 'Unknown error'
              });
          }
        } catch (error) {
          return console.error('Error in deleting:', error.message);
        }
    }      
    try
    {
        
        const insertResponse1 = await backendController.insert({
            body: {
                tableName: 'entities',
                data: data1, 
                column:"id"
            }
        });
        const insertResponse = await backendController.insert({
            body: {
                tableName: 'banks',
                data: data,
                column:"entity_ref",
                id:insertResponse1.lastInsertId
            }
        });

        if (insertResponse.success && insertResponse1.success)
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
    if (uniquekey && uniquekey2) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const deleteid = await backendController.deleted({ body : {'tableName' :'banks', 'whereCondition': `entity_ref=? and uniqueid=?`,'values':[uniquekey2,uniquekey]}});
          const deleteid2 = await backendController.deleted({ body : {'tableName' :'entities', 'whereCondition': `id=?`,'values':[uniquekey2]}});
          if (deleteid.success && deleteid2.success)
            res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});

module.exports = router;