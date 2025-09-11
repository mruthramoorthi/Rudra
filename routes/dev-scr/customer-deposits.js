const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const { body } = require("express-validator");
const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default;


const router = express.Router();

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

router.get("/modes", async (req, res) => {
    let options_arr = [];
    options_arr.push(`<option value="old">Old</option>`);
    options_arr.push(`<option value="coin">Coin</option>`);
    options_arr.push(`<option value="exchange">Exchange</option>`);
    options_arr.push(`<option value="pure">Pure</option>`);
    const html = options_arr.join('');
    res.json({ success: true, response: html });
 });

router.get("/customer", async (req, res) => {
    backendController.selectQuery(`SELECT distinct name,userid,primaryphonenumber FROM users where deleteon=? and branch=? and typeofpeople=?`,['0000-00-00',userToken.site,'customer'])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['userid']}[r~12]${item['name']}">${backendController.caps(item['name'])} - ${backendController.caps(item['primaryphonenumber'])}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
 });
 
router.post("/fetchDetails", async (req, res) => {
    const {customer} = req.body;
    const real_customer = customer.split("[r~12]");
    try{
            const customer_details = await backendController.selectQuery(`select * from users where deleteon=? and branch=? and userid=?`,['0000-00-00',userToken.site,real_customer[0]]);
            res.json({success:true, response: customer_details});
    } catch (error) {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg: "Server Error" });
    }
});

