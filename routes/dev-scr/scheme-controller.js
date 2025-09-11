const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const router = express.Router();
const { jsPDF } = require("jspdf");
require("jspdf-autotable");

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

router.post('/insert',async (req, res) => {
   const { savingnumber,totalmonth,total_amount,month_condition,uniquekey,str_duration,due_date_res,paypermonth} = req.body;
   const data = { savings_number_starts_with:savingnumber,month:totalmonth,savings_number_edit:total_amount,month_edit:month_condition,strict_no_duration:str_duration,due_date_edit:due_date_res,paypermonth:paypermonth };
    try {
        const updateResponse = await backendController.updateQuery('saving_scheme_controller', data, "uniqueid<=?",[uniquekey]);
        if (updateResponse.success)
            res.json({msg: "Data Updated successfully", msg_type : 'success', success: true});
        else {
            console.log('Insert failed');
            res.json({success: false,msg: 'Error occurred while inserting data',msg_type: 'error',error: insertResponse.message || 'Unknown error'});
        }
    } catch (error) {
        console.error('Error in deleting:', error.message);
    }
});

module.exports = router;