const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const { body } = require("express-validator");
const { Table } = require("jspdf-autotable");
const router = express.Router();

router.post("/select", async (req, res) => {
    // console.log(req.body.datas); // Logs all top-level keys of req
    const dealer_purchase = await backendController.selectQuery(`SELECT count(*) as total FROM login_users where deleteon=?`,['0000-00-00',userToken.site]);
    try{
        const purchase = await backendController.selectQuery(`SELECT t1.name,t1.statuswords,t1.site,t2.profile,t1.cookie,t1.system_info,t1.uniqueid FROM login_users as t1 join users as t2 on t1.userid=t2.userid where t1.deleteon=? and t2.deleteon=? order by t1.name asc`,['0000-00-00','0000-00-00'])
        const html = await generateHTMLData(purchase);
        res.json({ success: true, response: html, total: dealer_purchase[0].total, msg: "ok" });
    }
    catch(error) 
    {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg: "Server Error" });
    };
});

let sno = 0;
async function generateHTMLData(results) {
    let htmlContent = '';
     
    for (const item of results) {
        const tagged_jewels = await backendController.selectQuery(`SELECT * FROM page_access_logs WHERE deleteon=? AND cookie=?`, ['0000-00-00', item.cookie]);
        let page = "";
        let logo = "red-dot";
        if(item.statuswords=="active")
            logo = "green-dot";
        if(item.statuswords=="inactive")
            logo = "yellow-dot";
        if(tagged_jewels[0])
            page = tagged_jewels[0].page_name;
        sno++;
        htmlContent += `<tr><td id='rowspantag${item.lotcode}'>${sno}</td>
                            <td>${backendController.generateImageTag(item.profile, 'profile', 'popup-img', 'width: 30px;border-radius: 50%;padding:2px;')}</td>
                            <td>${backendController.caps(item.name)}</td>
                            <td>${backendController.caps(item.site)}</td>
                            <td><img src='/images/${logo}.png' class='dots'> ${backendController.caps(item.statuswords)}</td>
                            <td>${backendController.caps(page)}</td>
                            <td>${backendController.caps(item.system_info)}</td>
                            <td><img src='/images/delete.png' id='reject${item.uniqueid}' uniquekey='${item.uniqueid}' class='reject'></td>
                        </tr>`;
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
        const deleteid = await backendController.deleted({ body : {'tableName' :'login_users', 'whereCondition': `uniqueid=?`,'values':[uniquekey]}});
        if (deleteid.success)
            res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
    }
    catch(error) {
        console.error('Error in deleting:', error.message);
    }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});

module.exports = router;