const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const { body } = require("express-validator");
const { Table } = require("jspdf-autotable");
const router = express.Router();

router.post("/insert", async (req, res) => {
    const {counter,uni} = req.body;
    const check = await backendController.selectQuery('select * from counter where uniqueid!=? and counter=? and deleteon=?',[uni,counter,'0000-00-00']);
    if(check[0])
        return res.json({success:false, msg_type:"error", msg:"Counter Already Exist..."});
    if(!counter)
        return res.json({success:false, msg_type:"error", msg:"Please Enter Counter Name To Add..."});
    if(uni)
    {
        try{
            const updateResponse = await backendController.updateQuery('counter', {counter}, "uniqueid=?",[uni]);
            if(updateResponse.success)
                return res.json({success:true, msg_type:"success", msg:"Counter Updated Successfully..."});
            else
                return res.json({success:false, msg_type:"error", msg:"Counter Not Updated..."});
        }
        catch(ex)
        {
            console.error('Error in update:', ex.message);
        }
    }
    try
    {
        const insertRes = await backendController.insert({body: {tableName:"counter",data:{counter}}});
        if(insertRes.success)
            return res.json({success:true, msg_type:"success", msg:"Counter Created Successfully..."});
        else
            return res.json({success:false, msg_type:"error", msg:"Counter Not Created..."});
    }
    catch(ex)
    {
        console.error('Error in Insert:', ex.message);
    }
});

router.post("/select", async (req, res) => {
    try
    {
        const results = await backendController.selectQuery(`SELECT * FROM counter where deleteon=? and branch=?`,['0000-00-00', userToken.site])
        const totalRows = await backendController.selectQuery(`SELECT count(*) as total FROM counter where deleteon=? and branch=?`,['0000-00-00', userToken.site])
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
                edit_and_delete += `<img src="/images/delete.png" class="delete-icon" title="" width="25" height="25" id="delete-user${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>`;
              edit_and_delete += `</div>`;
                sno++;
                htmlContent += `<tr><td>${sno}</td><td>${backendController.caps(item.counter)}</td><td>${edit_and_delete}</td></tr>`;
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

router.post('/delete',async (req, res) => {
    const { uniquekey } = req.body;
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const deleteid = await backendController.deleted({ body : {'tableName' :'counter', 'whereCondition': `uniqueid = ?`, 'values':[uniquekey]}});
          if (deleteid.success)
            res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});

module.exports = router;