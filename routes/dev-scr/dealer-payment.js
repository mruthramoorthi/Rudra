const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const { body } = require("express-validator");
const router = express.Router();
const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default;

router.post("/select", async (req, res) => {
    try
    {
        const results = await backendController.selectQuery(`SELECT purchaseid,dealercode,weight,cash,metal,uniqueid FROM dealer_balance where deleteon=? and branch=? and purchasecode=? order by uniqueid desc`,['0000-00-00',userToken.site,"ratecut"]);
        const totalRows = await backendController.selectQuery(`SELECT count(*) as total FROM dealer_balance where deleteon=? and branch=? and purchasecode=?`,['0000-00-00',userToken.site,"ratecut"]);
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
        for (let i = 0; i < results.length; i++) {
            let item = results[i];
            let edit_and_delete = `<div class='flex-with-space-edit-delete'>`;
            if (!userToken.rights_result || userToken.rights_result.delete_rights === 0) {
                edit_and_delete += `<img src="/images/delete.png" class="delete-icon" width="25" height="25" id="delete-user${item.uniqueid}" uniquekey="${item.purchaseid}" datas='${JSON.stringify(item)}'/>`;
            }
            edit_and_delete += `</div>`;
            sno++;
            htmlContent += `<tr><td>${sno}</td><td>${backendController.caps(item.purchaseid)}</td><td>${backendController.caps(item.dealercode)}</td><td>${backendController.caps(item.metal)}</td><td>${backendController.money(item.weight,3,1)} .G </td><td>${backendController.money(item.cash,3,1)}</td><td>${edit_and_delete}</td></tr>`;
        }        
        sno = 0;
        if (!htmlContent)
            htmlContent = "There is No Data to Load";
        return htmlContent;
    } catch (error) {
        console.error('Error in generateHTMLData:', error);  // Handle rejection properly here
        throw error;  // Re-throw error for higher-level handling
    }
}

router.post("/select2", async (req, res) => {
    try
    {
        const results = await backendController.selectQuery(`SELECT * FROM dealer_balance where deleteon=? and branch=? order by uniqueid desc`,['0000-00-00',userToken.site]);
        const totalRows = await backendController.selectQuery(`SELECT count(*) as total FROM dealer_balance where deleteon=? and branch=?`,['0000-00-00',userToken.site]);
        const htmls = await generateHTMLData2(results);
        res.json({ success: true, response: htmls, total: totalRows[0].total, msg: "ok" });

    }catch(error) {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg: "Server Error" });
    };
});

let sno2 = 0;
async function generateHTMLData2(results) {
    let htmlContent = '';
    try {
        for (let i = 0; i < results.length; i++) {
            let item = results[i];
            let edit_and_delete = `<div class='flex-with-space-edit-delete'>`;
            if (!userToken.rights_result || userToken.rights_result.delete_rights === 0) {
                edit_and_delete += `<img src="/images/delete.png" class="delete-iconi" width="25" height="25" id="delete-user${item.uniqueid}" uniquekey="${item.receiptid}" type= tag="${item.tag}" datas='${JSON.stringify(item)}'/>`;
            }
            edit_and_delete += `</div>`;
            sno2++;
            htmlContent += `<tr><td>${sno2}</td><td>${backendController.caps(item.receiptid)}</td><td>${backendController.caps(item.dealercode)}</td><td>${backendController.caps(item.metal)}</td><td>${backendController.money(item.weight,3,1)} .G</td><td>${backendController.money(item.cash,3,1)}</td><td>${edit_and_delete}</td></tr>`;
        }        
        sno2 = 0;
        if (!htmlContent)
            htmlContent = "There is No Data to Load";
        return htmlContent;
    } catch (error) {
        console.error('Error in generateHTMLData:', error);  // Handle rejection properly here
        throw error;  // Re-throw error for higher-level handling
    }
}

