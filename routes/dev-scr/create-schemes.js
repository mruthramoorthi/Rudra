 const express = require("express");
 const backendController = require('../../controllers/backend-functions');
 const htmls = require('../../helpers');
 const router = express.Router();
 const { jsPDF } = require("jspdf");
 require("jspdf-autotable");

 router.get("/savingType", async (req, res) => {
    const group = req.headers.data;
    console.log(group)
    try {
        // Fetch savings limitations
        const savings_limitations = await backendController.selectQuery(
            `SELECT schemetype, schemename 
            FROM savings_limitations 
            WHERE deleteon=? AND status=? AND branch=? AND type=?`,
            ['0000-00-00', '0', userToken.site, group]
        );

        // Fetch savings types
        const savings_types = await backendController.selectQuery(
            `SELECT DISTINCT savingstype, savingstype_explain 
            FROM savings_types 
            WHERE deleteon=?`,
            ['0000-00-00']
        );

        let options_arr = [];

        // Use a for loop to iterate savings_types
        for (let i = 0; i < savings_types.length; i++) {
            const typeItem = savings_types[i];

            // Search for a matching limitation
            for (let j = 0; j < savings_limitations.length; j++) {
                const limitation = savings_limitations[j];

                if (limitation.schemetype === typeItem.savingstype) {
                    const optionTag = `<option value="${typeItem.savingstype}[s~1]${limitation.schemename}">${backendController.caps(limitation.schemename)}</option>`;
                    options_arr.push(optionTag);
                    break; // Stop inner loop after match
                }
            }
        }

        const html = options_arr.join('');
        res.json({ success: true, response: html });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            msg_type: "error",
            msg: "Server Error"
        });
    }

 });

 router.get("/metal", async (req, res) => {
    backendController.selectQuery(`SELECT distinct product FROM product_category where deleteon=? and branch=?`,['0000-00-00',userToken.site])
    .then(results => {
        let options_arr = [];
        options_arr.push(`<option value="cash">Cash</option>`);
        results.forEach(item => {
            let optionTag = null;
                optionTag = `<option value="${item['product']}">${backendController.caps(item['product'])}</option>`;
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
    const totalRecode = await backendController.selectQuery(`SELECT count(*) as total FROM saving_schemes where deleteon=? and branch=?`,['0000-00-00',userToken.site]);
    backendController.selectQuery(`SELECT * FROM saving_schemes where deleteon=? and branch =?`,['0000-00-00',userToken.site])
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
        if(!userToken.rights_result||userToken.rights_result.edit_rights===0)
                edit_and_delete += `<img src="/images/edit.png" width="25" height="25" class="edit-icon" title="" id="edit-user${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>`;
        if(!userToken.rights_result||userToken.rights_result.delete_rights===0)
                edit_and_delete += `<img src="/images/delete.png" class="delete-icon" title="" width="25" height="25" id="delete-user${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>`;
              edit_and_delete += `</div>`;
        let checked = "";
        if(item.status===0)
            checked = "checked";
        htmlContent += `<tr>
                            <td>${sno}</td>
                            <td>${backendController.caps(item.category)}</td>
                            <td>${backendController.caps(item.savingtype)}</td>
                            <td>${backendController.caps(item.scheme)}</td>
                            <td>${backendController.caps(item.schemegroup)}</td>
                            <td>${item.due}</td>
                            <td>${item.month}</td>
                            <td>${item.totalamount}</td>
                            <td>${htmls.createCustomCheckbox({id:"status"+item.uniqueid, className:"just-check", placeholder:" ", checked:checked})}</td>
                            <td>${edit_and_delete}</td>
                        </tr>`;
    });
    sno = 0;
    return htmlContent;
}

// POST route to handle form submission
router.post('/update',async (req, res) => {
    const { clickedId } = req.body;
    const uniquekey = [clickedId.split("status")[1]];
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const results = await backendController.selectQuery(`SELECT * FROM saving_schemes where deleteon=? and uniqueid=? and branch=?`,['0000-00-00',uniquekey,userToken.site])
          let sts = 1;
          if(results[0].status=='1')
            sts = 0;
            const updation = await backendController.updateQuery("saving_schemes",{status:sts},'uniqueid=?',[uniquekey]);
            if(updation.success)
                res.json({msg: "Data Updates successfully", msg_type : 'success', success: true});
        } catch (error) {
          console.error('Error in update:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});

// POST route to handle form submission
router.post('/delete',async (req, res) => {
    const { uniquekey } = req.body;
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const deleteid = await backendController.deleted({ body : {'tableName' :'saving_schemes', 'whereCondition': `uniqueid=?`,'values':[uniquekey]}});
          if (deleteid.success)
            res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});

router.post('/insert',async (req, res) => {
    const { metal, savingtype, grp, due, totalmonth, total_amount, status, uniquekey, exceedamount, savingsnumber, scheme_id, min, max} = req.body;
    let scheme_code = "";
    if(!scheme_id)
    {
        scheme_code = backendController.generateUniqueId();
    }
    else
    {
        scheme_code = scheme_id;
    }
    let savings = savingtype.split("[s~1]");
    const scheme = savings[1];
    const data = { category:metal, savingtype:savings[0], scheme:scheme, schemegroup:grp, due, month:totalmonth, totalamount:total_amount, schemecode:scheme_code, savings_number_starting:savingsnumber };
    const checking = await backendController.selectQuery(`select * from saving_schemes where deleteon=? and branch=? and (schemegroup=? or scheme=?) and uniqueid!=?`,['0000-00-00',userToken.site,grp,scheme,uniquekey]);
    if(checking[0])
        return res.json({ msg: "This "+backendController.caps(checking[0].schemegroup)+" Scheme and "+backendController.caps(checking[0].scheme)+" Group is Already Exist", msg_type: 'error', success: false });
    if(metal==="nd")
        return res.json({ msg: "Please Select The Metal", msg_type: 'error', success: false });
    if(savingtype==="nd")
        return res.json({ msg: "Please Select The Saving Type", msg_type: 'error', success: false });
    if(!scheme)
        return res.json({ msg: "Please Enter The Scheme Name", msg_type: 'error', success: false });
    if(!grp)
        return res.json({ msg: "Please Enter The Group", msg_type: 'error', success: false });
    if(!due)
        return res.json({ msg: "Please Enter The Due Amount", msg_type: 'error', success: false });
    if(parseFloat(min)>parseFloat(due) || parseFloat(max)<parseFloat(due))
        return res.json({ msg: "Please Enter The Valid Due Amount", msg_type: 'error', success: false });
    if(!status)
        return res.json({ msg: "Please Choose Type Of Scheme", msg_type: 'error', success: false });  
    if (uniquekey) {
        try {
            const updateResponse = await backendController.updateQuery('saving_schemes', data, "uniqueid=?",[uniquekey]);
            if (updateResponse.success)
                res.json({msg: "Data Updated successfully", msg_type : 'success', success: true});
            else {
                console.log('Insert failed');
                res.json({success: false,msg: 'Error occurred while inserting data',msg_type: 'error',error: insertResponse.message || 'Unknown error'});
            }
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }
    else
    {
        try {
            const insertResponse = await backendController.insert({body: {tableName: 'saving_schemes',data: data}});
            
            if (insertResponse.success)
                res.json({msg: "Data entered successfully", msg_type : 'success', success: true});
            else {
                console.log('Insert failed');
                res.json({success: false,msg: 'Error occurred while inserting data',msg_type: 'error',error: insertResponse.message || 'Unknown error'});
            }
        } catch (error) {
            console.error('Error during insert operation:', error);
            res.json({success: false,msg: 'Error occurred while inserting data',msg_type: 'error',error: error.message || 'Unknown error'});
        }
    }
});

router.post("/fetchminmax", async (req, res) => {
    const {savingtype,metal} = req.body
    let savings = savingtype.split("[s~1]");
    const min_max = await backendController.selectQuery(`select min,max,step from savings_limitations where deleteon=? and branch=? and schemetype=? and type=?`,['0000-00-00',userToken.site,savings[0],metal]);
    res.json({ success: true, response: min_max });
});

router.get("/loadData", async (req, res) => {
    try {
        const results = await backendController.selectQuery(`SELECT * FROM saving_scheme_controller WHERE deleteon=? AND branch=?`, ['0000-00-00', userToken.site]);
        if(results)
            res.json({ success: true, response: results });
        else
            res.json({ success: true, response: null });
    } catch (error) {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg: "Server Error" });
    }
});
 
 module.exports = router;