router.post("/select", async (req, res) => {
    const dealer_purchase = await backendController.selectQuery(`SELECT count(*) as total FROM customers_deposit where deleteon=? and branch=?`,['0000-00-00',userToken.site]);
    try{
        const purchase = await backendController.selectQuery(`SELECT * FROM customers_deposit where deleteon=? and branch=? order by uniqueid desc`,['0000-00-00',userToken.site])
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
function generateHTMLData(results) {
    let htmlContent = '';
    results.forEach(item => {
        sno ++;
        const entryDate = backendController.rawDateFormat(item.entrydate);
        // console.log(entryDate)
        let edit_and_delete = `<div class='flex-with-space-edit-delete'>
                <img src="/images/edit.png" width="25" height="25" class="edit-iconi" title="" id="edit-user${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>
                <img src="/images/print.png" width="25" height="25" class="print-iconi" title="" id="print-user${item.uniqueid}" deposit="${item.depositid}" datas='${JSON.stringify(item)}'/>
                <img src="/images/delete.png" class="delete-iconi" title="" width="25" height="25" id="delete-user${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>
              </div>`;
        htmlContent += `<tr><td>${sno}</td><td>${backendController.caps(item.depositid)}</td><td>${backendController.rawDateFormat(item.bonddate,'dmy')}</td><td>${backendController.rawDateFormat(item.maturity_date,'dmy')}</td><td>${backendController.caps(item.name)}<br>${backendController.caps(item.phone)}</td><td class='right-align'>${backendController.money(item.depositamount,0,1)}</td><td class='right-align'>${backendController.money(item.depositgram,3,1)}</td><td class='right-align'>${backendController.money(item.available_gram,3,1)}</td><td>${edit_and_delete}</td></tr>`;
    });
    sno = 0;
    return htmlContent;
}

 router.post('/insert',async (req, res) => {
    const { bonddate,maturitydate,amount,banks,transactiontype,bank,total_deposit_amount,total_deposit_weight,rate,oldpart,ph1,ph2,address,customername,customer } = req.body;
    let old_metal = "";
    let old_pcs = "";
    let old_weight = "";
    let old_waste = "";
    let old_price = "";
    let old_totalprice = "";
    let old_caratsize = "";
    let old_caratrate = "";
    let old_carat_totalprice = "";
    let old_pic = "";
    let totaloldprice = "";
    let pure_metal = "";
    let pure_weight = "";
    let pure_pcs = "";
    let pure_price = "";
    let pure_pic = "";
    let pure_totalprice = "";
    let coin_metal = "";
    let coin_pcs = "";
    let coin_weight = "";
    let coin_price = "";
    let coin_pic = "";
    let coin_totalprice = "";
    let ex_code = "";
    let ex_price = "";
    let ex_pic = "";
    let exchange_types = "";
    let ex = [];
    if(customer=="nd")
        return res.json({success:false, msg_type:"error", msg:"Customer Not Selected"}); 
    if(!customername)
        return res.json({success:false, msg_type:"error", msg:"Customer Name is Not Valid"}); 
    for (let i=1;i<=oldpart;i++) {
        const exchange_type = req.body[`exchange_${i}`];
        exchange_types += exchange_type+"[0~0]";
        if(exchange_type=="old")
        {
            if(!req.body[`oldweight_${i}`] && backendController.valNum(req.body[`oldweight_${i}`])<=0)
                return res.json({success:false, msg_type:"error", msg:"Old Weight"}); 
            if(!req.body[`oldwaste_${i}`] && backendController.valNum(req.body[`oldwaste_${i}`])<0)
                return res.json({success:false, msg_type:"error", msg:"Old Weight"}); 
            if(!req.body[`totaloldprice${i}`] && backendController.valNum( req.body[`totaloldprice${i}`])<=0)
                return res.json({success:false, msg_type:"error", msg:"Old Weight"}); 
            old_metal += req.body[`oldmetal_${i}`]+"[0~0]";
            old_pcs += req.body[`oldpcs_${i}`]+"[0~0]";
            old_weight += req.body[`oldweight_${i}`]+"[0~0]";
            old_waste += req.body[`oldwaste_${i}`]+"[0~0]";
            old_price += req.body[`oldprice_${i}`]+"[0~0]";
            old_totalprice += req.body[`oldtotalprice_${i}`]+"[0~0]";
            old_caratsize += req.body[`oldcaratsize_${i}`]+"[0~0]";
            old_caratrate += req.body[`oldcaratprice_${i}`]+"[0~0]";
            old_carat_totalprice += req.body[`oldcarattotalprice_${i}`]+"[0~0]";
            old_pic += req.body[`proof_${i}`]+"[0~0]";
            totaloldprice += req.body[`totaloldprice${i}`]+"[0~0]";
            // ex.push({old_metal:req.body[`oldmetal_${i}`] || '',old_pcs:req.body[`oldpcs_${i}`] || '',old_weight:req.body[`oldweight_${i}`] || '',old_waste:req.body[`oldwaste_${i}`] || '',old_price:req.body[`oldprice_${i}`] || '',old_totalprice:req.body[`oldtotalprice_${i}`] || '',old_caratsize:req.body[`oldcaratsize_${i}`] || '',old_caratrate:req.body[`oldcaratprice_${i}`] || '',old_carat_totalprice:req.body[`oldcarattotalprice_${i}`] || '',old_pic:req.body[`proof_${i}`] || '',totaloldprice:req.body[`totaloldprice${i}`]});
        }
        if(exchange_type=="pure")
        {
            if(!req.body[`pureweight_${i}`] && backendController.valNum(req.body[`pureweight_${i}`])<=0)
                return res.json({success:false, msg_type:"error", msg:"Pure Weight"}); 
            pure_metal += req.body[`puremetal_${i}`]+"[0~0]";
            pure_weight += req.body[`purepcs_${i}`]+"[0~0]";
            pure_pcs += req.body[`pureweight_${i}`]+"[0~0]";
            pure_price += req.body[`pureprice_${i}`]+"[0~0]";
            pure_pic += req.body[`proof_${i}`]+"[0~0]";
            pure_totalprice += req.body[`puretotalprice_${i}`]+"[0~0]";
            // ex.push({pure_metal: req.body[`puremetal_${i}`] || '',pure_weight: req.body[`purepcs_${i}`] || '',pure_pcs: req.body[`pureweight_${i}`] || '',pure_price: req.body[`pureprice_${i}`] || '',pure_pic: req.body[`proof_${i}`] || '',pure_totalprice: req.body[`puretotalprice_${i}`]});
        }
        if(exchange_type=="coin")
        {
            if(!req.body[`coinweight_${i}`] && backendController.valNum(req.body[`coinweight_${i}`])<=0)
                return res.json({success:false, msg_type:"error", msg:"Coin Weight"}); 
            coin_metal += req.body[`coinmetal_${i}`]+"[0~0]";
            coin_pcs += req.body[`coinpcs_${i}`]+"[0~0]";
            coin_weight += req.body[`coinweight_${i}`]+"[0~0]";
            coin_price += req.body[`coinprice_${i}`]+"[0~0]";
            coin_pic += req.body[`proof_${i}`]+"[0~0]";
            coin_totalprice	+= req.body[`cointotalprice_${i}`]+"[0~0]";
            // ex.push({coin_metal: req.body[`coinmetal_${i}`] || '',coin_pcs: req.body[`coinpcs_${i}`] || '',coin_weight: req.body[`coinweight_${i}`] || '',coin_price: req.body[`coinprice_${i}`] || '',coin_pic: req.body[`proof_${i}`] || '',coin_totalprice: req.body[`cointotalprice_${i}`]});
        }
        if(exchange_type=="exchange")
        {
            if(!req.body[`exchangeprice${i}`] && backendController.valNum(req.body[`exchangeprice${i}`])<=0)
                return res.json({success:false, msg_type:"error", msg:"Exchane Price"}); 
            ex_code += req.body[`excode_${i}`]+"[0~0]";
            ex_pic += req.body[`proof_${i}`]+"[0~0]";
            ex_price += req.body[`exchangeprice${i}`]+"[0~0]";
            // ex.push({ ex_code: req.body[`excode_${i}`] || '',ex_pic: req.body[`proof_${i}`] || '',ex_price: req.body[`exchangeprice${i}`]});
        }
    }
    old_metal = backendController.rtrim(old_metal,"[0~0]") ;
    old_pcs = backendController.rtrim(old_pcs,"[0~0]") ;
    old_weight = backendController.rtrim(old_weight,"[0~0]") ;
    old_waste = backendController.rtrim(old_waste,"[0~0]") ;
    old_price = backendController.rtrim(old_price,"[0~0]") ;
    old_totalprice = backendController.rtrim(old_totalprice,"[0~0]") ;
    old_caratsize = backendController.rtrim(old_caratsize,"[0~0]") ;
    old_caratrate = backendController.rtrim(old_caratrate,"[0~0]") ;
    old_carat_totalprice = backendController.rtrim(old_carat_totalprice,"[0~0]") ;
    old_pic = backendController.rtrim(old_pic,"[0~0]") ;
    totaloldprice = backendController.rtrim(totaloldprice,"[0~0]") ;
    pure_metal = backendController.rtrim(pure_metal,"[0~0]") ;
    pure_weight = backendController.rtrim(pure_weight,"[0~0]") ;
    pure_pcs = backendController.rtrim(pure_pcs,"[0~0]") ;
    pure_price = backendController.rtrim(pure_price,"[0~0]") ;
    pure_pic = backendController.rtrim(pure_pic,"[0~0]") ;
    pure_totalprice = backendController.rtrim(pure_totalprice,"[0~0]") ;
    coin_metal = backendController.rtrim(coin_metal,"[0~0]") ;
    coin_pcs = backendController.rtrim(coin_pcs,"[0~0]") ;
    coin_weight = backendController.rtrim(coin_weight,"[0~0]") ;
    coin_price = backendController.rtrim(coin_price,"[0~0]") ;
    coin_pic = backendController.rtrim(coin_pic,"[0~0]") ;
    coin_totalprice = backendController.rtrim(coin_totalprice,"[0~0]") ;
    ex_code = backendController.rtrim(ex_code,"[0~0]") ;
    ex_price = backendController.rtrim(ex_price,"[0~0]") ;
    ex_pic = backendController.rtrim(ex_pic,"[0~0]") ;
    exchange_types = backendController.rtrim(exchange_types,"[0~0]") ;
    const depositcode = backendController.generateUniqueId();
    const depositid = await backendController.generateUniqueNumbers('customers_deposit', 'depositid', 4, 'd');
    if(!depositid)
        return res.json({success:false, msg_type:"error", msg:"Contact Developer to Ask..."}); 
    const data = {bonddate,maturity_date:maturitydate,available_gram:total_deposit_weight,cash:amount,bank,bankname:banks,transactiontype,depositcode,depositid:depositid[0],name:customername,userid:customer.split("[r~12]")[0],phone:ph1,address,depositamount:total_deposit_amount,depositgram:total_deposit_weight,exchange_type:exchange_types}; // ,old_metal,old_pcs,old_weight,old_waste,old_price,old_totalprice,old_caratsize,old_caratrate,old_carat_totalprice,old_pic,totaloldprice,pure_metal,pure_weight,pure_pcs,pure_price,pure_pic,pure_totalprice,coin_metal,coin_pcs,coin_weight,coin_price,coin_pic,coin_totalprice,ex_code,ex_price,ex_pic
    try{
        // for(let i=0; i<ex.length; i++)
        // {
        // }
        await backendController.insert({body: {tableName: 'exchanges',data: {exdate:bonddate,category:"deposit",id:depositid[0],exchange_types,old_metal,old_pcs,old_weight,old_waste,old_price,old_totalprice,old_caratsize,old_caratrate,old_carat_totalprice,old_pic,totaloldprice,pure_metal,pure_weight,pure_pcs,pure_price,pure_pic,pure_totalprice,coin_metal,coin_pcs,coin_weight,coin_price,coin_pic,coin_totalprice,ex_code,ex_price,ex_pic}}});
        const insert = await backendController.insert({body: {tableName: 'customers_deposit',data: data}});
        if(insert.success)
            return res.json({success:true, msg_type:"success", msg:"Deposit Amount Added..."});
        else
            return res.json({success:false, msg_type:"error", msg:"Deposit Amount is Not Registered..."}); 
    }
    catch(e)
    {
        console.error('Error during insert operation:', e);
        res.json({success: false,msg: 'Error occurred while inserting data',msg_type: 'error',error: e.message || 'Unknown error'});
    }

 });

 // POST route to handle form submission
router.post('/delete',async (req, res) => {
    const { uniquekey } = req.body;
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const deleteid = await backendController.deleted({ body : {'tableName' :'customers_deposit', 'whereCondition': `uniqueid=?`,'values':[uniquekey]}});
          if (deleteid.success)
            res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});

 router.post("/pdf", async (req, res) => {
    const { id } = req.body;
    try {
        // Fetch data from the database
        const deposit = await backendController.selectQuery("select * from customers_deposit where deleteon=? and branch=? and depositid=?", ["0000-00-00", userToken.site, id]);

        // Create a new PDF document with A4 size
        const doc = new jsPDF({
            orientation: "landscape", // "portrait" or "landscape"
            unit: "mm",              // Measurement unit (mm)
            format: "a4",            // Set format to A4
        });

        // Add the heading "Shop Details"
        doc.setFontSize(16);
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;
        doc.text("Shop Details", centerX, 10, { align: "center" });
        doc.text("Test Company", centerX, 20, { align: "center" });

        // Add Customer Name - Assuming the customer name is available in `deposit`
        const customerName = backendController.caps(deposit[0].name) || "Unknown Customer"; // Adjust the field as per your data structure
        doc.setFontSize(12);
        doc.text(`Customer: ${customerName}`, 25, 30);

        // Add the date and time to the top-right corner
        const currentDate = new Date();
        const dateString = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;
        doc.setFontSize(10);
        const textWidth = doc.getTextWidth(dateString);
        const xPosition = pageWidth - textWidth - 15;
        doc.text(dateString, xPosition, 10, { align: "left" });

        // Paragraph with deposit bond and details
        doc.setFontSize(12);
        // doc.text("Professional Manner Deposit Bond", 15, 30);
        doc.setFontSize(10);
        const paragraph1 = `
            The bond is registered under the name of ${customerName}. The total deposit amount is ${backendController.money(deposit[0].depositamount, 3, 1)}, which is valuable for a weight of ${backendController.money(deposit[0].depositgram, 3, 1)} grams.
            The registered date is ${deposit[0].bonddate ? new Date(deposit[0].bonddate).toLocaleDateString() : "Not Available"} and the delivery date is ${deposit[0].maturity_date ? new Date(deposit[0].maturity_date).toLocaleDateString() : "Not Available"}.
        `;
        doc.text(paragraph1, 15, 40, { maxWidth: pageWidth - 30 });

        // Prepare the table data
        const filteredRows = deposit.map((row, index) => [
            index + 1,
            
            backendController.caps(row.depositid),
            backendController.money(row.depositamount, 3, 1),
            backendController.money(row.depositgram, 3, 1),
        ]);
        const columns = ["#", "Deposit ID", "Amount", "Weight"];

        // Add the table to the PDF
        autoTable(doc, {
            head: [columns],
            body: filteredRows,
            startY: 60,
            headStyles: {
                halign: 'center',
                fontSize: 13,
                textColor: [255, 255, 255],
            },
            columnStyles: {
                1: { halign: 'right' }, // Pieces
                2: { halign: 'right' }, // Weight
                3: { halign: 'right' }, // Pure
            }
        });

        // Footer with terms and conditions
        doc.setFontSize(10);
        const footerText = `
            Terms and Conditions:
            1. The deposit bond is subject to the conditions agreed upon at the time of registration.
            2. Any delays in the delivery date will incur a penalty as per the agreement.
            3. The customer acknowledges all the terms mentioned in this document.
        `;
        const footerYPosition = doc.internal.pageSize.height - 40; // Set footer near the bottom of the page
        doc.text(footerText, 15, footerYPosition, { maxWidth: pageWidth - 30 });

        // Generate PDF as a buffer
        const pdfBuffer = doc.output("arraybuffer");

        // Set the headers to serve the PDF
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline; filename=deposit_bond.pdf");
        res.send(Buffer.from(pdfBuffer));

    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).send("Error generating PDF.");
    }
});


module.exports = router;