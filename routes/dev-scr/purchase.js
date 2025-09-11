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
        `SELECT count(DISTINCT purchaseid) as total FROM dealer_purchase WHERE deleteon=? AND branch=?`,
        ['0000-00-00', userToken.site]
    );

    backendController.selectQuery(
        `SELECT * FROM dealer_purchase WHERE deleteon=? AND branch=? ORDER BY purchaseid DESC`,
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
        if (!grouped[item.purchaseid]) {
            grouped[item.purchaseid] = {
                purchaseid: item.purchaseid,
                counter: item.counter,
                dealer: item.dealercode,
                entrydate: item.date,
                items: []
            };
        }

        grouped[item.purchaseid].items.push({
            category: item.category,
            jeweltype: item.jeweltype,
            subtype: item.subtype,
            weight: item.weight,
            pcs: item.pcs,
            waste: item.waste,
            mc: item.mc,
            mc_status: item.mc_status
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
        let mc_sts = '';
        let totalWeight = '';
        let totalPcs = '';
        let totalWaste = '';
        let totalMc = '';

        purchase.items.forEach(item => {
            mc_sts += backendController.caps(item.mc_status)+`<br>`;
            sub += backendController.caps(item.subtype)+`<br>`;
            jewel += backendController.caps(item.jeweltype)+`<br>`;
            category += backendController.caps(item.category)+`<br>`;
            totalWeight += backendController.valNum(item.weight)+`<br>`;
            totalPcs += backendController.valNum(item.pcs)+`<br>`;
            totalWaste += backendController.valNum(item.waste)+`<br>`;
            totalMc += backendController.valNum(item.mc)+`<br>`;
            i++;
        });

        const edit_and_delete = `<div class='flex-with-space-edit-delete'>
            <img src="/images/print.png" width="25" height="25" class="print-iconi" id="print-user${purchase.purchaseid}" purchase="${purchase.purchaseid}" datas='${JSON.stringify(results[i])}'/>
            <img src="/images/edit.png" width="25" height="25" class="edit-iconi" id="edit-user${purchase.purchaseid}" uniquekey="${purchase.purchaseid}" datas='${JSON.stringify(results[i])}'/>
            <img src="/images/delete.png" width="25" height="25" class="delete-iconi" id="delete-user${purchase.purchaseid}" uniquekey="${purchase.purchaseid}" datas='${JSON.stringify(results[i])}'/>
        </div>`;

        htmlContent += `
            <tr>
                <td>${sno}</td>
                <td>${backendController.caps(purchase.purchaseid)}</td>
                <td>${backendController.caps(purchase.dealer)}</td>
                <td>${backendController.caps(purchase.counter)}</td>
                <td>${category}</td>
                <td>${jewel}</td>
                <td>${sub}</td>
                <td class="right-align">${totalPcs}</td>
                <td class="right-align">${totalWeight}</td>
                <td class="right-align">${totalWaste}</td>
                <td class="right-align">${totalMc}</td>
                <td>${mc_sts}</td>
                <td>${entryDate}</td>
                <td>${edit_and_delete}</td>
            </tr>`;
    });

    sno = 0;
    return htmlContent;
}

// POST route to handle form submission
router.post('/delete',async (req, res) => {
    const { uniquekey, purchase } = req.body;
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const deleteid = await backendController.deleted({ body : {'tableName' :'dealer_purchase', 'whereCondition': `purchaseid=?`,'values':[purchase]}});
          const deleteid1 = await backendController.deleted({ body : {'tableName' :'dealer_balance', 'whereCondition': `purchaseid=?`,'values':[purchase]}});
          const deleteid3 = await backendController.deleted({ body : {'tableName' :'dealer_balance', 'whereCondition': `receiptid=?`,'values':[purchase]}});
          const deleteid2 = await backendController.accountsDelete("purchase" , purchase);
          if (deleteid.success)
            res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});