// Route to generate and serve PDF
router.post("/pdf", async (req, res) => {
    const { id } = req.body;
    try {
        // Fetch data from the database
        const purchase = await backendController.selectQuery("select * from dealer_purchase where deleteon=? and branch=? and purchaseid=?", ["0000-00-00",userToken.site,id]);
        
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
        autoTable(doc , {
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

// POST route to handle form submission
router.post('/delete',async (req, res) => {
    const { uniquekey } = req.body;
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const deleteid1 = await backendController.deleted({ body : {'tableName' :'dealer_balance', 'whereCondition': `purchaseid=?`,'values':[uniquekey]}});
          if (deleteid1.success)
            res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});

// POST route to handle form submission
router.post('/delete2',async (req, res) => {
    const { uniquekey } = req.body;
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const deleteid1 = await backendController.deleted({ body : {'tableName' :'dealer_balance', 'whereCondition': `receiptid=?`,'values':[uniquekey]}});
          const deleteid2 = await backendController.accountsDelete("dealer payment" , uniquekey);
          if (deleteid1.success)
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

router.get("/rates", async (req, res) => {
    const metal = req.headers.data;
    backendController.selectQuery(`SELECT category,price FROM rate_master where deleteon=? and branch=? and metal=?`,['0000-00-00',userToken.site,metal])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            let optionTag = null;
                optionTag = `<option value="${item['price']}">${item['category']} - ${item['price']}</option>`;
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
    const {dealer, metal} = req.body;
    try{
        const dealer_balance = await backendController.selectQuery(`select sum(cash) as cash,sum(weight) as weight from dealer_balance where deleteon=? and branch=? and dealercode=? and metal=?`,['0000-00-00',userToken.site,dealer,metal]);
        const opening = await backendController.selectQuery(
            `SELECT distinct dealercode,sum(weight) as weight,sum(cash) as cash FROM dealer_balance_opening where deleteon=? and branch=? and dealercode=? and metal=? group by dealercode order by uniqueid desc`,
            ['0000-00-00', userToken.site, dealer, metal]
        );
        const payment = await backendController.selectQuery(
            `SELECT distinct dealercode,sum(weight) as weight,sum(cash) as cash FROM dealer_balance where deleteon=? and branch=? and dealercode=? and metal=? group by dealercode order by uniqueid desc`,
            ['0000-00-00', userToken.site, dealer, metal]
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

router.post("/ratecut", async (req, res) => {
    const { dealer,gramorcash,weightcut,puritycut,purerate,Pure_balance_cut,realweight,realcash,Cash_balance_cut } = req.body;
    try{
        const purchaseids = await backendController.generateUniqueNumbers('dealer_purchase', 'purchaseid', 4, 'p');
        const insert = await backendController.insert({body: { tableName: "dealer_balance", data: {purchasecode:"ratecut", dealercode: dealer, purchaseid:purchaseids[0], weight:-realweight, purity:puritycut, rate: purerate, cash: -realcash}}});
        if(insert.success)
            return res.json({success:true, msg_type:"success", msg:"Jewel Add to Inventry Successfully..."});
        else
            return res.json({success:false, msg_type:"error", msg:"Rate Cut Not Valid"});
    }
    catch(e)
    {
        return res.json({success:false, msg_type:"error", msg:"Rate Cut Not Valid try again"});
    }
});

router.post("/paynow", async (req, res) => {
    const { dealer, paymentin, weightpay, puritypay, ratepay, pureratepay, totalcashpay, bank, transactiontype, cashs, banks, realweightpay, realcashpay, metal } = req.body;
    try{
        if(metal=="nd")
        {
            return res.json({msg:"Please Select Metal", msg_type : 'error', success: false });
        }
        if(dealer=="nd")
        {
            return res.json({msg:"Please Select Dealer", msg_type : 'error', success: false });
        }
        const receiptids = await backendController.generateUniqueNumbers('dealer_balance', 'receiptid', 4, 'r');
        const date = backendController.getCurrentDate();
        const insert = await backendController.insert({body: {tableName:"dealer_balance", data: {metal, receiptid: receiptids[0], dealercode: dealer, weight: -weightpay, purity: puritypay, rate: ratepay, cash: -cashs, bank: -banks, bankname: bank, transactiontype: transactiontype, date}}});
        if(paymentin=="cash")
        {
            const dealers_ph = await backendController.selectQuery(`SELECT primaryph FROM dealers where deleteon=? and branch=? and code=? order by uniqueid desc`,['0000-00-00',userToken.site,dealer]);
            let check_account = await backendController.selectQuery(`select id from entities where deleteon=? and branch=? and userid=? and account_id=? and (ph1=? or ph2=?)`,['0000-00-00',userToken.site,dealer,"8",dealers_ph[0].primaryph,dealers_ph[0].primaryph]);
            if(!check_account[0])
            {
                check_account = await backendController.newAccount("8",dealers_ph[0].primaryph);
            }
        if(banks>0)
                await backendController.cdAccounts("11", "8", "payment", date, check_account[0].id, banks, bank, "dealer payment", receiptids[0], suspense = 0, receiptids[0], "purchase from suplier",dealer, "bank", 0, banks, bank, transactiontype);
            if(cashs>0)
                await backendController.cdAccounts("1", "8", "payment", date, check_account[0].id, cashs, "cash", "dealer payment", receiptids[0], suspense = 0, receiptids[0], "purchase from suplier",dealer, "cash", cashs, 0, "nd", "nd");
        }
        if(insert.success)
            return res.json({success:true, msg_type:"success", msg:"Payment Made Successfully..."});
        else
            return res.json({success:false, msg_type:"error", msg:"payment Not Valid"});
    }
    catch(e){
        return res.json({success:false, msg_type:"error", msg:"Payment Not Valid try again : "+e});
    }
});

router.get("/paymentIn", async (req, res) => {
    let options_arr = [];
    options_arr.push(`<option value="pure">Pure</option>`);
    options_arr.push(`<option value="old">Old</option>`);
    options_arr.push(`<option value="cash">Cash</option>`);
    const html = options_arr.join('');
    res.json({ success: true, response: html });
});

router.get("/paymentType", async (req, res) => {
    let options_arr = [];
    options_arr.push(`<option value="0">Spot Payment</option>`);
    const html = options_arr.join('');
    res.json({ success: true, response: html });
});

router.get("/bank", async (req, res) => {
    backendController.selectQuery(`SELECT distinct displayname FROM banks where deleteon=? and branch=?`,['0000-00-00',userToken.site])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['displayname']}">${item['displayname']}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.get("/transactionType", async (req, res) => {
    backendController.selectQuery(`SELECT distinct types FROM transaction_types where deleteon=?`,['0000-00-00'])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['types']}">${item['types']}</option>`);
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