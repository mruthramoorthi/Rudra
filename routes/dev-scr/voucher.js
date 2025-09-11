const express = require("express");
const backendController = require('../../controllers/backend-functions');
const router = express.Router();
const axios = require('axios');
const { jsPDF } = require("jspdf");
require("jspdf-autotable");

// Helper function to fetch images
async function fetchImage(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        console.error("Error loading image:", error);
        return null;
    }
}
router.post("/pdf", async (req, res) => {
    const { id } = req.body;
    try {
        // 1. Voucher Data
        const voucher_to = await backendController.selectQuery(`select * from voucher where deleteon=? and branch=? and voucherno=?`,['0000-00-00',userToken.site,id]);
        const entities = await backendController.selectQuery(`select * from entities where deleteon=? and branch=? and id=?`,['0000-00-00',userToken.site,voucher_to[0].account]);
        const voucher = {
            voucher_no: voucher_to[0].voucherno,
            date: backendController.rawDateFormat(voucher_to[0].transactiondate,'dmy'),
            type: voucher_to[0].wayoftransaction,
            amount: voucher_to[0].amount,
            payment_mode: voucher_to[0].type,
            party_name: entities[0].name,
            party_address: entities[0].address,
            party_phone: entities[0].ph1,
            narration: voucher_to[0].description,
            photo_url: voucher_to[0].proof,
            state: entities[0].state,
            district: entities[0].district,
            pin: entities[0].pin,
        };

        // 2. Create A5 size PDF (half of A4)
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: [148, 210] // A5 size (width 148mm, height 210mm)
        });

        // 3. Design Constants
        const PAGE_WIDTH = 148;
        const MARGIN = 10;
        const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
        const PHOTO_SIZE = 25; // Reduced for A5 size

        // 4. Perfectly Centered Company Header
        const companyName = "SHREE JEWELLERS";
        const companyDetails = "123 Main Road, Coimbatore | GSTIN: 33AAACS1234D1Z2";
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14); // Slightly smaller for A5
        doc.text(companyName, PAGE_WIDTH / 2, 15, { align: "center" });
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text(companyDetails, PAGE_WIDTH / 2, 20, { align: "center" });

        // 5. Voucher Title (Centered)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`${voucher.type.toUpperCase()} VOUCHER`, PAGE_WIDTH / 2, 30, { align: "center" });
        
        // Voucher number and date on same line
        doc.setFontSize(9);
        doc.text(`No: ${voucher.voucher_no}`, MARGIN, 36);
        doc.text(`Date: ${voucher.date}`, PAGE_WIDTH - MARGIN, 36, { align: "right" });

        // 6. Divider Line
        doc.setDrawColor(0);
        doc.setLineWidth(0.3);
        doc.line(MARGIN, 40, PAGE_WIDTH - MARGIN, 40);

        // 7. Photo Area (Left Side - Compact)
        const PHOTO_X = MARGIN;
        const PHOTO_Y = 45;
        
        doc.rect(PHOTO_X, PHOTO_Y, PHOTO_SIZE, PHOTO_SIZE);
        
        if (voucher.photo_url) {
            try {
                const imgData = await fetchImage(voucher.photo_url);
                if (imgData) {
                    doc.addImage(imgData, 'JPEG', 
                        PHOTO_X + 1, PHOTO_Y + 1, // Tighter padding
                        PHOTO_SIZE - 2, PHOTO_SIZE - 2
                    );
                }
            } catch (error) {
                console.log("Photo loading failed, continuing without it");
            }
        }
        
        doc.setFontSize(5);
        doc.text("Authorized Sign", PHOTO_X + (PHOTO_SIZE/2), PHOTO_Y + PHOTO_SIZE + 3, { align: "center" });

        // 8. Party Details (Right Side - Compact)
        const DETAILS_X = PHOTO_X + PHOTO_SIZE + 5;
        const DETAILS_WIDTH = CONTENT_WIDTH - PHOTO_SIZE - 5;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("Party Details:", DETAILS_X, PHOTO_Y + 5);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const partyInfo = [
            backendController.caps(voucher.party_name),
            `${voucher.party_phone}`,
            `${backendController.caps(voucher.party_address)}`,
            `${backendController.caps(voucher.district)} - ${backendController.caps(voucher.pin)}, ${backendController.caps(voucher.state)}`,
        ];
        
        let currentY = PHOTO_Y + 10;
        partyInfo.forEach(line => {
            const lines = doc.splitTextToSize(line, DETAILS_WIDTH);
            doc.text(lines, DETAILS_X, currentY);
            currentY += (lines.length * 4); // Tighter line spacing
        });

        // 9. Amount Section (Compact)
        const AMOUNT_Y = PHOTO_Y + PHOTO_SIZE + 8;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(`Amount: ${backendController.money(voucher.amount,0,1)}`, PAGE_WIDTH - MARGIN, AMOUNT_Y, { align: "right" });
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const amountInWords = `Rupees ${backendController.numberToWords(voucher.amount)} Only`;
        const wordsLines = doc.splitTextToSize(amountInWords, CONTENT_WIDTH);
        doc.text(wordsLines, MARGIN, AMOUNT_Y + 6); // Tighter spacing

        // 10. Narration (Compact)
        const NARRATION_Y = AMOUNT_Y + 6 + (wordsLines.length * 3.5);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("Narration:", MARGIN, NARRATION_Y);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const narrationLines = doc.splitTextToSize(voucher.narration, CONTENT_WIDTH);
        doc.text(narrationLines, MARGIN, NARRATION_Y + 4); // Tighter spacing

        // 11. Payment Mode
        doc.text(`Payment Mode: ${voucher.payment_mode}`, PAGE_WIDTH - MARGIN, NARRATION_Y + 4 + (narrationLines.length * 3.5), { align: "right" });

        // 12. Footer (Centered)
        doc.setFontSize(6);
        doc.text("This is a computer generated voucher", PAGE_WIDTH / 2, 200, { align: "center" });

        // 13. Send PDF Response
        const pdfBuffer = doc.output('arraybuffer');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=${voucher.type}_voucher.pdf`);
        res.send(Buffer.from(pdfBuffer));

    } catch (error) {
        console.error("Error generating voucher:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to generate voucher" });
        }
    }
});

// POST route to handle form submission
router.post('/insert',async (req, res) => {
    const { header, footer, accountname, wayoftransaction, transactiontype, transactionid, entrydate, banks, amount, description, proof="", payerrpayee, maker, auth, ref, uniquekey} = req.body;
    const id = footer.split("[v]");
    const entity_id = accountname;
    const entity_details = await backendController.selectQuery(`select * from entities where deleteon=? and branch=? and id=?`,['0000-00-00', userToken.site, accountname])
    const entity_name = entity_details[0].name;
    const entity_alias = entity_details[0].alias;
    const entity_type = entity_details[0].entity_type;
    const head = header.split("[head]");
    const data = { header,type:id[1],account:entity_id,name:entity_name,wayoftransaction,transactiontype,transactionid,transactiondate:entrydate,amount,description,proof,payerorpayee:payerrpayee,maker,authorization:auth,reference:ref,};
    
    if (header==="nd") {
        return res.json({msg:"Header Not Valid...", msg_type : 'error', success: false });
    }
    else if(!footer)
    {
        return res.json({msg:"Please Select Cash or Bank", msg_type : 'error', success: false });
    }
    else if (accountname==="nd") {
        return res.json({msg:"Account Name is Not Valid", msg_type : 'error', success: false });
    }
    else if (transactiontype==="nd"&&id[0]=="11") {
        return res.json({msg:"Transaction Type is Not Valid", msg_type : 'error', success: false });
    }
    else if (banks==="nd"&&id[0]=="11") {
        return res.json({msg:"Transaction Type is Not Valid", msg_type : 'error', success: false });
    }
    else if (!transactionid&&id[0]=="11") {
        return res.json({msg:"Transaction Type is Not Valid", msg_type : 'error', success: false });
    }
    else if (parseInt(amount)<=0) {
        return res.json({msg:"Amount is Not Valid", msg_type : 'error', success: false });
    }
    else if (!description) {
        return res.json({msg:"Description is Invalid", msg_type : 'error', success: false });
    }
    else if (payerrpayee==="nd") {
        return res.json({msg:"Payer/Payee is Not Valid", msg_type : 'error', success: false });
    }
    else if (maker==="nd") {
        return res.json({msg:"Maker is Invalid", msg_type : 'error', success: false });
    }
    else if (auth==="nd") {
        return res.json({msg:"Authorization is not Valid", msg_type : 'error', success: false });
    }
    else if (!ref) {
        return res.json({msg:"Reference is Invalid", msg_type : 'error', success: false });
    }
    let type = "credit";
    let cash = 0;
    let bank = 0;
    if(wayoftransaction=="payment" || wayoftransaction=="receipt")
    {
        if(id[0]=="11")
        {
            type = "bank";
            bank = amount
        }
        else
        {
            type = "cash";
            cash = amount;
        }
    }
    let edit = 0;
    if (uniquekey) {
        edit++;
        try {
          // Call the `deleted()` function with the necessary arguments
          await backendController.accountsDelete("voucher" , uniquekey);
          await backendController.deleted({ body : {'tableName' :'voucher', 'whereCondition': `voucherno=?`,'values':[uniquekey]}});
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }
    
    try {
        const insertResponse = await backendController.insert({body: {tableName: 'voucher',data: data, column:"voucherno", id:"v"+uniquekey}});
        await backendController.cdAccounts(head[0], id[0], wayoftransaction, entrydate, entity_id, amount, id[1], "voucher", "v"+insertResponse.newId, 0, ref, description, entity_name, type, cash, bank, banks, transactiontype);
        if (insertResponse.success && edit==0)
            res.json({msg: "Data entered successfully", msg_type : 'success', success: true});
        else if(insertResponse.success && edit>0)
            res.json({msg: "Data Updated successfully", msg_type : 'success', success: true});
        else {
            console.log('Insert failed');
            res.json({success: false,msg: 'Error occurred while inserting data',msg_type: 'error',error: insertResponse.message || 'Unknown error'});
        }
    } catch (error) {
        console.error('Error during insert operation:', error);
        res.json({success: false,msg: 'Error occurred while inserting data',msg_type: 'error',error: error.message || 'Unknown error'});
    }
});

router.get("/users", async (req, res) => {
    backendController.selectQuery(`SELECT userid,name FROM users where deleteon='0000-00-00'`)
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            let optionTag = `<option value="${item['userid']}">${item['name']}</option>`;
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

router.get("/loadHeader", async (req, res) => {
    backendController.selectQuery(`SELECT * FROM chart_of_accounts where deleteon=? and branch=?`, ['0000-00-00',userToken.site])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['id']}">${item['account_name']}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.get("/loadAcc", async (req, res) => {
    const id = req.headers.data;
    backendController.selectQuery(`SELECT distinct id,name,alias FROM entities where deleteon=? and branch=? and account_id=?`,['0000-00-00', userToken.site,id])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['id']}">${item['name']}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.get("/wayOff", async (req, res) => {
    let options_arr = [`<option value="payment">Payment</option>`,`<option value="receipt">Receipt</option>`,`<option value="payable">Payable</option>`,`<option value="receivable">Receivable</option>`];
    const html = options_arr.join('');
    res.json({ success: true, response: html });
});

router.get("/transactionType", async (req, res) => {
    backendController.selectQuery(`SELECT distinct types FROM transaction_types where deleteon='0000-00-00'`)
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

router.get("/bank", async (req, res) => {
    backendController.selectQuery(`SELECT distinct displayname FROM banks where deleteon='0000-00-00'`)
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

router.post("/select", async (req, res) => {
    const { page = 1, limit = 10 } = req.body;  // Default page 1 and limit 10

    const offset = (page - 1) * limit;
    const totalRecode = await backendController.selectQuery(`SELECT count(*) as total FROM voucher where deleteon=?`,['0000-00-00']);
    backendController.selectQuery(`SELECT * FROM voucher where deleteon=?`,['0000-00-00'])
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
        const entryDate = backendController.rawDateFormat(item.transactiondate);
        // console.log(entryDate)
        let edit_and_delete = `<div class='flex-with-space-edit-delete'>`;
            if(!userToken.rights_result||userToken.rights_result.print_rights===0)
                edit_and_delete += `<img src="/images/print.png" width="25" height="25" class="print-iconi" title="" id="print-order${item.voucherno}" voucher="${item.voucherno}" datas='${JSON.stringify(item)}'/>`;
            if(!userToken.rights_result||userToken.rights_result.edit_rights===0)
                edit_and_delete += `<img src="/images/edit.png" width="25" height="25" class="edit-icon" title="" id="edit-user${item.voucherno}" uniquekey="${item.voucherno}" datas='${JSON.stringify(item)}'/>`;
            if(!userToken.rights_result||userToken.rights_result.delete_rights===0)
                edit_and_delete += `<img src="/images/delete.png" class="delete-icon" title="" width="25" height="25" id="delete-user${item.voucherno}" uniquekey="${item.voucherno}" datas='${JSON.stringify(item)}'/>`;
              edit_and_delete += `</div>`;
        htmlContent += `<tr><td>${sno}</td><td>${backendController.caps(item.name)}</td><td>${backendController.caps(item.wayoftransaction)}</td><td>${backendController.money(item.amount,0,1)}</td><td>${entryDate}</td><td>${ backendController.generateImageTag(item.proof, 'profile', 'popup-img', 'width: 30px;border-radius: 50%;padding:2px;')}</td><td>${edit_and_delete}</td></tr>`;
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
          const deleteid = await backendController.deleted({ body : {'tableName' :'voucher', 'whereCondition': `voucherno=?`,'values':[uniquekey]}});
          const deleteid2 = await backendController.accountsDelete("voucher" , uniquekey);
          if (deleteid.success&&deleteid2.success)
            res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});


module.exports = router;