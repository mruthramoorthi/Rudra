const express = require("express");
const backendController = require('../../controllers/backend-functions');
const router = express.Router();
const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default;

router.post("/pdfReport", async (req, res) => {
    const { from, to } = req.body;
    try {
        // Get records with bank > 0
        const results = await backendController.selectQuery(
            `SELECT * FROM transactions 
             WHERE deleteon=? AND branch=? AND bank>? AND date BETWEEN ? AND ? 
             ORDER BY date ASC, fromm ASC`,
            ['0000-00-00', userToken.site, 0, from, to]
        );

        // Opening balance calculation
        const openingBalanceResult = await backendController.selectQuery(
            `SELECT 
                SUM(CASE WHEN type IN ('receivable', 'payment') THEN -bank ELSE bank END) as opening_bank
             FROM transactions 
             WHERE deleteon=? and branch=? and bank>? and date < ?`,
            ['0000-00-00', userToken.site, 0, from]
        );

        const opening_bank = parseFloat(openingBalanceResult[0]?.opening_bank || 0);

        // PDF setup
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pageWidth = doc.internal.pageSize.getWidth();
        const currentDate = new Date().toLocaleDateString();

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`From: ${from}`, 10, 10);
        doc.text(`To: ${to}`, 10, 15);
        doc.text(`Printed: ${currentDate}`, pageWidth - 10, 10, { align: "right" });

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Bank Book", pageWidth / 2, 15, { align: "center" });

        const columns = ["#", "From", "ID", "Receipt (Bank)", "Payment (Bank)"];

        // Group by date
        const grouped = {};
        results.forEach((item, index) => {
            const date = item.date;
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push({
                index: index + 1,
                fromm: backendController.caps(item.fromm),
                id: item.id,
                bank: item.bank,
                paymentb: item.paymentb,
                type: item.type
            });
        });

        // Build table rows
        const finalRows = [];

        let rowCounter = 1;
        let runningBank = opening_bank;
        let totalReceiptB = 0;
        let totalPaymentB = 0;

        // Opening Balance row
        finalRows.push([
            { content: "Opening Balance", colSpan: 3 },
            opening_bank >= 0 ? backendController.money(opening_bank, 0, 1) : '',
            opening_bank < 0 ? backendController.money(Math.abs(opening_bank), 0, 1) : ''
        ]);

        for (const date in grouped) {
            finalRows.push([
                {
                    content: `Date: ${backendController.rawDateFormat(date, 'dmy')}`,
                    colSpan: 5,
                    styles: {
                        halign: 'left',
                        fillColor: [230, 230, 230],
                        fontStyle: 'bold'
                    }
                }
            ]);

            grouped[date].forEach((item) => {
                let receiptb = 0;
                let paymentb = 0;

                if (item.type === "receivable" || item.type === "payment") {
                    paymentb = item.bank;
                    runningBank -= item.bank;
                } else {
                    receiptb = item.bank;
                    runningBank += item.bank;
                }

                totalReceiptB += receiptb;
                totalPaymentB += paymentb;

                finalRows.push([
                    rowCounter++,
                    item.fromm,
                    item.id,
                    backendController.money(receiptb, 0, 1),
                    backendController.money(paymentb, 0, 1)
                ]);
            });
        }

        // Total row
        finalRows.push([
            "", "", "Period Total",
            backendController.money(totalReceiptB, 0, 1),
            backendController.money(totalPaymentB, 0, 1)
        ]);

        // Closing Balance
        finalRows.push([
            "", "", "Closing Balance",
            runningBank >= 0 ? backendController.money(runningBank, 0, 1) : '',
            runningBank < 0 ? backendController.money(Math.abs(runningBank), 0, 1) : ''
        ]);

        // Draw the table
        autoTable(doc, {
            head: [columns],
            body: finalRows,
            startY: 20,
            headStyles: {
                halign: 'center',
                fontSize: 12,
                textColor: [255, 255, 255],
                fillColor: [0, 0, 0]
            },
            columnStyles: {
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right' },
            }
        });

        const pdfBuffer = doc.output("arraybuffer");

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline; filename=bank_book.pdf");
        res.send(Buffer.from(pdfBuffer));

    } catch (error) {
        console.error("Error generating bank book PDF:", error);
        res.status(500).send("Error generating bank book PDF.");
    }
});


