const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require("../../helpers");
const router = express.Router();
const { jsPDF } = require("jspdf");
require("jspdf-autotable");

router.get("/products", async (req, res) => {
    backendController.selectQuery(`SELECT * FROM metal_master where deleteon=? and branch=?`,['0000-00-00', userToken.site])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            let optionTag = `<option value="${item['product']}">${backendController.capitalizeFirstLetters(item['product'])}</option>`;
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
    const totalRecode = await backendController.selectQuery(`SELECT count(*) as total FROM product_category where deleteon=? and branch=?`,['0000-00-00', userToken.site]);
    backendController.selectQuery(`SELECT * FROM product_category where deleteon=? and branch=?`,['0000-00-00', userToken.site])
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
        htmlContent += `<tr><td>${sno}</td><td>${backendController.capitalizeFirstLetters(item.product)}</td><td>${backendController.capitalizeFirstLetters(item.category)}</td><td>${item.percentage}</td><td>${edit_and_delete}</td></tr>`;
    });
    sno = 0;
    return htmlContent;
}

router.post("/addonSelect", async (req, res) => {
    const totalRecode = await backendController.selectQuery(`SELECT count(*) as total FROM add_on_products where deleteon=? and branch=?`,['0000-00-00', userToken.site]);
    backendController.selectQuery(`SELECT * FROM add_on_products where deleteon=? and branch=?`,['0000-00-00', userToken.site])
        .then(results => {
            const html = generateHTMLDataAdd(results);
            res.json({ success: true, response: html, total: totalRecode[0].total, msg: "ok" });
        })
        .catch(error => {
            console.error('Error:', error);  // Handle rejection properly here
            res.status(500).json({ success: false, msg: "Server Error" });
        });
});

let snoadd = 0;
function generateHTMLDataAdd(results) {
    let htmlContent = '';
    results.forEach(item => {
        snoadd ++;
        const entryDate = backendController.rawDateFormat(item.entrydate);
        // console.log(entryDate)
        let edit_and_delete = `<div class='flex-with-space-edit-delete'>
                <img src="/images/edit.png" width="25" height="25" class="edit-icon-add" title="" id="edit-user-add${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>
                <img src="/images/delete.png" class="delete-icon-add" title="" width="25" height="25" id="delete-user-add${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>
              </div>`;
              let checked = "";
            if(item.status==0)
                checked = "checked";
        htmlContent += `<tr><td>${snoadd}</td><td>${backendController.capitalizeFirstLetters(item.type)}</td><td>${backendController.capitalizeFirstLetters(item.name)}</td><td>${htmls.createCustomCheckbox({id:"status"+item.uniqueid, className:"just-check", checked:checked, placeholder:" "})}</td><td>${edit_and_delete}</td></tr>`;
    });
    sno = 0;
    return htmlContent;
}

router.post("/stoneSelect", async (req, res) => {
    const totalRecode = await backendController.selectQuery(`SELECT count(*) as total FROM stone_products where deleteon=? and branch=?`,['0000-00-00', userToken.site]);
    backendController.selectQuery(`SELECT * FROM stone_products where deleteon=? and branch=?`,['0000-00-00', userToken.site])
        .then(results => {
            const html = generateHTMLDataStone(results);
            res.json({ success: true, response: html, total: totalRecode[0].total, msg: "ok" });
        })
        .catch(error => {
            console.error('Error:', error);  // Handle rejection properly here
            res.status(500).json({ success: false, msg: "Server Error" });
        });
});

