const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const router = express.Router();
const { jsPDF } = require("jspdf");
const { body } = require("express-validator");
require("jspdf-autotable");

router.get("/customer", async (req, res) => {
    const data = JSON.parse(req.headers.data);
    // Access the 'cnumber' property
    const cnumber = data.cnumber;
    const cname = data.cname;
    let query = "";
    let datas = [];
    if(cnumber)
    {
        query += " and (primaryphonenumber like ? or secondaryphonenumber like ?)";
        datas.push(`%${cnumber}%`,`%${cnumber}%`);
    }
    if(cname)
    {
        query += " and (name like ? or lastname like ?)";
        datas.push(`%${cname}%`,`%${cname}%`);
    }
    if(query)
    {
        backendController.selectQuery(`SELECT distinct name,userid FROM users where deleteon=? and branch=? and typeofpeople=?${query}`,['0000-00-00',userToken.site,'customer',...datas])
        .then(results => {
            let options_arr = [];
            results.forEach(item => {
                options_arr.push(`<option value="${item['userid']}[r~12]${item['name']}">${backendController.caps(item['name'])}</option>`);
            });
            const html = options_arr.join('');
            res.json({ success: true, response: html });
        })
        .catch(error => {
            console.error('Error:', error);  // Handle rejection properly here
            res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
        });
    }
    else
    {
        return res.json({msg: "Please Search With Valid Keys", msg_type : 'error', success: false});
    }
 });

router.post("/fetchDetails", async (req, res) => {
    const {customer} = req.body;
    const real_customer = customer.split("[r~12]");
    try{
            const customer_details = await backendController.selectQuery(`select * from users where deleteon=? and branch=? and userid=?`,['0000-00-00',userToken.site,real_customer[0]]);
            res.json({success:true, response: customer_details});
    } catch (error) {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg: "Server Error" });
    }
});