router.post('/edit',async (req, res) => {
    const { purchasecode } = req.body;
    try{
        const purchases = await backendController.selectQuery(`SELECT * FROM dealer_purchase WHERE deleteon=? AND branch=? and purchasecode=? ORDER BY purchaseid DESC`,['0000-00-00', userToken.site, purchasecode]);
        let allIds = [];
        let htmlContent = "";
        for(let i=0;i<purchases.length;i++)
        {
            let rowId = backendController.generateUniqueId();
            allIds.push(rowId);
            htmlContent += `<tr id='tr${rowId}'>
                    <td>${parseInt(i + 1)}</td>
                    <td>${backendController.caps(purchases[i].counter)}</td>
                    <td>${backendController.caps(purchases[i].category)}</td>
                    <td>${backendController.caps(purchases[i].jeweltype)}</td>
                    <td>${backendController.caps(purchases[i].subtype)}</td>
                    <td>${purchases[i].pcs}</td>
                    <td>${purchases[i].weight}</td>
                    <td>${purchases[i].purity}</td>
                    <td>${purchases[i].waste}</td>
                    <td>${"("+purchases[i].mc_status+") "+purchases[i].mc}</td>
                    <td>${purchases[i].stoneweight}</td>
                    <td>${purchases[i].stoneprice}</td>
                    <td>${purchases[i].noofstones}</td>
                    <td>${purchases[i].caratsize}</td>
                    <td>${purchases[i].caratprice}</td>
                    <td>${purchases[i].certificatecharge}</td>
                    <td>${purchases[i].labourcharge}</td>
                    <td>${purchases[i].extracharge}</td>
                    <td>${purchases[i].hallmarkcharge}</td>
                    <td>${purchases[i].gst}</td>
                    <td>${purchases[i].gstprice}</td>
                    <td>${purchases[i].pure}<input type='hidden' class='pures' id='pures-${rowId}' name='pures-${rowId}' value='${purchases[i].pure}'></td>
                    <td>${purchases[i].cash}<input type='hidden' class='cashs' id='pures-${rowId}' name='pures-${rowId}' value='${purchases[i].cash}'></td>
                    <td><div class='flex-with-space-edit-delete'>
                        <img src="/images/edit.png" width="25" height="25" class="edit-icon" title="Edit" id="edit-user${rowId}" data-id="${rowId}"/>
                        <img src="/images/delete.png" class="delete-icon" title="Delete" width="25" height="25" id="delete-user${rowId}" data-id="${rowId}"/>
                        </div>
                    </td><div id="${rowId}" style="display:none;">
                <input type="hidden" id="counter-${rowId}" name="counter-${rowId}" value="${purchases[i].counter}">
                <input type="hidden" id="product-${rowId}" name="product-${rowId}" value="${purchases[i].category}">
                <input type="hidden" id="typeofjewel-${rowId}" name="typeofjewel-${rowId}" value="${purchases[i].jeweltype}[s~1]${purchases[i].jewelcode}">
                <input type="hidden" id="jewelcode-${rowId}" name="jewelcode-${rowId}" value="${purchases[i].jewelcode}">
                <input type="hidden" id="subtype-${rowId}" name="subtype-${rowId}" value="${purchases[i].subtype}">
                <input type="hidden" id="pcs-${rowId}" name="pcs-${rowId}" value="${purchases[i].pcs}">
                <input type="hidden" id="totalweight-${rowId}" name="totalweight-${rowId}" value="${purchases[i].weight}">
                <input type="hidden" id="purity-${rowId}" name="purity-${rowId}" value="${purchases[i].purity}">
                <input type="hidden" id="waste-${rowId}" name="waste-${rowId}" value="${purchases[i].waste}">
                <input type="hidden" id="mc-${rowId}" name="mc-${rowId}" value="${purchases[i].mc}">
                <input type="hidden" id="mc_status-${rowId}" name="mc_status-${rowId}" value="${purchases[i].mc_status}">
                <input type="hidden" id="totalstoneweight-${rowId}" name="totalstoneweight-${rowId}" value="${purchases[i].stoneweight}">
                <input type="hidden" id="totalstoneprice-${rowId}" name="totalstoneprice-${rowId}" value="${purchases[i].stoneprice}">
                <input type="hidden" id="noofstones-${rowId}" name="noofstones-${rowId}" value="${purchases[i].noofstones}">
                <input type="hidden" id="caratsize-${rowId}" name="caratsize-${rowId}" value="${purchases[i].caratsize}">
                <input type="hidden" id="caratprice-${rowId}" name="caratprice-${rowId}" value="${purchases[i].caratprice}">
                <input type="hidden" id="certificate-${rowId}" name="certificate-${rowId}" value="${purchases[i].certificatecharge}">
                <input type="hidden" id="labour-${rowId}" name="labour-${rowId}" value="${purchases[i].labourcharge}">
                <input type="hidden" id="extra-${rowId}" name="extra-${rowId}" value="${purchases[i].extracharge}">
                <input type="hidden" id="hallmark-${rowId}" name="hallmark-${rowId}" value="${purchases[i].hallmarkcharge}">
                <input type="hidden" id="gst-${rowId}" name="gst-${rowId}" value="${purchases[i].gst}">
                <input type="hidden" id="gstprice-${rowId}" name="gstprice-${rowId}" value="${purchases[i].gstprice}">
                <input type="hidden" id="Pure_purchase-${rowId}" name="Pure_purchase-${rowId}" value="${purchases[i].pure}">
                <input type="hidden" id="Cash_purchase-${rowId}" name="Cash_purchase-${rowId}" value="${purchases[i].cash}">
                <input type="hidden" id="imgpath_photo-${rowId}" name="imgpath_photo-${rowId}" value="${purchases[i].photoproof}"></div></tr>`;
        }
        res.json({html: htmlContent, allid : allIds.join(","), success: true});
    }
    catch (error) {
        console.error('Error in deleting:', error.message);
    }
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

router.get("/rates", async (req, res) => {
    backendController.selectQuery(`SELECT category,price FROM rate_master where deleteon=? and branch=?`,['0000-00-00',userToken.site])
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
    const {dealer, metals} = req.body;
    try{
        const dealer_balance = await backendController.selectQuery(`select sum(cash) as cash,sum(weight) as weight from dealer_balance where deleteon=? and branch=? and dealercode=? and metal=?`,['0000-00-00',userToken.site,dealer, metals]);
        const opening = await backendController.selectQuery(
            `SELECT distinct dealercode,sum(weight) as weight,sum(cash) as cash FROM dealer_balance_opening where deleteon=? and branch=? and dealercode=? group by dealercode order by uniqueid desc`,
            ['0000-00-00', userToken.site, dealer, metals]
        );
        const payment = await backendController.selectQuery(
            `SELECT distinct dealercode,sum(weight) as weight,sum(cash) as cash FROM dealer_payment where deleteon=? and branch=? and dealercode=? group by dealercode order by uniqueid desc`,
            ['0000-00-00', userToken.site, dealer, metals]
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
    const {allrowid, dealer, buy, payment, lotid, purchaseid, total_Pure_purchase, purchase_id, total_Cash_purchase, purerate, imgpath_proof, bank, banks, transactiontype, entry_date, metals} = req.body;  // For example, if allrowid = 3
    const dealers_ph = await backendController.selectQuery(`SELECT primaryph FROM dealers where deleteon=? and branch=? and code=? order by uniqueid desc`,['0000-00-00',userToken.site,dealer]);
    // Initialize an object to store the dynamic values
    const purchasecode =  backendController.generateUniqueId();
    if(dealer=="nd")
        return res.json({success:false, msg_type:"error", msg:"Must Select a Dealer..."});
    if(metals=="nd")
        return res.json({success:false, msg_type:"error", msg:"Must Select a Metal..."});
    const allrowids = allrowid.split(",");
    if(!allrowids)
        return res.json({success:false, msg_type:"error", msg:"Please Add Inventry..."}); 
    const purchaseids = await backendController.generateUniqueNumbers('dealer_purchase', 'purchaseid', 4, 'p');
    if(!purchaseids)
        return res.json({success:false, msg_type:"error", msg:"Contact Developer to Ask..."}); 
    if(purchase_id&&purchaseid)
    {
        try{
            await backendController.deleted({body:{tableName:"dealer_purchase",whereCondition:"purchasecode=?", values:[purchaseid]}});
            await backendController.deleted({ body : {'tableName' :'dealer_balance', 'whereCondition': `purchaseid=?`,'values':[purchase_id]}});
            await backendController.deleted({ body : {'tableName' :'dealer_balance', 'whereCondition': `receiptid=?`,'values':[purchase_id]}});
            await backendController.accountsDelete("purchase" , purchase_id);
        }
        catch(error) 
        {
            console.error('Error in Insert:', error.message);
        }
    }
    try{
        let sno=0;
        // Loop through field names to dynamically access and store values from req.body
        for (let rowid of allrowids) {
            sno++;
            // Construct the key dynamically based on rowid (e.g., product1, product2, etc.)
            const counter =req.body[`counter-${rowid}`];
            const product =req.body[`product-${rowid}`];
            const typeofjewel =req.body[`typeofjewel-${rowid}`];
            const jewelcode = typeofjewel.split("[s~1]")[0];
            const jeweltype = typeofjewel.split("[s~1]")[1];
            const subtype =req.body[`subtype-${rowid}`];
            const pcs =req.body[`pcs-${rowid}`];
            const totalweight =req.body[`totalweight-${rowid}`];
            const purity =req.body[`purity-${rowid}`];
            const waste =req.body[`waste-${rowid}`];
            const mc =req.body[`mc-${rowid}`];
            const mc_status =req.body[`mc_status-${rowid}`];
            const totalstoneweight =req.body[`totalstoneweight-${rowid}`];
            const totalstoneprice =req.body[`totalstoneprice-${rowid}`];
            const noofstones =req.body[`noofstones-${rowid}`];
            const caratsize =req.body[`caratsize-${rowid}`];
            const caratprice =req.body[`caratprice-${rowid}`];
            const certificate =req.body[`certificate-${rowid}`];
            const labour =req.body[`labour-${rowid}`];
            const extra =req.body[`extra-${rowid}`];
            const hallmark =req.body[`hallmark-${rowid}`];
            const gst =req.body[`gst-${rowid}`];
            const Pure_purchase =req.body[`Pure_purchase-${rowid}`];
            const Cash_purchase =req.body[`Cash_purchase-${rowid}`];
            const gstprice =req.body[`gstprice-${rowid}`];
            const jewel_pic =req.body[`imgpath_photo-${rowid}`];
            if(purchaseid&&purchase_id)
            {
                await backendController.insert({body: {tableName:"dealer_purchase",data:{metal:metals,bank,bankname:banks,transactiontype,date:entry_date,billproof:imgpath_proof,photoproof:jewel_pic,gstprice,purchaseid:purchase_id, rate:purerate, total_cash: total_Cash_purchase, total_pure: total_Pure_purchase, lotcode: lotid,counter,buy,payment,purchasecode:purchaseid, category:product, dealercode:dealer, jeweltype, jewelcode, subtype, pcs, weight:totalweight, purity, waste, mc_status, mc, stoneweight:totalstoneweight, stoneprice:totalstoneprice, noofstones, caratsize, caratprice, certificatecharge:certificate, labourcharge:labour, extracharge:extra, hallmarkcharge:hallmark, gst, pure:Pure_purchase, cash:Cash_purchase}}});
            }
            else
            {
                await backendController.insert({body: {tableName:"dealer_purchase",data:{metal:metals,bank,bankname:banks,transactiontype,date:entry_date,billproof:imgpath_proof,photoproof:jewel_pic,gstprice,purchaseid:purchaseids[0], rate:purerate, total_cash: total_Cash_purchase, total_pure: total_Pure_purchase, counter,buy,payment,purchasecode, category:product, dealercode:dealer, jeweltype, jewelcode, subtype, pcs, weight:totalweight, purity, waste, mc_status, mc, stoneweight:totalstoneweight, stoneprice:totalstoneprice, noofstones, caratsize, caratprice, certificatecharge:certificate, labourcharge:labour, extracharge:extra, hallmarkcharge:hallmark, gst, pure:Pure_purchase, cash:Cash_purchase}, column:"lotcode"}});
            }
        }
        let check_account = await backendController.selectQuery(`select * from entities where deleteon=? and branch=? and userid=? and account_id=? and (ph1=? or ph2=?)`,['0000-00-00',userToken.site,dealer,"8",dealers_ph[0].primaryph,dealers_ph[0].primaryph]);
        if(!check_account[0])
        {
            check_account = await backendController.newAccount("8",dealers_ph[0].primaryph);
        }
        const balance = await backendController.insert({body: {tableName:"dealer_balance",data:{metal:metals,date:entry_date,purchasecode,purchaseid:purchaseids[0],dealercode:dealer,weight:total_Pure_purchase,cash:total_Cash_purchase,rate:purerate,photoproof:imgpath_proof}}});
        if(buy==0)
        {
            const cash = total_Cash_purchase - bank;
            await backendController.insert({body: {tableName:"dealer_balance",data:{metal:metals,date:entry_date,receiptid:purchaseids[0],purchasecode,dealercode:dealer,weight:-total_Pure_purchase,cash:-total_Cash_purchase,bank: -bank, bankname: banks, transactiontype,rate:purerate}}});
            if(bank && bank>0)
            {
                await backendController.cdAccounts("11", "8", "payment", entry_date, check_account[0].id, bank, banks, "purchase", purchaseids[0], suspense = 0, purchaseids[0], "purchase from suplier",dealer, "bank", 0, bank, banks, transactiontype);
            }
            if(cash && cash>0)
            {
                await backendController.cdAccounts("1", "8", "payment", entry_date, check_account[0].id, cash, "cash", "purchase", purchaseids[0], suspense = 0, purchaseids[0], "purchase from suplier",dealer, "bank", cash, 0);
            }
        }
        return res.json({success:true, msg_type:"success", msg:"Jewel Add to Inventry Successfully..."});
    }
    catch(error) 
    {
        console.error('Error in Insert:', error);
    }    
});

router.get("/loadCate", async (req, res) => {
    const product = req.headers.data;
    backendController.selectQuery(`SELECT distinct product,category FROM product_category where deleteon=? and branch=? and product=?`,['0000-00-00',userToken.site, product])
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
            options_arr.push(`<option value="${item['code']}[s~1]${item['jeweltype']}">${item['jeweltype']}</option>`);
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
    const jewelcode = category[0].split("[s~1");
    backendController.selectQuery(`SELECT distinct subtype FROM jewel_master_control where deleteon=? and branch=? and category=? and code=?`,['0000-00-00',userToken.site,category[1],jewelcode[0]])
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

router.get("/buyType", async (req, res) => {
    let options_arr = [];
    options_arr.push(`<option value="0">Buy With cash</option>`);
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