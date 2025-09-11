const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const { options } = require("pdfkit");
const { route } = require("../pages");
const { jsPDF } = require("jspdf");
const bcrypt =require("bcryptjs");
require("jspdf-autotable");
const router = express.Router();
router.get("/loadRate", async (req, res) => {
    let html = "";
    let lastProduct = ""; // Variable to track the last product added
    let sno = 0;
    try {
        const results = await backendController.selectQuery(`SELECT * FROM product_category WHERE deleteon=? AND branch=? group by product,category order by category asc`, ['0000-00-00', userToken.site]);
        const rates = await backendController.selectQuery(`SELECT * FROM rate_master WHERE deleteon=? AND branch=?`, ['0000-00-00', userToken.site]);
        results.forEach(item => {
            sno++;
            // Check if the product is different from the last one added
            if (item.product !== lastProduct) {
                // Add the product as a heading
                if(sno!==1)
                    html += `</div></div>`;
                html += `<div class="snowdiv"><h3>${backendController.capitalizeFirstLetters(item.product)}</h3><div class='rates'>`;
                lastProduct = item.product; // Update the last product added
            }
            const itemi = rates.find(itemi => itemi.category === item.category);
            let pricing = 0 ;
            if(itemi)
                pricing = itemi.price; // Return the price if the category is found
            // Add the category input element
            html += htmls.createInputElement({ type: "number", id: `${item.category.replaceAll(" ","_")}`, placeholder: backendController.capitalizeFirstLetters(item.category), value: pricing });
        });
        lastProduct='';
        html += `</div></div>`;
        html += `<div class="snowdiv"><h3>Add-on Products</h3><div class='rates'>`;
        const add_on = await backendController.selectQuery(`SELECT * FROM add_on_products WHERE deleteon=? AND branch=? and status=?`, ['0000-00-00', userToken.site,"0"]);
        add_on.forEach(item => {
            sno++;
            const itemi = rates.find(itemi => itemi.category === item.name);
            let pricing = 0 ;
            if(itemi)
                pricing = itemi.price; // Return the price if the category is found
            // Add the category input element
            html += htmls.createInputElement({ type: "number", id: `${item.name.replaceAll(" ","_")}`, placeholder: backendController.capitalizeFirstLetters(item.name), value: pricing });
        });
        lastProduct='';
        html += `</div></div><div class="snowdiv"><h3>Stone Products</h3><div class='rates'>`;
        const stone = await backendController.selectQuery(`SELECT * FROM stone_products WHERE deleteon=? AND branch=? and status=?`, ['0000-00-00', userToken.site,"0"]);
        stone.forEach(item => {
            sno++;
            const itemi = rates.find(itemi => itemi.category === item.name);
            let pricing = 0 ;
            if(itemi)
                pricing = itemi.price; // Return the price if the category is found
            // Add the category input element
            html += htmls.createInputElement({ type: "number", id: `${item.name.replaceAll(" ","_")}`, placeholder: backendController.capitalizeFirstLetters(item.name), value: pricing });
        });
        res.json({ success: true, response: html+`</div></div>` });
    } catch (error) {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg: "Server Error" });
    }
});

router.post("/insert", async (req, res) => {
    try {
        const results = await backendController.selectQuery(`SELECT category FROM product_category WHERE deleteon=? AND branch=? GROUP BY product, category ORDER BY category ASC`, ['0000-00-00', userToken.site]);
        const results1 = await backendController.selectQuery(`SELECT name as category FROM add_on_products WHERE deleteon=? AND branch=? and status=?`, ['0000-00-00', userToken.site,'0']);
        const results2 = await backendController.selectQuery(`SELECT name as category FROM stone_products WHERE deleteon=? AND branch=? and status=?`, ['0000-00-00', userToken.site,'0']);
        const combinedResults = [...results, ...results1, ...results2];
        for (const item of combinedResults) {
            const categories = req.body[item.category.replaceAll(" ", "_")];
            const data = { category: item.category, price: categories };
            // Wait for the deletion to complete before moving on to insert
            await backendController.deleted({body: {'tableName': 'rate_master','whereCondition': `category=? AND branch=?`,'values': [item.category, userToken.site]}});
            // Now that deletion is complete, insert the new data
            await backendController.insert({body: {tableName: 'rate_master',data: data}});
        }

        res.json({ msg: "Data entered successfully", msg_type: 'success', success: true });
    } catch (error) {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg: "Server Error" });
    }
});



module.exports = router;