router.get("/group", async (req, res) => {
   backendController.selectQuery(`SELECT * FROM saving_schemes where deleteon=? and branch=? and status=?`,['0000-00-00',userToken.site,'0'])
   .then(results => {
       let options_arr = [];
       results.forEach(item => {
           options_arr.push(`<option value="${item["schemecode"]}">${backendController.allCaps(item['schemegroup'])}</option>`);
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
   const totalRecode = await backendController.selectQuery(`SELECT count(*) as total FROM customer_savings_enroll where deleteon=? and branch=? and ob=?`,['0000-00-00',userToken.site,1]);
   try {
        const results = await backendController.selectQuery(
            `SELECT * FROM customer_savings_enroll WHERE deleteon = ? AND branch = ? AND ob = ?`,
            ['0000-00-00', userToken.site, 1]
        );

        const html = await generateHTMLData(results);

        res.json({
            success: true,
            response: html,
            total: totalRecode[0].total,
            msg: "ok"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            msg: "Server Error"
        });
    }

});

let sno = 0;
async function generateHTMLData(results) {
   let htmlContent = '';
   for (let i = 0; i < results.length; i++) {
        const item = results[i];
        sno++;
        const entryDate = backendController.rawDateFormat(item.entrydate);

        let edit_and_delete = `<div class='flex-with-space-edit-delete'>`;
        const dates = await backendController.selectQuery(`select GROUP_CONCAT(duedate SEPARATOR "[dd]") as dates from savings_transactions where deleteon=? and branch=? and savingnumber=?`,['0000-00-00', userToken.site, item.savings_number]);
        if (!userToken.rights_result || userToken.rights_result.edit_rights === 0) {
            edit_and_delete += `<img src="/images/edit.png" width="25" height="25" class="edit-icon" title="" id="edit-user${item.uniqueid}" uniquekey="${item.uniqueid}" dates="${dates[0].dates}" datas='${JSON.stringify(item)}'/>`;
        }

        if (!userToken.rights_result || userToken.rights_result.delete_rights === 0) {
            edit_and_delete += `<img src="/images/delete.png" class="delete-icon" title="" width="25" height="25" id="delete-user${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>`;
        }

        edit_and_delete += `</div>`;

        htmlContent += `<tr><td>${sno}</td><td>${backendController.caps(item.savings_number)}</td><td>${item.savings_count}</td><td>${backendController.caps(item.schemegroup)}</td><td>${item.savingname}</td><td>${item.ph1}</td><td>${item.due}</td><td>${item.month}</td><td>${backendController.formatNumberWithCommas(item.totalamount)}</td><td>${edit_and_delete}</td></tr>`;
    }
   sno = 0;
   return htmlContent;
}

// POST route to handle form submission
router.post('/delete',async (req, res) => {
   const { uniquekey } = req.body;
   if (uniquekey) {
       try {
         // Call the `deleted()` function with the necessary arguments
         const schemecode = await backendController.selectQuery(`select * from customer_savings_enroll where deleteon=? and branch=? and uniqueid=?`,['0000-00-00',userToken.site,uniquekey])
         const deleteid = await backendController.deleted({ body : {'tableName' :'customer_savings_enroll', 'whereCondition': `uniqueid=?`,'values':[uniquekey]}});
         const deleteid2 = await backendController.deleted({ body : {'tableName' :'scheme_group_count', 'whereCondition': `schemecode=? and savingsnumber=? and savingscount=? and schemegroup=?`,'values':[schemecode[0].schemecode, schemecode[0].savings_number, schemecode[0].savings_count, schemecode[0].schemegroup]}});
         const deleteid3 = await backendController.deleted({ body : {'tableName' :'savings_transactions', 'whereCondition': `schemecode=? and savingnumber=? and savingcount=? and savinggroup=?`,'values':[schemecode[0].schemecode, schemecode[0].savings_number, schemecode[0].savings_count, schemecode[0].schemegroup]}});
         if (deleteid.success && deleteid2.success && deleteid3.success)
           res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
       } catch (error) {
         console.error('Error in deleting:', error.message);
       }
   }
   else
       return res.json({msg:"Delete Id is Not Valid "+uniquekey, msg_type : 'error', success: false });
});

router.post('/insert',async (req, res) => {
    const { customer, group, customername, ph1, ph2, address, uniquekey, savingcount, savingnumbers, howmany, barcode, chitnumber} = req.body;
    if(group==="nd")
        return res.json({ msg: "Group Must Be Select", msg_type: 'error', success: false });
    if(customer==="nd")
        return res.json({ msg: "Customer Must Be Select", msg_type: 'error', success: false });
    if(!customername)
        return res.json({ msg: "Customer Name is Invalid", msg_type: 'error', success: false });
    const customer_details = customer.split("[r~12]");
    const scheme_details = await backendController.selectQuery('select * from saving_schemes where deleteon=? and branch=? and schemecode=?',['0000-00-00',userToken.site,group]);
    const count_of_chit = await backendController.selectQuery(`select count(*) as count from customer_savings_enroll where branch=?`,[userToken.site]);
    const chit_count = await backendController.selectQuery(`select count(*) as count from customer_savings_enroll where branch=? and schemegroup=?`,[userToken.site,scheme_details[0].schemegroup]);
    let number = savingnumbers;
    let count = savingcount;
    if(!uniquekey)
    {
        number = barcode;
        count = chitnumber;
    }
    const data = { name:customer_details[1],savingname: customername, schemegroup:scheme_details[0].schemegroup, ph1, ph2, address, id:customer_details[0], savings_number:number, savings_count:count, month:scheme_details[0].month, schemecode:group, totalamount:scheme_details[0].totalamount, due:scheme_details[0].due, ob:howmany };
    if (uniquekey)
    {
        try {
            // Call the `deleted()` function with the necessary arguments
            const schemecode = await backendController.selectQuery(`select * from customer_savings_enroll where deleteon=? and branch=? and uniqueid=?`,['0000-00-00',userToken.site,uniquekey])
            const deleteid = await backendController.deleted({ body : {'tableName' :'customer_savings_enroll', 'whereCondition': `uniqueid=?`,'values':[uniquekey]}});
            const deleteid2 = await backendController.deleted({ body : {'tableName' :'scheme_group_count', 'whereCondition': `schemecode=? and savingsnumber=? and savingscount=? and schemegroup=?`,'values':[schemecode[0].schemecode, schemecode[0].savings_number, schemecode[0].savings_count, schemecode[0].schemegroup]}});
            const deleteid3 = await backendController.deleted({ body : {'tableName' :'savings_transactions', 'whereCondition': `schemecode=? and savingnumber=? and savingcount=? and schemegroup=?`,'values':[schemecode[0].schemecode, schemecode[0].savings_number, schemecode[0].savings_count, schemecode[0].schemegroup]}});
        }
        catch (error) {
            console.error('Error in deleting:', error.message);
        }
    }
    try
    {
        const insertResponse = await backendController.insert({body: {tableName: 'customer_savings_enroll',data: data}});
        const insertResponse1 = await backendController.insert({body: {tableName: 'scheme_group_count',data: { savingsnumber:number, savingscount:count, schemecode:group, schemegroup:scheme_details[0].schemegroup,ob:howmany }}});
        // Loop through field names to dynamically access and store values from req.body
        for (let sno=1; sno<=howmany; sno++) {
            // Construct the key dynamically based on rowid (e.g., product1, product2, etc.)
            const date =req.body[`date_${sno}`];
            const nextdate =req.body[`date_${parseInt(sno+1)}`];
            await backendController.insert({body: {tableName: 'savings_transactions', data:{ob:howmany, due: scheme_details[0].due,savinggroup: scheme_details[0].schemegroup, savingnumber:number, savingcount:count, cashamount:scheme_details[0].due, amountin:"cash", duedate: date, nextduedate:nextdate, duemonth: sno }}});
        }
        if (insertResponse.success)
            res.json({msg: "Data entered successfully", msg_type : 'success', success: true});
        else {
            console.log('Insert failed');
            res.json({success: false,msg: 'Error occurred while inserting data',msg_type: 'error',error: insertResponse.message || 'Unknown error'});
        }
    }
    catch (error)
    {
        console.error('Error during insert operation:', error);
        res.json({success: false,msg: 'Error occurred while inserting data',msg_type: 'error',error: error.message || 'Unknown error'});
    }
});

router.post('/delete',async (req, res) => {
   const { uniquekey } = req.body;
   if (uniquekey) {
       try {
         // Call the `deleted()` function with the necessary arguments
         const schemecode = await backendController.selectQuery(`select * from customer_savings_enroll where deleteon=? and branch=? and uniqueid=?`,['0000-00-00',userToken.site,uniquekey])
         const deleteid = await backendController.deleted({ body : {'tableName' :'customer_savings_enroll', 'whereCondition': `uniqueid=?`,'values':[uniquekey]}});
         const deleteid2 = await backendController.deleted({ body : {'tableName' :'scheme_group_count', 'whereCondition': `schemecode=? and savingsnumber=? and savingscount=? and schemegroup=? and ob=?`,'values':[schemecode[0].schemecode, schemecode[0].savings_number, schemecode[0].savings_count, schemecode[0].schemegroup,1]}});
         const deleteid3 = await backendController.deleted({ body : {'tableName' :'savings_transactions', 'whereCondition': `schemecode=? and savingnumber=? and savingcount=? and schemegroup=? and ob=?`,'values':[schemecode[0].schemecode, schemecode[0].savings_number, schemecode[0].savings_count, schemecode[0].schemegroup,1]}});
        if (deleteid.success)
           res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
       } catch (error) {
         console.error('Error in deleting:', error.message);
       }
   }
   else
       return res.json({msg:"Delete Id is Not Valid "+uniquekey, msg_type : 'error', success: false });
});

module.exports = router;