let snostone = 0;
function generateHTMLDataStone(results) {
    let htmlContent = '';
    results.forEach(item => {
        snostone ++;
        const entryDate = backendController.rawDateFormat(item.entrydate);
        // console.log(entryDate)
        let edit_and_delete = `<div class='flex-with-space-edit-delete'>
                <img src="/images/edit.png" width="25" height="25" class="edit-icon-stone" title="" id="edit-user-stone${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>
                <img src="/images/delete.png" class="delete-icon-stone" title="" width="25" height="25" id="delete-user-stone${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>
              </div>`;
              let checked = "";
            if(item.status==0)
                checked = "checked";
        htmlContent += `<tr><td>${snostone}</td><td>${backendController.capitalizeFirstLetters(item.type)}</td><td>${backendController.capitalizeFirstLetters(item.name)}</td><td>${htmls.createCustomCheckbox({id:"status"+item.uniqueid, className:"just-check", checked:checked, placeholder:" "})}</td><td>${edit_and_delete}</td></tr>`;
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
          const results = await backendController.selectQuery(`SELECT * FROM add_on_products where deleteon=? and uniqueid=?`,['0000-00-00',...uniquekey])
          let sts = 1;
          if(results[0].status=='1')
            sts = 0; 
            await backendController.updateQuery("add_on_products",{status:sts},'type=? and name=? and deleteon=?',[results[0].type,results[0].name,'0000-00-00'])
        } catch (error) {
          console.error('Error in update:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});

router.post("/insert", async (req, res)=>{
    const {percentage, category, products, uniquekey} = req.body;

    const data = {product:products, percentage, category};
    const already = await backendController.selectQuery(`SELECT * FROM product_category where category like ? and deleteon=? and uniqueid!=?`,[category,'0000-00-00',uniquekey]);
    if(already[0])
        return res.json({ msg: "Already Product Exist...", msg_type: 'error', success: false });
    if(!category)
        return res.json({ msg: "At least one metal type must be associated with each product.", msg_type: 'error', success: false });
    else if(products=="nd")
        return res.json({ msg: "Product Name is Must", msg_type: 'error', success: false });
    if(uniquekey)
    {
        try {
            // Call the `deleted()` function with the necessary arguments
              const updateResponse = await backendController.updateQuery('product_category', data, "uniqueid=?",[uniquekey]);
  
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
        try{
            const insertResponse = await backendController.insert({body: {tableName: "product_category", data}});
            if (insertResponse.success)
                res.json({msg: "Data entered successfully", msg_type : 'success', success: true});
            else {
                console.log('Insert failed');
                res.json({success: false,msg: 'Error occurred while inserting data',msg_type: 'error',error: insertResponse.message || 'Unknown error'});
            }
        }
        catch (error) {
            console.error('Error during insert operation:', error);
            res.json({success: false,msg: 'Error occurred while inserting data',msg_type: 'error',error: error.message || 'Unknown error'});
        }
});

router.post("/insertAdd", async (req, res)=>{
    const {addontype, addonname, adduniquekey} = req.body;

    const data = {type:addontype, name:addonname};
    const already = await backendController.selectQuery(`SELECT * FROM add_on_products where type=? and name=? and deleteon=? and uniqueid!=?`,[addontype,addonname,'0000-00-00',adduniquekey]);

    if(already[0])
        return res.json({ msg: "Already Product Exist...", msg_type: 'error', success: false });
    if(!addontype)
        return res.json({ msg: "Add-on Type Must.", msg_type: 'error', success: false });
    if(!addonname)
        return res.json({ msg: "Product Name is Must.", msg_type: 'error', success: false });
    if(adduniquekey)
    {
        try {
            // Call the `deleted()` function with the necessary arguments
              const updateResponse = await backendController.updateQuery('add_on_products', data, "uniqueid=?",[adduniquekey]);
  
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
        try{
            const insertResponse = await backendController.insert({body: {tableName: "add_on_products", data}});
            if (insertResponse.success)
                res.json({msg: "Data entered successfully", msg_type : 'success', success: true});
            else {
                console.log('Insert failed');
                res.json({success: false,msg: 'Error occurred while inserting data',msg_type: 'error',error: insertResponse.message || 'Unknown error'});
            }
        }
        catch (error) {
            console.error('Error during insert operation:', error);
            res.json({success: false,msg: 'Error occurred while inserting data',msg_type: 'error',error: error.message || 'Unknown error'});
        }
});

router.post("/insertStone", async (req, res)=>{
    const {stonetype, stonename, stoneuniquekey} = req.body;

    const data = {type:stonetype, name:stonename};
    const already = await backendController.selectQuery(`SELECT * FROM stone_products where type=? and name=? and deleteon=? and uniqueid!=?`,[stonetype,stonename,'0000-00-00',stoneuniquekey]);

    if(already[0])
        return res.json({ msg: "Already Product Exist...", msg_type: 'error', success: false });
    if(!stonetype)
        return res.json({ msg: "Stone Type Must.", msg_type: 'error', success: false });
    if(!stonename)
        return res.json({ msg: "Product Name is Must.", msg_type: 'error', success: false });
    if(stoneuniquekey)
    {
        try {
            // Call the `deleted()` function with the necessary arguments
              const updateResponse = await backendController.updateQuery('stone_products', data, "uniqueid=?",[stoneuniquekey]);
  
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
        try{
            const insertResponse = await backendController.insert({body: {tableName: "stone_products", data}});
            if (insertResponse.success)
                res.json({msg: "Data entered successfully", msg_type : 'success', success: true});
            else {
                console.log('Insert failed');
                res.json({success: false,msg: 'Error occurred while inserting data',msg_type: 'error',error: insertResponse.message || 'Unknown error'});
            }
        }
        catch (error) {
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
          const deleteid = await backendController.deleted({ body : {'tableName' :'product_category', 'whereCondition': `uniqueid=?`,'values':[uniquekey]}});
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
router.post('/deleteAdd',async (req, res) => {
    const { uniquekey } = req.body;
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const deleteid = await backendController.deleted({ body : {'tableName' :'add_on_products', 'whereCondition': `uniqueid=?`,'values':[uniquekey]}});
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
router.post('/deleteStone',async (req, res) => {
    const { uniquekey } = req.body;
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const deleteid = await backendController.deleted({ body : {'tableName' :'stone_products', 'whereCondition': `uniqueid=?`,'values':[uniquekey]}});
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
router.post('/deleteAdd',async (req, res) => {
    const { uniquekey } = req.body;
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const deleteid = await backendController.deleted({ body : {'tableName' :'add_on_products', 'whereCondition': `uniqueid=?`,'values':[uniquekey]}});
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
