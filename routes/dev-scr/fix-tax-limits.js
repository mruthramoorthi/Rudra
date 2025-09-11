const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const { options } = require("pdfkit");
const { route } = require("../pages");
const { jsPDF } = require("jspdf");
const bcrypt =require("bcryptjs");
require("jspdf-autotable");
const router = express.Router();

router.get('/showTax',async (req, res) => {
    try {
        const data = await backendController.selectQuery("select * from company_tax_limits where deleteon=? and branch=?",['0000-00-00', userToken.site]);
        if(data)
            res.json({success: true, response: data});
        else
            res.status(404).redirect("/404");
    }
    catch (error) {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg: "Server Error" });
    }
});

// POST route to handle form submission
router.post('/insert',async (req, res) => {
    const { cgst, sgst, igst, discount, discountamt, uniquekey } = req.body;
    const Updatedata = {cgst,sgst,igst,discount,discountamt,uniquekey};
    // Proceed with the insertion logic
    try {
        // Call the `deleted()` function with the necessary arguments
        const update = await backendController.updateQuery('company_tax_limits', Updatedata, `uniqueid<=? and branch=?`,[uniquekey, userToken.site]);
        if(update.success)
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
        console.error('Error in deleting:', error.message);
    }
});


module.exports = router;