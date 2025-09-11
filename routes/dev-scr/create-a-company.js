const express = require("express");
const backendController = require('../../controllers/backend-functions');
const router = express.Router();

// POST route to handle form submission
router.post('/insert',async (req, res) => {
    const { companyname, industry, code, since, number1, number2, address, quote, ownername, ownerno, imgpath_ownerimg, imgpath_companyimg, gstin, edit_id } = req.body;

    const data = { 
        companyname, 
        industry, 
        code, 
        since, 
        number1,
        number2,
        address, 
        quote, 
        ownername,
        ownerno,
        ownerimage:imgpath_ownerimg,
        companyimage:imgpath_companyimg,
        gstnumber:gstin,
    };
    const exist_code = backendController.selectQuery(`SELECT * FROM companies where deleteon=? and code=? and uniqueid!=?`,['0000-00-00',code,edit_id]);
    const exist_num1 = backendController.selectQuery(`SELECT * FROM companies where deleteon=? and (primaryphonenumber=? or secondaryphonenumber=?) and uniqueid!=?`,['0000-00-00',number1,number1,edit_id]);
    const exist_num2 = backendController.selectQuery(`SELECT * FROM companies where deleteon=? and (primaryphonenumber=? or secondaryphonenumber=?) and uniqueid!=?`,['0000-00-00',number2,number2,code,edit_id]);
    const exist_no = backendController.selectQuery(`SELECT * FROM companies where deleteon=? and ownerno=? and uniqueid!=?`,['0000-00-00',ownerno,edit_id]);
    const exist_gst = backendController.selectQuery(`SELECT * FROM companies where deleteon=? and gstnumber=? and uniqueid!=?`,['0000-00-00',gstin,edit_id]);
    if (!companyname || companyname.length < 3 ||!/^[A-Za-z ]+$/.test(companyname)) {
        return res.json({msg:"Company Name Invalid "+companyname, msg_type : 'error', success: false });
    }
    else if(!gstin)
    {
        return res.json({msg:"GSTIN Invalid", msg_type : 'error', success: false });
    }
    else if(exist_code[0])
    {
        return res.json({msg:"Comapny Code Already Exist", msg_type : 'error', success: false });
    }
    else if(exist_num1[0])
    {
        return res.json({msg:"Primary Number Already Exist", msg_type : 'error', success: false });
    }
    else if(exist_num2[0])
    {
        return res.json({msg:"Secondary Number Already Exist", msg_type : 'error', success: false });
    }
    else if(exist_no[0])
    {
        return res.json({msg:"Owner Number Already Exist", msg_type : 'error', success: false });
    }
    else if(exist_gst[0])
    {
        return res.json({msg:"GSTIN Already Exist", msg_type : 'error', success: false });
    }
    else if (!industry || industry.length < 3 || !/^[A-Za-z ]+$/.test(industry)) {
        return res.json({msg:"lastname Invalid", msg_type : 'error', success: false });
    }
    else if (!ownername || ownername.length < 3 || !/^[A-Za-z ]+$/.test(ownername)) {
        return res.json({msg:"lastname Invalid", msg_type : 'error', success: false });
    }
    else if (!number1 || number1.length > 13 || !/^\d+$/.test(number1)) {
        return res.json({msg:"Primary Number Invalid", msg_type : 'error', success: false });
    }
    else if (!number2 || number2.length > 13 || !/^\d+$/.test(number2)) {
        return res.json({msg:"Secondary Number Invalid", msg_type : 'error', success: false });
    }
    else if (!address || address.length < 11) {
        return res.json({msg:"Address Invalid", msg_type : 'error', success: false });
    }
    else if (!imgpath_ownerimg) {
        return res.json({msg:"Owner Image is Not Valid", msg_type : 'error', success: false });
    }
    else if (!imgpath_companyimg) {
        return res.json({msg:"Company Image is Not Valid", msg_type : 'error', success: false });
    }
    let changed = 0;
    // Proceed with the insertion logic
    if (edit_id) {
        try {
          // Call the `deleted()` function with the necessary arguments
          await backendController.deleted({ body : {'tableName' :'companies', 'whereCondition': `uniqueid = ?`, 'values':[edit_id]}});
          changed=1;
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }      
    try {
        const insertResponse = await backendController.insert({
            body: {     
                tableName: 'companies',
                data: data
            }
        });

        if (insertResponse.success&&changed==0)
            res.json({msg: "Company Registered successfully", msg_type : 'success', success: true});
        else if(insertResponse.success&&changed==1)
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
        console.error('Error during insert operation:', error);
        res.json({
            success: false,
            msg: 'Error occurred while inserting data',
            msg_type: 'error',
            error: error.message || 'Unknown error'
        });
    }
});

router.post("/select", async (req, res) => {
    const totalRows = await backendController.selectQuery(`SELECT count(*) as total FROM companies where deleteon=?`,['0000-00-00'])
    backendController.selectQuery(`SELECT * FROM companies where deleteon=?`,['0000-00-00'])
        .then(results => {
            const html = generateHTMLData(results);
            res.json({ success: true, response: html, total: totalRows[0].total, msg: "ok" });
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
        let edit_and_delete = `<div class='flex-with-space-edit-delete right-cornor'>
                <img src="/images/edit.png" width="25" height="25" class="edit-icon" title="" id="edit-user${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>
                <img src="/images/delete.png" class="delete-icon" title="" width="25" height="25" id="delete-user${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>
              </div>`;
        htmlContent += `<div class="snowdiv paginate">${edit_and_delete}<h3>${backendController.caps(item.companyname)}</h3>
            <span class="custombadge">${backendController.caps(item.code)}</span><br>
            <label>${backendController.caps(item.address)}</label><br>
            <label>${backendController.allCaps(item.gstnumber)}</label><br>
            <label>Contact : ${item.number1}, ${item.number2}</label><br>
            <label>${backendController.caps(item.ownername)} | Contact : ${item.ownerno}</label><br>
        </div>`;
    });
    sno = 0;
    return htmlContent;
}

// POST route to handle form submission
router.post('/delete',async (req, res) => {
    const { uniquekey } = req.body;
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const deleteid = await backendController.deleted({ body : {'tableName' :'companies', 'whereCondition': `uniqueid = ?`,'values': [uniquekey]}});
          if (deleteid.success)
            res.json({msg: "Data Deleted successfully", msg_type : 'success', success: true});
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});


module.exports = router;