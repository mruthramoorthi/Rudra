const express = require("express");
const backendController = require('../../controllers/backend-functions');
const router = express.Router();
const htmls = require('../../helpers');
const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default;

// Route to generate and serve PDF
router.get("/pdf", async (req, res) => {
    try {
        // Fetch data from the database
        const all_users = await backendController.selectQuery("select * from users where deleteon=? and branch=? and typeofpeople=?", ["0000-00-00",userToken.site,"customer"]);
        
        // Create a new PDF document with A4 size
        const doc = new jsPDF({
            orientation: "landscape", // "portrait" or "landscape"
            unit: "mm",              // Measurement unit (mm)
            format: "a4",            // Set format to A4
        });

        // Add the heading "All Users"
        doc.setFontSize(16);

        // Get the page width and calculate the center
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;

        // Add the text, centered at the calculated position
        doc.text("All Users", centerX, 10, { align: "center" });


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
            row.name + " " + row.lastname, 
            row.address, 
            row.primaryphonenumber + ", " + row.secondaryphonenumber, 
            backendController.rawDateFormat(row.dob), 
            backendController.rawDateFormat(row.joindate)
        ]);

        const columns = ["#", "Name", "Address", "Phone", "DOB", "Join"];

        // Add the table to the PDF
autoTable(doc , {
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

router.post("/select",async (req, res) => {
    const { page = 1, limit = 10 } = req.body;  // Default page 1 and limit 10

    const offset = (page - 1) * limit;
    const totalRecode = await backendController.selectQuery(`SELECT count(*) as total FROM users where deleteon=? and branch=? and typeofpeople=?`,['0000-00-00',userToken.site,"customer"]);
    backendController.selectQuery(`SELECT * FROM users where deleteon=? and branch=? and typeofpeople=?`,['0000-00-00',userToken.site,"customer"])
        .then(results => {
            const html = generateHTMLData(results);
            res.json({ success: true, response: html, total: totalRecode[0].total, msg: "ok" });
        })
        .catch(error => {
            console.error('Error:', error);  // Handle rejection properly here
            res.status(500).json({ success: false, msg: "Server Error" });
        });
}); 
let sno = 0;
function generateHTMLData(results) {
    let htmlContent = '';
    results.forEach(item => {
        sno ++;
        const entryDate = backendController.rawDateFormat(item.entrydate);
        // console.log(entryDate)
        let edit_and_delete = `<div class='flex-with-space-edit-delete'>`;
            if(htmls.checkRights(userToken.rights_result, 'edit'))
                edit_and_delete += `<img src="/images/edit.png" width="25" height="25" class="edit-icon" title="" id="edit-user${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>`;
            if(htmls.checkRights(userToken.rights_result, 'delete'))
                edit_and_delete += `<img src="/images/delete.png" class="delete-icon" title="" width="25" height="25" id="delete-user${item.uniqueid}" uniquekey="${item.uniqueid}" userid="${item.userid}" datas='${JSON.stringify(item)}'/>`;
              edit_and_delete += `</div>`;
        htmlContent += `<tr><td>${sno}</td><td>${backendController.caps(item.name)} ${backendController.caps(item.lastname)}</td><td>${item.primaryphonenumber}</td><td>${backendController.caps(item.address)}</td><td>${ backendController.generateImageTag(item.profile, 'profile', 'popup-img', 'width: 50px; border-radius: 51%; padding: 2px; object-fit: cover; height: 50px;')}</td><td>${entryDate}</td><td>${edit_and_delete}</td></tr>`;
    });
    sno = 0;
    return htmlContent;
}


// POST route to handle form submission
router.post('/delete-user',async (req, res) => {
    const { uniquekey, userid } = req.body;
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const deleteid = await backendController.deleted({ body : {'tableName' :'users', 'whereCondition': `uniqueid=?`,'values':[uniquekey]}});
          const update1 = await backendController.updateQuery('entities', {status:1}, `userid=?`,[userid]);
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
router.post('/insert',async (req, res) => {
    const { name, lastname, dob, number1, number2, address, joinon, aadhaar, pannum, imgpath_profile, imgpath_proof, uniquekey, user_id } = req.body;
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
    // Proceed with the insertion logic
    if (uniquekey) {
        try {
            // Call the `deleted()` function with the necessary arguments
            const update = await backendController.updateQuery('users', Updatedata, `uniqueid=?`,[uniquekey]);
            const update1 = await backendController.updateQuery('entities', data_edit, `userid=?`,[user_id],"","id");
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
