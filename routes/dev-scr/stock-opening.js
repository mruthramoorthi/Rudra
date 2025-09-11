const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const { body } = require("express-validator");
const router = express.Router();
const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default;

// Route to generate and serve PDF
router.post("/pdf", async (req, res) => {
    const { id } = req.body;
    try {
        // Fetch data from the database
        const purchase = await backendController.selectQuery("select * from stock_opening where deleteon=? and branch=? and openingid=?", ["0000-00-00",userToken.site,id]);
        
        // Create a new PDF document with A4 size
        const doc = new jsPDF({
            orientation: "landscape", // "portrait" or "landscape"
            unit: "mm",              // Measurement unit (mm)
            format: "a4",            // Set format to A4
        });

        // Add the heading "All Users"
        doc.setFontSize(16);

        // Get the page width and calculate the center
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;

        // Add the text, centered at the calculated position
        doc.text("Purchase", centerX, 10, { align: "center" });


        // Get the current date and time
        const currentDate = new Date();
        const dateString = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;

        // Set font size for the date
        doc.setFontSize(10);

        // Get page width and calculate the right corner position
        const textWidth = doc.getTextWidth(dateString);
        const xPosition = pageWidth - textWidth - 15; // 10 is for padding from the edge

        // Add the date string to the top-right corner
        doc.text(dateString, xPosition, 10, { align: "left" });


        // Prepare the data for the table
        const filteredRows = purchase.map((row, index) => [
            index + 1, 
            backendController.caps(row.category), 
            backendController.caps(row.jeweltype), 
            backendController.money(row.pcs,0,1), 
            backendController.money(row.weight,0,1), 
            backendController.money(row.pure,0,1), 
            backendController.money(row.cash,0,1), 
        ]);

        const columns = ["#", "Category", "Jewel", "Pieces", "Weight", "Pure", "Cash"];

        // Add the table to the PDF
        autoTable(doc, {
            head: [columns],
            body: filteredRows,
            startY: 15,
            headStyles: {
                halign: 'center',
                fontSize: 13,
                textColor: [255, 255, 255],
            },
            columnStyles: {
                3: { halign: 'right' }, // Pieces
                4: { halign: 'right' }, // Weight
                5: { halign: 'right' }, // Pure
                6: { halign: 'right' }, // Cash
            }
        });
        


        // Generate PDF as a buffer
        const pdfBuffer = doc.output("arraybuffer");

        // Set the headers to serve the PDF
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline; filename=output.pdf");
        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).send("Error generating PDF.");
    }
});

