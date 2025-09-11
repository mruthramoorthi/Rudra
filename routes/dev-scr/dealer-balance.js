const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const router = express.Router();
const { jsPDF } = require("jspdf");
const { all } = require("./order-report");
const autoTable = require("jspdf-autotable").default;

router.post("/pdf", async (req, res) => {
    const { fdate, todate } = req.body;

    try {
        // Fetch the main results (dealer_balance data)
        const results = await backendController.selectQuery(
            `SELECT distinct dealercode, sum(weight) as weight, sum(cash) as cash 
             FROM dealer_balance 
             WHERE deleteon=? and branch=? and date BETWEEN ? and ? 
             GROUP BY dealercode ORDER BY dealercode ASC`,
            ['0000-00-00', userToken.site, fdate, todate]
        );

        let filteredRows = [];
        let sno = 0;

        for (let i = 0; i < results.length; i++) {
            const old = results[i];

            // Get related data from dealer_balance_opening
            const opening = await backendController.selectQuery(
                `SELECT sum(weight) as weight, sum(cash) as cash 
                 FROM dealer_balance_opening 
                 WHERE deleteon=? and branch=? and dealercode=?
                 GROUP BY dealercode`,
                ['0000-00-00', userToken.site, old.dealercode]
            );

            // Get related data from dealer_payment
            const payment = await backendController.selectQuery(
                `SELECT sum(weight) as weight, sum(cash) as cash 
                 FROM dealer_payment 
                 WHERE deleteon=? and branch=? and dealercode=? and date BETWEEN ? and ? 
                 GROUP BY dealercode`,
                ['0000-00-00', userToken.site, old.dealercode, fdate, todate]
            );

            sno++;
            let obWt = 0;
            let obCs = 0;
            let dealWt = 0;
            let dealCs = 0;

            // Calculate opening weights and cash
            if (opening[0]) {
                obWt = backendController.valNum(opening[0].weight);
                obCs = backendController.valNum(opening[0].cash);
            }

            // Calculate payment weights and cash
            if (payment[0]) {
                dealWt = backendController.valNum(payment[0].weight);
                dealCs = backendController.valNum(payment[0].cash);
            }

            // Calculate the final weight and cash
            const totalWeight = backendController.valNum(old.weight) + obWt - dealWt;
            const totalCash = backendController.valNum(old.cash) + obCs - dealCs;

            // Format as needed
            const formattedWeight = backendController.money(totalWeight, 3, 1);
            const formattedCash = backendController.money(totalCash, 3, 1);

            // Add to the table data array
            filteredRows.push([
                sno,
                backendController.caps(old.dealercode),
                formattedWeight,
                formattedCash
            ]);
        }

        // Create a new PDF document
        const doc = new jsPDF({
            orientation: "portrait", // "portrait" or "landscape"
            unit: "mm",               // Measurement unit (mm)
            format: "a4",             // Set format to A4
        });

        // Add the heading "Dealer Balance Report"
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        // Top Left Corner: From and To Dates
        doc.text(`${fdate} - ${todate}`, 10, 10);
        doc.setFontSize(16);
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;
        doc.text("Dealer Balance Report", centerX, 10, { align: "center" });

        // Add the date and time to the top-right corner
        const currentDate = new Date();
        const dateString = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;
        doc.setFontSize(10);
        const textWidth = doc.getTextWidth(dateString);
        const xPosition = pageWidth - textWidth - 15;
        doc.text(dateString, xPosition, 10, { align: "left" });

        // Set table columns
        const columns = ["#", "Dealer Code", "Weight", "Cash"];

        // Add the table to the PDF
        autoTable(doc,{
            head: [columns],
            body: filteredRows,
            startY: 20,
            headStyles: {
                halign: 'center',
                fontSize: 13,
                textColor: [255, 255, 255],
                fillColor: [0, 0, 0],  // Background color of table header
            },
            columnStyles: {
                2: { halign: 'right' }, // Weight
                3: { halign: 'right' }, // Cash
            }
        });

        // Generate PDF as a buffer
        const pdfBuffer = doc.output("arraybuffer");

        // Set the headers to serve the PDF
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline; filename=dealer_balance_report.pdf");
        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).send("Error generating PDF.");
    }
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

router.get("/loadDistrict", async (req, res) => {
    backendController.selectQuery(`SELECT distinct districtname FROM maps where deleteon=? order by districtname asc`,['0000-00-00'])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['districtname']}">${item['districtname']}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
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

router.post("/select", async (req, res) => {
    const {datas} = req.body;
    const fdate = datas.fdate;
    const todate = datas.todate;
    const decide = datas.decide;
    const dealer = datas.dealer;
    const place = datas.place;
    try{
        const html = await generateHTMLData(datas);
        res.json({
            success: true, 
            response: html.html, 
            total: parseInt(html.total), 
            msg: "ok"
        });
    }
    catch(error){
        console.error('Error:', error);
        res.status(500).json({ success: false, msg: "Server Error" });
    }
});

let sno = 0;
async function generateHTMLData(datas) {
    const fdate = datas.fdate;
    const todate = datas.todate;
    const decide = datas.decide;
    const dealer = datas.dealer;
    const place = datas.place;
    const metal = datas.metals;
    let dealers = dealer; 
    let dealer_qry = "";
    if(place!="nd")
    {
        const dealersi = await backendController.selectQuery(`SELECT GROUP_CONCAT(code) as code FROM dealers where city=? and deleteon=? and branch=?`, [place,'0000-00-00',userToken.site]);
        dealers = dealersi[0].code.split(','); // Convert it into an array
        dealer_qry = " and dealercode in (?)";
    }
    if(dealer!="nd")
    {
        dealer_qry = " and dealercode in (?)";
    }
    let htmlContent = '';
    let lastDate = fdate;
    if(decide!="balance")
    {
        // here after no payment table to store the dealer payment all are included in one dealer balnce table payments are mentioned in minus symbol

        const results = await backendController.selectQuery(
            `SELECT dealercode,weight,cash,bank,date,metal,purchaseid,receiptid,rate FROM dealer_balance where deleteon=? and branch=? and date between ? and ? ${dealer_qry} order by uniqueid desc`,
            ['0000-00-00', userToken.site, fdate, todate, dealers]
        );
        for (let i = 0; i < results.length; i++) {
            const old = results[i];
            const metals = old.metal;
            if(metal!="nd" && metal!=metals)
                continue;
            if(old.purchaseid!="" && decide=='payment')
                continue
            if(old.receiptid!="" && decide=='purchase')
                continue
            sno++;
            let entry_date = backendController.rawDateFormat(old.date,'dmy');
            let id = old.purchaseid
            if(!old.purchaseid)
                id = old.receiptid
            htmlContent += `
                <tr>
                    <td>${sno}</td>
                    <td>${entry_date}</td>
                    <td>${backendController.caps(id)}</td>
                    <td>${backendController.caps(old.dealercode)}</td>
                    <td>${backendController.caps(old.metal)}</td>`;
                if(!old.receiptid)
                {
                    htmlContent += `<td class='right-align red'>${backendController.money(old.weight,3,1)}</td>
                            <td class='right-align red'>${backendController.money(old.cash,3,1)}</td>`;
                }
                if(!old.purchaseid)
                {
                    htmlContent += `<td class='right-align green'>${backendController.money(old.weight,3,1)}</td>
                            <td class='right-align green'>${backendController.money(parseInt(old.cash + old.bank),3,1)}</td>`;
                }
            htmlContent += `<td>${backendController.caps(old.photoproof)}</td>
                </tr>`;
            lastDate = backendController.rawDateFormat(old.date,'ymd','-');
        }
    }
    else if(decide=="balance")
    {
        // for the dealer balance show opening and closing start and end of the particular dealer transactions
        const all_dealers = await backendController.selectQuery(
            `SELECT distinct dealercode from dealer_balance where deleteon=? and branch=? and date between ? and ? ${dealer_qry} order by uniqueid desc`,
            ['0000-00-00', userToken.site, fdate, todate, dealers]
        );
        for(let r=0; r<all_dealers.length; r++)
        {
            const dealer_balance_op = await backendController.selectQuery(
                `SELECT distinct metal, dealercode, sum(weight) as weight, sum(cash) as cash, sum(bank) as bank 
                FROM dealer_balance 
                WHERE deleteon = ? AND branch = ? AND date < ? AND dealercode = ? 
                GROUP BY dealercode`,
                ['0000-00-00', userToken.site, fdate, all_dealers[r].dealercode]
            );

            if (dealer_balance_op.length > 0) {
                for (let k = 0; k < dealer_balance_op.length; k++) {
                    htmlContent += `
                        <tr>
                            <td>OB</td>
                            <td>${backendController.rawDateFormat(fdate, 'dmy')}</td>
                            <td colspan="2">${backendController.caps(dealer_balance_op[k].dealercode)}</td>
                            <td>${backendController.caps(dealer_balance_op[k].metal)}</td>
                            <td class='right-align'>${backendController.money(dealer_balance_op[k].weight, 3, 1)}</td>
                            <td class='right-align'>${backendController.money(parseInt(dealer_balance_op[k].cash + dealer_balance_op[k].bank), 3, 1)}</td>
                            <td></td>
                        </tr>`;
                }
            } else {
                htmlContent += `
                    <tr>
                        <td>OB</td>
                        <td>${backendController.rawDateFormat(fdate, 'dmy')}</td>
                        <td colspan="2">${backendController.caps(all_dealers[r].dealercode)}</td>
                        <td>--</td>
                        <td class='right-align'>0.000</td>
                        <td class='right-align'>0.000</td>
                        <td></td>
                    </tr>`;
            }

            const results = await backendController.selectQuery(
                `SELECT dealercode,weight,cash,bank,date,metal,purchaseid,receiptid,rate FROM dealer_balance where deleteon=? and branch=? and date between ? and ? and dealercode=? order by uniqueid desc`,
                ['0000-00-00', userToken.site, fdate, todate, all_dealers[r].dealercode]
            );
            for (let i = 0; i < results.length; i++) {
                const old = results[i];
                const metals = old.metal;
                if(metal!="nd" && metal!=metals)
                    continue;
                if(old.purchaseid!="" && decide=='payment')
                    continue
                if(old.receiptid!="" && decide=='purchase')
                    continue
                sno++;
                let entry_date = backendController.rawDateFormat(old.date,'dmy');
                let id = old.purchaseid
                if(!old.purchaseid)
                    id = old.receiptid
                htmlContent += `
                    <tr>
                        <td>${sno}</td>
                        <td>${entry_date}</td>
                        <td>${backendController.caps(id)}</td>
                        <td>${backendController.caps(old.dealercode)}</td>
                        <td>${backendController.caps(old.metal)}</td>`;
                    if(!old.receiptid)
                    {
                        htmlContent += `<td class='right-align red'>${backendController.money(old.weight,3,1)}</td>
                                <td class='right-align red'>${backendController.money(old.cash,3,1)}</td>`;
                    }
                    if(!old.purchaseid)
                    {
                        htmlContent += `<td class='right-align green'>${backendController.money(old.weight,3,1)}</td>
                                <td class='right-align green'>${backendController.money(parseInt(old.cash + old.bank),3,1)}</td>`;
                    }
                htmlContent += `<td>${backendController.caps(old.photoproof)}</td>
                    </tr>`;
                lastDate = backendController.rawDateFormat(old.date,'ymd','-');
            }
            const dealer_balance_cl = await backendController.selectQuery(
            `SELECT distinct metal, dealercode, sum(weight) as weight, (sum(cash) + sum(bank)) as bal 
                FROM dealer_balance 
                WHERE deleteon = ? AND branch = ? AND date <= ? AND dealercode = ? 
                GROUP BY dealercode`,
            ['0000-00-00', userToken.site, todate, all_dealers[r].dealercode]
            );

            if (dealer_balance_cl.length > 0) {
            for (let k = 0; k < dealer_balance_cl.length; k++) {
                htmlContent += `
                    <tr>
                        <td>Cl</td>
                        <td>${backendController.rawDateFormat(todate, 'dmy')}</td>
                        <td colspan="2">${backendController.caps(dealer_balance_cl[k].dealercode)}</td>
                        <td>${backendController.caps(dealer_balance_cl[k].metal)}</td>
                        <td class='right-align'>${backendController.money(dealer_balance_cl[k].weight, 3, 1)}</td>
                        <td class='right-align'>${backendController.money(dealer_balance_cl[k].bal, 3, 1)}</td>
                        <td></td>
                    </tr>`;
            }
            } else {
            htmlContent += `
                <tr>
                    <td>Cl</td>
                    <td>${backendController.rawDateFormat(todate, 'dmy')}</td>
                    <td colspan="2">${backendController.caps(all_dealers[r].dealercode)}</td>
                    <td>--</td>
                    <td class='right-align'>0.000</td>
                    <td class='right-align'>0.000</td>
                    <td></td>
                </tr>`;
            }

        }
    }
    let total = sno;    
    sno = 0;
    return { html: htmlContent, total: total };
}

module.exports = router;