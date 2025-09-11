const express = require("express");
const backendController = require('../../controllers/backend-functions');
const router = express.Router();
const { jsPDF } = require("jspdf");
require("jspdf-autotable");

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

router.post("/select", async (req, res) => {
    const totalRecode = await backendController.selectQuery(`SELECT count(*) as total FROM dealers where deleteon=? and branch=?`,['0000-00-00', userToken.site]);
    backendController.selectQuery(`SELECT * FROM dealers where deleteon=? and branch=?`,['0000-00-00', userToken.site])
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
        let edit_and_delete = `<div class='flex-with-space-edit-delete'>
                <img src="/images/edit.png" width="25" height="25" class="edit-icon" title="" id="edit-user${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>
                <img src="/images/delete.png" class="delete-icon" title="" width="25" height="25" id="delete-user${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>
              </div>`;
        htmlContent += `<tr><td>${sno}</td><td>${backendController.caps(item.company)}</td><td>${backendController.caps(item.dealername)}</td><td>${item.primaryph},${item.secondaryph}</td><td>${backendController.caps(item.state)}</td><td>${backendController.caps(item.city)}</td><td>${edit_and_delete}</td></tr>`;
    });
    sno = 0;
    return htmlContent;
}

router.get("/metal", async (req, res) => {
    backendController.selectQuery(`SELECT distinct product FROM product_category where deleteon=? and branch=?`,['0000-00-00',userToken.site])
    .then(results => {
        let options_arr = [];
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

// POST route to handle form submission
router.post('/insert',async (req, res) => {
    const { metals, companyname, gstin, dealername, dealercode, address, primaryph, secondaryph, state, district, imgpath_proof="", imgpath_photo="", uniquekey, accountnum, mailid, openinginamount, amount, openinginweight, weight} = req.body;
    const data = { metal: metals, accountnumber: accountnum, email: mailid, openingamount: openinginamount, amount, openingweight: openinginweight, weight, company:companyname, gstin, dealername, code:dealercode, address, primaryph, secondaryph, state, city:district, photo:imgpath_photo, proof:imgpath_proof};
    const company = await backendController.selectQuery(`SELECT * FROM dealers where deleteon=? and branch=? and uniqueid!=? and (dealername=? or gstin=? or primaryph=? or secondaryph=? or code=?)`,['0000-00-00', userToken.site, uniquekey, dealername, gstin, primaryph,secondaryph,dealercode]);
    const date = backendController.getCurrentDate();
    if(metals=='nd') {
        return res.json({msg:"Please Select Metal", msg_type : 'error', success: false });
    }
    if(company[0]) {
        return res.json({msg:"Dealer Already Exist", msg_type : 'error', success: false });
    }
    if (!companyname) {
        return res.json({msg:"Please Enter Company Name", msg_type : 'error', success: false });
    }
    else if(primaryph===secondaryph) {
        return res.json({msg:"Primary and secondary Numbers are Same Numbers", msg_type : 'error', success: false });
    }
    else if(!gstin){
        return res.json({msg:"Please Enter GST Number", msg_type : 'error', success: false });
    }
    else if (!dealername) {
        return res.json({msg:"Dealer Name is Not Valid", msg_type : 'error', success: false });
    }
    else if (!dealername) {
        return res.json({msg:"Dealer Name is Not Valid", msg_type : 'error', success: false });
    }
    else if (!dealercode) {
        return res.json({msg:"Dealer Code is Not Valid", msg_type : 'error', success: false });
    }
    else if (!address) {
        return res.json({msg:"Address is Not Valid", msg_type : 'error', success: false });
    }
    else if (!primaryph || primaryph.length < 10 || primaryph.length > 13) {
        return res.json({msg:"primaryph Phone Number is Not Valid " + primaryph, msg_type: 'error', success: false });
    }
    else if (!secondaryph || secondaryph.length < 10 || secondaryph.length > 13) {
        return res.json({msg:"secondaryph Phone Number is Not Valid", msg_type: 'error', success: false });
    }    
    else if (state==="nd") {
        return res.json({msg:"State is Invalid", msg_type : 'error', success: false });
    }
    else if (district==="nd") {
        return res.json({msg:"District is Not Valid", msg_type : 'error', success: false });
    }
    const cashs = openinginamount=="cr" ? Math.abs(amount) : -Math.abs(amount);
    const weights = openinginweight=="cr" ? Math.abs(weight) : -Math.abs(weight);
    if(openinginamount!='nd' || openinginweight!="nd")
    {
        await backendController.deleted({body:{tableName:"dealer_balance_opening",whereCondition:"dealercode=?", values:[dealercode]}});
        await backendController.insert({body: {tableName:"dealer_balance_opening", data: { date,weight:weights,cash:cashs,dealercode,metal:metals }}});
    }
    if (uniquekey) {
        try {
            
          // Call the `deleted()` function with the necessary arguments
            const updateResponse = await backendController.updateQuery('dealers', data, "uniqueid=?",[uniquekey],"","id");
            const update1 = await backendController.updateQuery('entities', {userid:dealercode,entity_type:"supplier",name:dealername,alias:dealercode,ph1:primaryph,ph2:secondaryph,address,profile:imgpath_photo,proof:imgpath_proof, state, district,ref:updateResponse.result[0].lastInsertId}, `ref=?`,[uniquekey],"", "id");
            if (updateResponse.success)
                res.json({msg: "Data entered successfully", msg_type : 'success', success: true});
            else {
                console.log('Insert failed');
                res.json({success: false,msg: 'Error occurred while inserting data',msg_type: 'error',error: insertResponse.message || 'Unknown error'});
        }
          
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }
    else
        try {
            const insertResponse = await backendController.insert({body: {tableName: 'dealers',data: data, column:"id"}});
            const insertResponse1 = await backendController.insert({body: {tableName: 'entities',data: {ref:insertResponse.lastInsertId,userid:dealercode,entity_type:"supplier",name:dealername,alias:dealercode,ph1:primaryph,ph2:secondaryph,address,profile:imgpath_photo,proof:imgpath_proof, state, district}, column:"id"}});
            if (insertResponse.success && insertResponse1.success)
                res.json({msg: "Data entered successfully", msg_type : 'success', success: true});
            else {
                console.log('Insert failed');
                res.json({success: false,msg: 'Error occurred while inserting data',msg_type: 'error',error: insertResponse.message || 'Unknown error'});
            }
        } catch (error) {
            console.error('Error during insert operation:', error);
            res.json({success: false,msg: 'Error occurred while inserting data',msg_type: 'error',error: error.message || 'Unknown error'});
        }
});

// POST route to handle form submission
router.post('/delete',async (req, res) => {
    const { uniquekey } = req.body;
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const deleteid = await backendController.deleted({ body : {'tableName' :'dealers', 'whereCondition': `uniqueid=?`,'values':[uniquekey]}});
          const deleteid2 = await backendController.deleted({ body : {'tableName' :'entities', 'whereCondition': `ref=?`,'values':[uniquekey]}});
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