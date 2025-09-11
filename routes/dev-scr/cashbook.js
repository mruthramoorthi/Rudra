const express = require("express");
const backendController = require('../../controllers/backend-functions');
const router = express.Router();
const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default;

router.post("/pdfReport", async (req, res) => {
    const { from, to } = req.body;
    try {
        // Fetch total record count
        const totalRecode = await backendController.selectQuery(
            `SELECT count(*) as total FROM transactions WHERE deleteon=? AND branch=? AND date BETWEEN ? AND ?`,
            ['0000-00-00', userToken.site, from, to]
        );

        // Fetch transactions in date range
        const results = await backendController.selectQuery(
            `SELECT * FROM transactions WHERE deleteon=? AND branch=? AND date BETWEEN ? AND ? ORDER BY date ASC, fromm ASC`,
            ['0000-00-00', userToken.site, from, to]
        );

        // Fetch opening balance before the `from` date
        const openingBalance = await backendController.selectQuery(
            `SELECT 
                SUM(CASE WHEN type IN ('receivable', 'payment') THEN -cash ELSE cash END) as opening_cash,
                SUM(CASE WHEN type IN ('receivable', 'payment') THEN -bank ELSE bank END) as opening_bank
             FROM transactions 
             WHERE deleteon=? and branch=? and date < ?`,
            ['0000-00-00', userToken.site, from]
        );

        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const currentDate = new Date().toLocaleDateString();

        // Header
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`From: ${from}`, 10, 10);
        doc.text(`To: ${to}`, 10, 15);
        doc.text(`Printed: ${currentDate}`, pageWidth - 40, 10, { align: "right" });

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Cash Report", pageWidth / 2, 15, { align: "center" });

        const columns = ["#", "From", "ID", "Receipt (Cash)", "Receipt (Bank)", "Payment (Cash)", "Payment (Bank)"];

        const grouped = {};
        results.forEach((item, index) => {
            const date = item.date;
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push({
                index: index + 1,
                fromm: backendController.caps(item.fromm),
                id: item.id,
                cash: backendController.money(item.cash, 0, 1),
                bank: backendController.money(item.bank, 0, 1),
                paymentc: backendController.money(item.paymentc, 0, 1),
                paymentb: backendController.money(item.paymentb, 0, 1),
                rawCash: item.cash,
                rawBank: item.bank,
                rawPaymentC: item.paymentc,
                rawPaymentB: item.paymentb,
                type: item.type
            });
        });

        const finalRows = [];

        // Opening balance row
        finalRows.push([
            { content: `Opening Balance`, colSpan: 3 },
            backendController.money(Math.max(0, openingBalance[0].opening_cash), 0, 1),
            backendController.money(Math.max(0, openingBalance[0].opening_bank), 0, 1),
            backendController.money(Math.abs(Math.min(0, openingBalance[0].opening_cash)), 0, 1),
            backendController.money(Math.abs(Math.min(0, openingBalance[0].opening_bank)), 0, 1)
        ]);

        // Totals
        let totalReceiptC = 0, totalReceiptB = 0, totalPaymentC = 0, totalPaymentB = 0;
        let rowCount = 1;

        for (const date in grouped) {
            finalRows.push([
                {
                    content: `Date: ${backendController.rawDateFormat(date, 'dmy')}`,
                    colSpan: 7,
                    styles: {
                        halign: 'left',
                        fillColor: [240, 240, 240],
                        fontStyle: 'bold'
                    }
                }
            ]);

            grouped[date].forEach((item) => {
                let receiptC = 0, receiptB = 0, paymentC = 0, paymentB = 0;

                if (item.type === "receivable" || item.type === "payment") {
                    paymentC = item.rawCash;
                    paymentB = item.rawBank;
                } else {
                    receiptC = item.rawCash;
                    receiptB = item.rawBank;
                }

                totalReceiptC += receiptC;
                totalReceiptB += receiptB;
                totalPaymentC += paymentC;
                totalPaymentB += paymentB;

                finalRows.push([
                    rowCount++,
                    item.fromm,
                    item.id,
                    backendController.money(receiptC, 0, 1),
                    backendController.money(receiptB, 0, 1),
                    backendController.money(paymentC, 0, 1),
                    backendController.money(paymentB, 0, 1)
                ]);
            });
        }

        // Total row
        finalRows.push([
            "", "", "Period Total",
            backendController.money(totalReceiptC, 0, 1),
            backendController.money(totalReceiptB, 0, 1),
            backendController.money(totalPaymentC, 0, 1),
            backendController.money(totalPaymentB, 0, 1)
        ]);

        // Closing balance
        const closingCash = parseFloat(openingBalance[0].opening_cash || 0) + (totalReceiptC - totalPaymentC);
        const closingBank = parseFloat(openingBalance[0].opening_bank || 0) + (totalReceiptB - totalPaymentB);

        finalRows.push([
            "", "", "Closing Balance",
            backendController.money(closingCash, 0, 1),
            backendController.money(closingBank, 0, 1),
            "", ""
        ]);

        autoTable(doc,{
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
                5: { halign: 'right' },
                6: { halign: 'right' },
            }
        });

        const pdfBuffer = doc.output("arraybuffer");

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline; filename=transactions_report.pdf");
        res.send(Buffer.from(pdfBuffer));

    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).send("Error generating PDF.");
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
            `SELECT count(*) as total FROM transactions where deleteon=? and branch=? and date between ? and ?`,
            ['0000-00-00', userToken.site, from, to]
        );

        // Calculate opening balance (sum of all transactions before the 'from' date)
        const openingBalance = await backendController.selectQuery(
            `SELECT 
                SUM(CASE WHEN type IN ('receivable', 'payment') THEN -cash ELSE cash END) as opening_cash,
                SUM(CASE WHEN type IN ('receivable', 'payment') THEN -bank ELSE bank END) as opening_bank
             FROM transactions 
             WHERE deleteon=? and branch=? and date < ?`,
            ['0000-00-00', userToken.site, from]
        );

        // Get transaction data
        const results = await backendController.selectQuery(
            `SELECT * FROM transactions 
             WHERE deleteon=? and branch=? and date between ? and ? 
             ORDER by date asc, fromm asc`,
            ['0000-00-00', userToken.site, from, to]
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
function generateHTMLData(results, openingBalance = {opening_cash: 0, opening_bank: 0}) {
    let htmlContent = '';
    let total_receiptc = 0;
    let total_receiptb = 0;
    let total_paymentb = 0;
    let total_paymentc = 0;
    let date = "";
    
    // Add opening balance row
    htmlContent += `
        <tr class="opening-balance">
            <td colspan="3">Opening Balance</td>
            <td class='right-align'>${backendController.money(Math.max(0, openingBalance.opening_cash), 0, 1)}</td>
            <td class='right-align'>${backendController.money(Math.max(0, openingBalance.opening_bank), 0, 1)}</td>
            <td class='right-align'>${backendController.money(Math.abs(Math.min(0, openingBalance.opening_cash)), 0, 1)}</td>
            <td class='right-align'>${backendController.money(Math.abs(Math.min(0, openingBalance.opening_bank)), 0, 1)}</td>
        </tr>
    `;
    
    // Initialize running totals with opening balance
    let running_cash = parseInt(backendController.valNum(openingBalance.opening_cash));
    let running_bank = parseInt(backendController.valNum(openingBalance.opening_bank));

    results.forEach(item => {
        sno++;
        const entryDate = backendController.rawDateFormat(item.date, 'dmy');
        
        if(date !== entryDate) {
            date = entryDate;
            htmlContent += `<tr class="date-row"><td colspan='7'>${date}</td></tr>`;
        }

        let paymentc = 0;
        let receiptc = 0;
        let paymentb = 0;
        let receiptb = 0;

        if(item.type === "receivable" || item.type === "payment") {
            paymentc = item.cash;
            paymentb = item.bank;
        } else {
            receiptc = item.cash;
            receiptb = item.bank;
        }

        total_receiptc += receiptc;
        total_receiptb += receiptb;
        total_paymentb += paymentb;
        total_paymentc += paymentc;

        htmlContent += `
            <tr>
                <td>${sno}</td>
                <td>${backendController.caps(item.fromm)}</td>
                <td>${item.id}</td>
                <td class='right-align'>${backendController.money(receiptc, 0, 1)}</td>
                <td class='right-align'>${backendController.money(receiptb, 0, 1)}</td>
                <td class='right-align'>${backendController.money(paymentc, 0, 1)}</td>
                <td class='right-align'>${backendController.money(paymentb, 0, 1)}</td>
            </tr>
        `;
    });
    const closing_c = parseInt(running_cash) + parseInt(total_receiptc - total_paymentc);
    const closing_b = parseInt(running_bank) + parseInt(total_receiptb - total_paymentb);
    // Add totals row
    htmlContent += `
        [tdfooter]
        <tr class="total-row">
            <td colspan='3'>Period Total</td>
            <td class='right-align'>${backendController.money(total_receiptc, 0, 1)}</td>
            <td class='right-align'>${backendController.money(total_receiptb, 0, 1)}</td>
            <td class='right-align'>${backendController.money(total_paymentc, 0, 1)}</td>
            <td class='right-align'>${backendController.money(total_paymentb, 0, 1)}</td>
        </tr>
        <tr class="closing-balance">
            <td colspan='3'>Closing Balance</td>
            <td class='right-align'>${backendController.money(closing_c, 0, 1)}</td>
            <td class='right-align'>${backendController.money(closing_b, 0, 1)}</td>
            <td class='right-align'></td>
            <td class='right-align'></td>
        </tr>
    `;
    
    sno = 0;
    return htmlContent;
}

module.exports = router;