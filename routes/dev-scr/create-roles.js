const express = require("express");
const backendController = require('../../controllers/backend-functions');
const router = express.Router();

// POST route to handle form submission
router.post('/insert',async (req, res) => {
    const { companyname, priority, role, edit_id } = req.body;

    const data = { 
        companyname,
        priority,
        role,
    };

    const totalRows = await backendController.selectQuery(`SELECT * FROM roles where deleteon=? and uniqueid!=? and companyname=? and role=?`,['0000-00-00', edit_id, companyname, role]);
    if(totalRows[0])
        return res.json({msg:"Already Exist", msg_type : 'error', success: false });
    if (!companyname || companyname.length < 3 ||!/^[A-Za-z ]+$/.test(companyname)) {
        return res.json({msg:"Company Name Invalid ", msg_type : 'error', success: false });
    }
    else if(priority<=0||!priority)
    {
        return res.json({msg:"priority Invalid", msg_type : 'error', success: false });
    }
    else if (!role || role.length < 3 || !/^[A-Za-z ]+$/.test(role)) {
        return res.json({msg:"Role Invalid", msg_type : 'error', success: false });
    }
    
    let changed = 0;
    // Proceed with the insertion logic
    if (edit_id) {
        try {
          // Call the `deleted()` function with the necessary arguments
          await backendController.deleted({ body : {'tableName' :'roles', 'whereCondition': `uniqueid = ?`, 'values': [edit_id]}});
          changed=1;
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }      
    try {
        const insertResponse = await backendController.insert({
            body: {     
                tableName: 'roles',
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

router.get("/loadcomp", async (req, res) => {
    backendController.selectQuery(`SELECT companyname,code FROM companies where deleteon=? and code=?`,['0000-00-00',userToken.site])
    .then(results => {
        const html = backendController.loadOptions(results, 'companyname', 'code');
        res.json({ success: true, response: html, msg: "ok" });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg: "Server Error" });
    });
});

router.post("/select", async (req, res) => {
    const { page = 1, limit = 10 } = req.body;  // Default page 1 and limit 10

    const offset = (page - 1) * limit;
    const totalRows = await backendController.selectQuery(`SELECT count(*) as total FROM roles where deleteon=? and companyname=?`,['0000-00-00',userToken.site]);
    backendController.selectQuery(`SELECT * FROM roles where deleteon=? and companyname=?`,['0000-00-00',userToken.site])
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
        let edit_and_delete = `<div class='flex-with-space-edit-delete'>
                <img src="/images/edit.png" width="25" height="25" class="edit-icon" title="" id="edit-user${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>
                <img src="/images/delete.png" class="delete-icon" title="" width="25" height="25" id="delete-user${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>
              </div>`;
        htmlContent += `<tr><td>${sno}</td><td>${item.companyname}</td>
            <td>${item.priority}</td>
            <td>${item.role}</td>
            <td>${edit_and_delete}</td>
        </tr>`;
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
          const deleteid = await backendController.deleted({ body : {tableName :'roles', whereCondition: `uniqueid = ?`, values : [uniquekey]}});
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