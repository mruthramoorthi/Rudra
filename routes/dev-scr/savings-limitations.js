const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const router = express.Router();
const bcrypt =require("bcryptjs");
const jwt = require("jsonwebtoken");

 router.get("/savingType", async (req, res) => {
    backendController.selectQuery(`SELECT distinct savingstype,savingstype_explain FROM savings_types where deleteon=?`,['0000-00-00'])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            let optionTag = null;
                optionTag = `<option value="${item['savingstype']}">${backendController.caps(item['savingstype_explain'])}</option>`;
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

router.post("/insert", async (req, res) => {
    const {metal, scheme, savingtypes, min, max, narration, uniquekey, step} = req.body;  // For example, if allrowid = 3
    // Initialize an object to store the dynamic values
    console.log(min, max)
    const already_exist = await backendController.selectQuery(`select * from savings_limitations where deleteon=? and branch=? and schemetype=?`,['0000-00-00', userToken.site, savingtypes])
    const purchasecode =  backendController.generateUniqueId();
    if(metal=="nd")
        return res.json({success:false, msg_type:"error", msg:"Must Select a Metal..."});
    if(already_exist[0])
        return res.json({success:false, msg_type:"error", msg:"This Scheme Type is Already Exist Please Edit/Delete"});
    if(savingtypes=="nd")
        return res.json({success:false, msg_type:"error", msg:"Must Select a Savings Type..."});
    if(min<0)
        return res.json({success:false, msg_type:"error", msg:"Need a Minimum Amount"});
    if(max<=0)
        return res.json({success:false, msg_type:"error", msg:"Need a Maximum Amount"});
    if(step<=0)
        return res.json({success:false, msg_type:"error", msg:"Please Metion The Step of Values"});
    if(parseInt(max)<=parseInt(min))
        return res.json({success:false, msg_type:"error", msg:"Invalid Minimum And Maxmimum Amount"});
    const purchaseids = await backendController.generateUniqueNumbers('savings_limitations', 'groupid', 4, 'c');
    if(!purchaseids)
        return res.json({success:false, msg_type:"error", msg:"Contact Developer to Ask..."}); 
    if(uniquekey)
    {
        await backendController.deleted({ body : {'tableName' :'savings_limitations', 'whereCondition': `uniqueid=?`,'values':[uniquekey]}});
    }
    if(purchasecode)
    {
        try{
            const insert = await backendController.insert({body: {tableName:"savings_limitations",data:{step,type:metal,schemetype:savingtypes,schemename:scheme,groupcode:purchasecode,groupid:purchaseids[0],min,max,narration}}});
            if(insert.success)
                return res.json({success:true, msg_type:"success", msg:"SuccussFully set Limitations..."});
            else
                return res.json({success:false, msg_type:"error", msg:"Contact Developer to Ask..."});
        }
        catch(e){
            console.log("Error : "+e.message)
            return res.json({success:false, msg_type:"error", msg:"Contact Developer to Ask..."});
        }
    }
    else
        return res.json({success:false, msg_type:"error", msg:"Contact Developer to Ask..."});
});

router.post("/select", async (req, res) => {
    const totalRecode = await backendController.selectQuery(
        `SELECT count(*) as total FROM savings_limitations WHERE deleteon=? AND branch=?`,
        ['0000-00-00', userToken.site]
    );

    backendController.selectQuery(
        `SELECT * FROM savings_limitations WHERE deleteon=? AND branch=? ORDER BY uniqueid DESC`,
        ['0000-00-00', userToken.site]
    )
    .then(results => {
        const html = generateHTMLData(results);
        res.json({
            success: true,
            response: html,
            total: totalRecode[0].total,
            msg: "ok"
        });
    })
    .catch(error => {
        console.error('Error:', error);
        res.status(500).json({ success: false, msg: "Server Error" });
    });
});

function generateHTMLData(results) {
    let htmlContent = '';
    let sno = 0;
    let i = -1
    results.forEach(purchase => {
        sno++;
        const entryDate = backendController.rawDateFormat(purchase.entrydate, 'dmy');
        let checked = purchase.status?0:1;
        const edit_and_delete = `<div class='flex-with-space-edit-delete'>
            <img src="/images/edit.png" width="25" height="25" class="edit-iconi" id="edit-user${purchase.groupid}" uniquekey="${purchase.uniqueid}" datas='${JSON.stringify(purchase)}'/>
            <img src="/images/delete.png" width="25" height="25" class="delete-iconi" id="delete-user${purchase.groupid}" uniquekey="${purchase.uniqueid}" datas='${JSON.stringify(purchase)}'/>
        </div>`;
        htmlContent += `
            <tr>
                <td>${sno}</td>
                <td>${backendController.caps(purchase.schemename)}</td>
                <td>${backendController.caps(purchase.groupid)}</td>
                <td>${backendController.caps(purchase.type)}</td>
                <td>${backendController.caps(purchase.schemetype)}</td>
                <td>${backendController.money(purchase.min,3,1)}</td>
                <td>${backendController.money(purchase.max,3,1)}</td>
                <td>${htmls.createCustomCheckbox({id:"status"+purchase.uniqueid, className:"just-check", placeholder:" ", checked:checked})}</td>
                <td>${entryDate}</td>
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
          const results = await backendController.selectQuery(`SELECT * FROM savings_limitations where deleteon=? and uniqueid=? and branch=?`,['0000-00-00',uniquekey,userToken.site])
          let sts = 1;
          if(results[0].status=='1')
            sts = 0;
            const updation = await backendController.updateQuery("savings_limitations",{status:sts},'uniqueid=?',[uniquekey]);
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
          const deleteid = await backendController.deleted({ body : {'tableName' :'savings_limitations', 'whereCondition': `uniqueid=?`,'values':[uniquekey]}});
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