const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const router = express.Router();
const { jsPDF } = require("jspdf");
const { all } = require("./order-report");
const autoTable = require("jspdf-autotable").default;

router.post("/pdf", async (req, res) => {
    const { fdate, todate, metal } = req.body;

    try {
        // Fetch data from the database
        const results = await backendController.selectQuery(
            `SELECT * FROM old where deleteon=? and branch=? and metal=? and date between ? and ? order by uniqueid desc`,
            ['0000-00-00', userToken.site, metal, fdate, todate]
        );
        const results2 = await backendController.selectQuery(
            `SELECT * FROM coin where deleteon=? and branch=? and metal=? and date between ? and ? order by uniqueid desc`,
            ['0000-00-00', userToken.site, metal, fdate, todate]
        );

        // Create a new PDF document
        const doc = new jsPDF({
            orientation: "portrait", // "portrait" or "landscape"
            unit: "mm",               // Measurement unit (mm)
            format: "a4",             // Set format to A4
        });

        // Add the heading "Placed Orders Report"
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        // Top Left Corner: From and To Dates
        doc.text(`${fdate} - ${todate}`, 10, 10);
        doc.setFontSize(16);
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;
        doc.text("OG Report", centerX, 10, { align: "center" });

        // Add the date and time to the top-right corner
        const currentDate = new Date();
        const dateString = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;
        doc.setFontSize(10);
        const textWidth = doc.getTextWidth(dateString);
        const xPosition = pageWidth - textWidth - 15;
        doc.text(dateString, xPosition, 10, { align: "left" });

        // Prepare the data for the table (loop through the results)
        let filteredRows = [];
        let sno = 0;

        for (let i = 0; i < results.length; i++) {
            const old = results[i];

            sno++;
            const entryDate = backendController.rawDateFormat(old.date, 'dmy');

            // Calculate totals
            filteredRows.push([
                sno, 
                entryDate,
                backendController.caps(old.category), 
                backendController.caps(old.id), 
                backendController.money(old.rate, 0, 1), 
                backendController.money(old.weight, 3, 1), 
                backendController.money(old.waste, 3, 1), 
                backendController.money(old.oldamount, 3, 1), 
            ]);
        }

        for (let i = 0; i < results2.length; i++) {
            const old = results2[i];

            sno++;
            const entryDate = backendController.rawDateFormat(old.date, 'dmy');

            // Calculate totals
            filteredRows.push([
                sno, 
                entryDate,
                backendController.caps(old.category), 
                backendController.caps(old.id), 
                backendController.money(old.rate, 0, 1), 
                backendController.money(old.weight, 3, 1), 
                backendController.money(0, 3, 1), 
                backendController.money(old.totalamount, 3, 1), 
            ]);
        }

        // Set table columns
        const columns = ["#", "Date", "Category", "ID", "Rate", "Weight", "Waste", "Amount"];

        // Add the table to the PDF
        autoTable(doc, {
            head: [columns],
            body: filteredRows,
            startY: 15,
            headStyles: {
                halign: 'center',
                fontSize: 13,
                textColor: [255, 255, 255],
                fillColor: [0, 0, 0],  // Background color of table header
            },
            columnStyles: {
                4: { halign: 'right' }, // Pieces
                5: { halign: 'right' }, // Weight
                6: { halign: 'right' }, // Date
                7: { halign: 'right' }, // Amount
            }
        });

        // Generate PDF as a buffer
        const pdfBuffer = doc.output("arraybuffer");

        // Set the headers to serve the PDF
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline; filename=placed_orders_report.pdf");
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

router.post("/select", async (req, res) => {
    const {datas} = req.body;
    const fdate = datas.fdate;
    const todate = datas.todate;
    const metal = datas.metal;
    try{
        const totalRecode = await backendController.selectQuery(
            `SELECT count(*) as total FROM old where deleteon=? and metal=? and branch=? and date between ? and ?`,
            ['0000-00-00', userToken.site, metal, fdate, todate]
        );
        
        const results = await backendController.selectQuery(
            `SELECT * FROM old where deleteon=? and branch=? and metal=? and date between ? and ? order by uniqueid desc`,
            ['0000-00-00', userToken.site, metal, fdate, todate]
        );
        const totalRecode_coin = await backendController.selectQuery(
            `SELECT count(*) as total FROM coin where deleteon=? and metal=? and branch=? and date between ? and ?`,
            ['0000-00-00', userToken.site, metal, fdate, todate]
        );
        
        const results_coin = await backendController.selectQuery(
            `SELECT * FROM coin where deleteon=? and branch=? and metal=? and date between ? and ? order by uniqueid desc`,
            ['0000-00-00', userToken.site, metal, fdate, todate]
        );
        const html = await generateHTMLData(results,results_coin);
        res.json({
            success: true, 
            response: html, 
            total: parseInt(totalRecode[0].total + totalRecode_coin[0].total), 
            msg: "ok" 
        });
    }
    catch(error){
        console.error('Error:', error);
        res.status(500).json({ success: false, msg: "Server Error" });
    }
});

let sno = 0;
async function generateHTMLData(groupedResults,results_coin) {
    let htmlContent = '';
    let weight = 0;
    let waste = 0;
    let amount = 0;
    for (let i = 0; i < groupedResults.length; i++) {
            const old = groupedResults[i];
            sno++;
        htmlContent += `
            <tr>
                <td>${sno}</td>
                <td>${backendController.rawDateFormat(old.date,'dmy','-')}</td>
                <td>${backendController.caps(old.category)}</td>
                <td>${backendController.caps(old.id)}</td>
                <td class='right-align'>${backendController.money(old.rate,3,1)}</td>
                <td class='right-align'>${backendController.money(old.weight,3,1)}</td>
                <td class='right-align'>${backendController.money(old.waste,3,1)}</td>
                <td class='right-align'>${backendController.money(old.oldamount, 3, 1)}</td>
            </tr>`;
            weight += parseFloat(old.weight);
            waste += parseFloat(old.waste);
            amount += parseFloat(old.oldamount);
    }
    for (let i = 0; i < results_coin.length; i++) {
            const old = results_coin[i];
            sno++;
        htmlContent += `
            <tr>
                <td>${sno}</td>
                <td>${backendController.rawDateFormat(old.date,'dmy','-')}</td>
                <td>${backendController.caps(old.category)}</td>
                <td>${backendController.caps(old.id)}</td>
                <td class='right-align'>${backendController.money(old.rate,3,1)}</td>
                <td class='right-align'>${backendController.money(old.weight,3,1)}</td>
                <td class='right-align'>${backendController.money(0,3,1)}</td>
                <td class='right-align'>${backendController.money(old.totalamount, 3, 1)}</td>
            </tr>`;
            weight += parseFloat(old.weight);
            waste += 0;
            amount += parseFloat(old.totalamount);
    }
    htmlContent += `
        [tdfooter]<tr><td colspan='4'>Total</td><td class='right-align'>${backendController.money(weight,3,1)}</td><td class='right-align'>${backendController.money(waste,3,1)}</td><td></td><td class='right-align'>${backendController.money(amount,3,1)}</td></tr>`;
    sno = 0;
    return htmlContent;
}

module.exports = router;