const express = require("express");
const backendController = require('../../controllers/backend-functions');
const router = express.Router();

// Other routes...
router.post('/insert', backendController.insert);

// POST route to handle form submission
router.post('/delete',async (req, res) => {
    const { uniquekey } = req.body;
    if (uniquekey) {
        try {
            console.log(uniquekey)
          // Call the `deleted()` function with the necessary arguments
          const deleteid = await backendController.deleted({ body : {tableName :'tables', whereCondition: `uniqueid = ?`, values : [uniquekey]}});
          if (deleteid.success)
            res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});

router.post('/createTable', backendController.createTable);
router.post('/fetchData', async (req, res) => {
    let { page = 1, limit = 10 } = req.body;  // Default page 1 and limit 10
    try
    {
        const results = await backendController.selectQuery(`SELECT * FROM tables where deleteon=? order by tablename asc`,['0000-00-00']);
        const totalRows = await backendController.selectQuery(`SELECT count(*) as total FROM tables where deleteon=?`,['0000-00-00']);
        // const regular = backendController.updateQuery("all_pages_roles",{role:'owneri',route:'12'},'route=?',['master'])

        const htmls = await generateHTMLData(results);
        res.json({ success: true, response: htmls, total: totalRows[0].total, msg: "ok" });

    }catch(error) {
            console.error('Error:', error);  // Handle rejection properly here
            res.status(500).json({ success: false, msg: "Server Error" });
        };
});

let sno = 0;
async function generateHTMLData(results) {
    let htmlContent = '';
    try {
        results.forEach(item => {
            let edit_and_delete = `<div class='flex-with-space-edit-delete'>
                        <img src="/images/edit.png" width="25" height="25" class="edit-icon" title="" id="edit-user${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>
                        <img src="/images/delete.png" class="delete-icon" title="" width="25" height="25" id="delete-user${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>
                    </div>`;

                let checked = "";
                if(item.status==1)
                    checked = "checked";
                sno++;
                htmlContent += `<tr><td>${sno}</td><td>${item.tablename}</td><td>${edit_and_delete}</td></tr>`;
        });

        sno = 0;
        if (!htmlContent)
            htmlContent = "There is No Data to Load";
        return htmlContent;
    } catch (error) {
        console.error('Error in generateHTMLData:', error);  // Handle rejection properly here
        throw error;  // Re-throw error for higher-level handling
    }
}

module.exports = router;