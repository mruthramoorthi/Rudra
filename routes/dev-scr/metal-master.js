const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const { body } = require("express-validator");
const { Table } = require("jspdf-autotable");
const router = express.Router();

router.post("/selectBoxes", async (req, res) => {
    const how = req.body.how;
    backendController.selectQuery(`SELECT * FROM metals where deleteon=? and branch=?`,['0000-00-00', userToken.site])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
                let optionTag = `${item['nameofmetal']}:${backendController.capitalizeFirstLetters(item['nameofmetal'])}`;
                options_arr.push(optionTag);
        });
        const html = options_arr.join(',');
        let all_html = "";
        for (let i = 1; i <= how; i++)
            all_html += htmls.selectBoxes({id:'metal'+i, options:"nd: - Metal - ,"+html})+"<br>";
        res.json({ success: true, response: all_html+"[temp]"+how });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.get("/loadMetal", async (req, res) => {
    backendController.selectQuery(`SELECT * FROM metals where deleteon=? and branch=?`,['0000-00-00', userToken.site])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            let optionTag = `<option value="${item['nameofmetal']}">${backendController.capitalizeFirstLetters(item['nameofmetal'])}</option>`;
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
    const totalRecode = await backendController.selectQuery(`SELECT count(*) as total FROM metals where deleteon=? and branch=?`,['0000-00-00', userToken.site]);
    backendController.selectQuery(`SELECT * FROM metals where deleteon=? and branch=?`,['0000-00-00', userToken.site])
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
        htmlContent += `<tr><td>${sno}</td><td>${backendController.capitalizeFirstLetters(item.nameofmetal)}</td><td>${edit_and_delete}</td></tr>`;
    });
    sno = 0;
    return htmlContent;
}

router.post("/insert", async (req, res)=>{
    const { metal, uniquekey} = req.body;
    let metal_value = "";
    const data = {nameofmetal:metal};
    const already = await backendController.selectQuery(`SELECT * FROM metals where nameofmetal=? and deleteon=? and branch=?`,[metal,'0000-00-00',userToken.site]);
    if(already[0])
        return res.json({ msg: "Already Metal Exist...", msg_type: 'error', success: false });
    if(metal==="")
        return res.json({ msg: "At least one metal type must be associated with each product.", msg_type: 'error', success: false });
    if(uniquekey)
    {
        try {
            // Call the `deleted()` function with the necessary arguments
              const updateResponse = await backendController.updateQuery('metals', data, "uniqueid=?",[uniquekey]);
  
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
            const insertResponse = await backendController.insert({body: {tableName: "metals", data}});
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
          const deleteid = await backendController.deleted({ body : {'tableName' :'metals', 'whereCondition': `uniqueid=?`,'values':[uniquekey]}});
          if (deleteid.success)
            return res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});

module.exports = router;