router.post("/select", async (req, res) => {
    const totalRecode = await backendController.selectQuery(
        `SELECT count(DISTINCT openingid) as total FROM stock_opening WHERE deleteon=? AND branch=?`,
        ['0000-00-00', userToken.site]
    );

    backendController.selectQuery(
        `SELECT * FROM stock_opening WHERE deleteon=? AND branch=? ORDER BY openingid DESC`,
        ['0000-00-00', userToken.site]
    )
    .then(results => {
        const groupedResults = groupByPurchaseId(results);
        const html = generateHTMLData(groupedResults,results);
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

function groupByPurchaseId(results) {
    const grouped = {};

    results.forEach(item => {
        if (!grouped[item.openingid]) {
            grouped[item.openingid] = {
                openingid: item.openingid,
                counter: item.counter,
                entrydate: item.date,
                items: []
            };
        }

        grouped[item.openingid].items.push({
            category: item.category,
            jeweltype: item.jeweltype,
            subtype: item.subtype,
            weight: item.weight,
            pcs: item.pcs,
        });
    });

    return Object.values(grouped);
}

function generateHTMLData(groupedResults,results) {
    let htmlContent = '';
    let sno = 0;
    let i = -1
    groupedResults.forEach(purchase => {
        sno++;
        const entryDate = backendController.rawDateFormat(purchase.entrydate, 'dmy');

        let category = '';
        let jewel = '';
        let sub = '';
        let totalWeight = '';
        let totalPcs = '';

        purchase.items.forEach(item => {
            sub += backendController.caps(item.subtype)+`<br>`;
            jewel += backendController.caps(item.jeweltype)+`<br>`;
            category += backendController.caps(item.category)+`<br>`;
            totalWeight += backendController.valNum(item.weight)+`<br>`;
            totalPcs += backendController.valNum(item.pcs)+`<br>`;
            i++;
        });

        const edit_and_delete = `<div class='flex-with-space-edit-delete'>
            <img src="/images/edit.png" width="25" height="25" class="edit-iconi" id="edit-user${purchase.openingid}" uniquekey="${purchase.openingid}" datas='${JSON.stringify(results[i])}'/>
            <img src="/images/delete.png" width="25" height="25" class="delete-iconi" id="delete-user${purchase.openingid}" uniquekey="${purchase.openingid}" datas='${JSON.stringify(results[i])}'/>
        </div>`;

        htmlContent += `
            <tr>
                <td>${sno}</td>
                <td>${backendController.caps(purchase.openingid)}</td>
                <td>${backendController.caps(purchase.counter)}</td>
                <td>${category}</td>
                <td>${jewel}</td>
                <td>${sub}</td>
                <td class="right-align">${totalWeight}</td>
                <td class="right-align">${totalPcs}</td>
                <td>${entryDate}</td>
                <td>${edit_and_delete}</td>
            </tr>`;
    });

    sno = 0;
    return htmlContent;
}

// POST route to handle form submission
router.post('/delete',async (req, res) => {
    const { uniquekey } = req.body;
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const deleteid = await backendController.deleted({ body : {'tableName' :'stock_opening', 'whereCondition': `openingid=?`,'values':[uniquekey]}});
          if (deleteid.success)
            res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});

router.get("/dealer", async (req, res) => {
    backendController.selectQuery(`SELECT dealername,code,primaryph FROM dealers where deleteon=? and branch=?`,['0000-00-00',userToken.site])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            let optionTag = null;
                optionTag = `<option value="${item['code']}">${item['dealername']}</option>`;
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

router.post("/balance", async (req, res) => {
    const {dealer} = req.body;
    try{
        const dealer_balance = await backendController.selectQuery(`select sum(cash) as cash,sum(weight) as weight from dealer_balance where deleteon=? and branch=? and dealercode=?`,['0000-00-00',userToken.site,dealer]);
        const opening = await backendController.selectQuery(
            `SELECT distinct dealercode,sum(weight) as weight,sum(cash) as cash FROM dealer_balance_opening where deleteon=? and branch=? and dealercode=? group by dealercode order by uniqueid desc`,
            ['0000-00-00', userToken.site, dealer]
        );
        const payment = await backendController.selectQuery(
            `SELECT distinct dealercode,sum(weight) as weight,sum(cash) as cash FROM dealer_payment where deleteon=? and branch=? and dealercode=? group by dealercode order by uniqueid desc`,
            ['0000-00-00', userToken.site, dealer]
        );
        let obwt = 0;
        let obCs = 0;
        let dealWt = 0;
        let dealCs = 0;
        const balWt = backendController.money(dealer_balance[0].weight,3,0);
        const balCs = backendController.money(dealer_balance[0].cash,3,0);
        if(opening[0])
        {
            obwt = backendController.money(opening[0].weight,3,0);
            obCs = backendController.money(opening[0].cash,3,0);
        }
        if(payment[0])
        {
            dealWt = backendController.money(payment[0].weight,3,0);
            dealCs = backendController.money(payment[0].cash,3,0);
        }
        const totalWeight = backendController.valNum(balWt) + backendController.valNum(obwt) - backendController.valNum(dealWt);
        const totalCash = backendController.valNum(balCs) + backendController.valNum(obCs) - backendController.valNum(dealCs);
        return res.json({success:true, pure: totalWeight || 0, cash: totalCash || 0 });
    }
    catch(e){
        console.error('Error in lod bal:', e.message);
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    }
});

router.post("/insert", async (req, res) => {
    const { dealer, lotid, counter, purchaseid, purchase_id, product, typeofjewel, subtype, pcs, totalweight, imgpath_photo, date } = req.body;  // For example, if allrowid = 3
    const metal = await backendController.selectQuery(`SELECT distinct product FROM product_category where deleteon=? and branch=? and category=? order by uniqueid desc`,['0000-00-00',userToken.site, product])
    // Initialize an object to store the dynamic values
    let purchasecode =  backendController.generateUniqueId();
    let purchaseids = await backendController.generateUniqueNumbers('stock_opening', 'openingid', 4, 'so');
    if(purchaseid)
    {
        purchasecode = purchase_id;
        purchaseids = [purchaseid];
    }
    if(dealer=="nd")
        return res.json({success:false, msg_type:"error", msg:"Must Select a Dealer..."});
    if(!purchaseids)
        return res.json({success:false, msg_type:"error", msg:"Contact Developer to Ask..."}); 
    if(purchase_id&&purchaseid)
    {
        try{
            await backendController.deleted({body:{tableName:"stock_opening",whereCondition:"openingcode=?", values:[purchase_id]}});
        }
        catch(error) 
        {
            console.error('Error in Insert:', error.message);
        }
    }
    try
    {
        const insert = await backendController.insert({body: {tableName:"stock_opening",data:{ openingcode: purchasecode, metal:metal[0].product, date, photoproof:imgpath_photo, openingid:purchaseids[0], counter, category:product, dealercode:dealer, jeweltype:typeofjewel, subtype, pcs, weight:totalweight }, column:"lotid"}});   
        if(insert.success)
            return res.json({success:true, msg_type:"success", msg:"Opening Stock Added Successfully..."});
        else
            return res.json({success:false, msg_type:"error", msg:"Opening is not Possible"});
    }
    catch(error) 
    {
        console.error('Error in Insert:', error);
    }    
});

router.get("/loadCate", async (req, res) => {
    backendController.selectQuery(`SELECT distinct product,category FROM product_category where deleteon=? and branch=?`,['0000-00-00',userToken.site])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['category']}">${item['category']}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.get("/counter", async (req, res) => {
    backendController.selectQuery(`SELECT distinct counter FROM counter where deleteon=? and branch=?`,['0000-00-00',userToken.site])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['counter']}">${item['counter']}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.get("/loadJewel", async (req, res) => {
    const category = req.headers.data;
    backendController.selectQuery(`SELECT distinct jeweltype,code FROM jewel_master_control where deleteon=? and branch=? and category=?`,['0000-00-00',userToken.site,category])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['code']}">${item['jeweltype']}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.get("/subType", async (req, res) => {
    const category = req.headers.data.split("[w~12]");
    backendController.selectQuery(`SELECT distinct subtype FROM jewel_master_control where deleteon=? and branch=? and category=? and code=?`,['0000-00-00',userToken.site,category[1],category[0]])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['subtype']}">${item['subtype']}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

module.exports = router;