router.post("/select", async (req, res) => {
    const { page = 1, limit = 10 } = req.body;  // Default page 1 and limit 10
    const {datas} = req.body;
    const from = datas.from;
    const to = datas.to;
    const offset = (page - 1) * limit;
    
    try {
        // Get total records count
        const totalRecode = await backendController.selectQuery(
            `SELECT count(*) as total FROM transactions 
             WHERE deleteon=? and branch=? and bank>? and date between ? and ?`,
            ['0000-00-00', userToken.site, 0, from, to]
        );

        // Calculate opening balance (sum of all bank transactions before the 'from' date)
        const openingBalance = await backendController.selectQuery(
            `SELECT 
                SUM(CASE WHEN type IN ('receivable', 'payment') THEN -bank ELSE bank END) as opening_bank
             FROM transactions 
             WHERE deleteon=? and branch=? and bank>? and date < ?`,
            ['0000-00-00', userToken.site, 0, from]
        );

        // Get transaction data
        const results = await backendController.selectQuery(
            `SELECT * FROM transactions 
             WHERE deleteon=? and branch=? and bank>? and date between ? and ? 
             ORDER by date asc, fromm asc`,
            ['0000-00-00', userToken.site, 0, from, to]
        );

        const html = generateHTMLData(results, openingBalance[0]);
        res.json({ 
            success: true, 
            response: html, 
            total: totalRecode[0].total, 
            openingBalance: openingBalance[0],
            msg: "ok" 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, msg: "Server Error" });
    }
});

let sno = 0;
function generateHTMLData(results, openingBalance = {opening_bank: 0}) {
    let htmlContent = '';
    let total_receiptb = 0;
    let total_paymentb = 0;
    let date = "";
    
    // Initialize running balance with opening balance
    let running_bank = parseInt(backendController.valNum(openingBalance.opening_bank));
    
    // Add opening balance row
    htmlContent += `
        <tr class="opening-balance">
            <td colspan="4">Opening Balance</td>
            <td class='right-align'>${running_bank >= 0 ? backendController.money(running_bank, 0, 1) : ''}</td>
            <td class='right-align'>${running_bank < 0 ? backendController.money(Math.abs(running_bank), 0, 1) : ''}</td>
        </tr>
    `;

    results.forEach(item => {
        sno++;
        const entryDate = backendController.rawDateFormat(item.date, 'dmy');
        
        if(date !== entryDate) {
            date = entryDate;
            htmlContent += `<tr class="date-row"><td colspan='7'>${date}</td></tr>`;
        }

        let paymentb = 0;
        let receiptb = 0;

        if(item.type === "receivable" || item.type === "payment") {
            paymentb = item.bank;
            running_bank -= item.bank;
        } else {
            receiptb = item.bank;
            running_bank += item.bank;
        }

        total_receiptb += receiptb;
        total_paymentb += paymentb;

        htmlContent += `
            <tr>
                <td>${sno}</td>
                <td>${backendController.caps(item.fromm)}</td>
                <td>${item.id}</td>
                <td>${backendController.caps(item.bankname)}</td>
                <td class='right-align'>${backendController.money(receiptb, 0, 1)}</td>
                <td class='right-align'>${backendController.money(paymentb, 0, 1)}</td>
            </tr>
        `;
    });

    // Calculate closing balance
    const closing_b = running_bank;
    
    // Add totals row
    htmlContent += `
        [tdfooter]
        <tr class="total-row">
            <td colspan='4'>Period Total</td>
            <td class='right-align'>${backendController.money(total_receiptb, 0, 1)}</td>
            <td class='right-align'>${backendController.money(total_paymentb, 0, 1)}</td>
        </tr>
        <tr class="closing-balance">
            <td colspan='4'>Closing Balance</td>
            <td class='right-align'>${closing_b >= 0 ? backendController.money(closing_b, 0, 1) : ''}</td>
            <td class='right-align'>${closing_b < 0 ? backendController.money(Math.abs(closing_b), 0, 1) : ''}</td>
        </tr>
    `;
    
    sno = 0;
    return htmlContent;
}

module.exports = router;