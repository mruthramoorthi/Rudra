const express = require("express");
const backendController = require('../../controllers/backend-functions');
const router = express.Router();
const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default;

router.post("/pdfReport", async (req, res) => {
    const { from, to } = req.body;
    try {
        // Fetch data from the database
        const deposits = await backendController.selectQuery(
            "SELECT * FROM customers_deposit WHERE deleteon=? AND branch=? AND bonddate BETWEEN ? AND ?", 
            ["0000-00-00", userToken.site, from, to]
        );

        // Create a new PDF document with A4 size
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        // Add the heading
        doc.setFontSize(16);
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;
        doc.text("Deposit Report", centerX, 15, { align: "center" });

        // Add date range information
        doc.setFontSize(10);
        doc.text(`From: ${backendController.rawDateFormat(from, 'dmy')} To: ${backendController.rawDateFormat(to, 'dmy')}`, 15, 10);

        // Add the current date and time to the top-right corner
        const currentDate = new Date();
        const dateString = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;
        doc.setFontSize(10);
        doc.text(dateString, pageWidth - 15, 10, { align: "right" });

        // Prepare the table data
        const columns = [
            "#",
            "ID",
            "Date",
            "Maturity",
            "Customer",
            { content: "Amount", styles: { halign: 'right' } },
            { content: "Total", styles: { halign: 'right' } },
            { content: "Purchased", styles: { halign: 'right' } },
            { content: "Avail", styles: { halign: 'right' } }
        ];

        // Initialize totals
        let grandTotal = {
            amount: 0,
            depositGram: 0,
            purchaseGram: 0,
            availableGram: 0
        };

        // Prepare rows with both raw and formatted values
        const rows = deposits.map((item, index) => {
            const rawAmount = parseFloat(item.depositamount) || 0;
            const rawDepositGram = parseFloat(item.depositgram) || 0;
            const rawPurchaseGram = parseFloat(item.purchase_gram) || 0;
            const rawAvailableGram = parseFloat(item.available_gram) || 0;
            
            // Add to grand totals
            grandTotal.amount += rawAmount;
            grandTotal.depositGram += rawDepositGram;
            grandTotal.purchaseGram += rawPurchaseGram;
            grandTotal.availableGram += rawAvailableGram;

            return [
                index + 1,
                item.depositid,
                backendController.rawDateFormat(item.bonddate, 'dmy'),
                backendController.rawDateFormat(item.maturity_date, 'dmy'),
                `${backendController.caps(item.name)}, ${item.phone}`,
                { content: backendController.money(rawAmount, 0, 1), styles: { halign: 'right' } },
                { content: backendController.money(rawDepositGram, 3, 1), styles: { halign: 'right' } },
                { content: backendController.money(rawPurchaseGram, 3, 1), styles: { halign: 'right' } },
                { content: backendController.money(rawAvailableGram, 3, 1), styles: { halign: 'right' } }
            ];
        });

        // Add the table to the PDF
        autoTable(doc, {
            head: [columns],
            body: rows,
            startY: 20,
            headStyles: { 
                fillColor: [220, 220, 220],
                textColor: [0, 0, 0],
                fontStyle: 'bold'
            },
            styles: {
                fontSize: 9,
                cellPadding: 3,
                overflow: 'linebreak'
            },
            margin: { left: 10, right: 10 }
        });

        // Add Grand Total
        autoTable(doc, {
            body: [[
                '', '', '', '', 'Grand Total',
                { content: backendController.money(grandTotal.amount, 0, 1), styles: { fontStyle: 'bold', halign: 'right' } },
                { content: backendController.money(grandTotal.depositGram, 3, 1), styles: { fontStyle: 'bold', halign: 'right' } },
                { content: backendController.money(grandTotal.purchaseGram, 3, 1), styles: { fontStyle: 'bold', halign: 'right' } },
                { content: backendController.money(grandTotal.availableGram, 3, 1), styles: { fontStyle: 'bold', halign: 'right' } }
            ]],
            startY: doc.lastAutoTable.finalY + 10,
            styles: { 
                fontSize: 9,
                cellPadding: 3
            },
            margin: { left: 10, right: 10 }
        });

        // Generate PDF as a buffer
        const pdfBuffer = doc.output("arraybuffer");

        // Set the headers to serve the PDF
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename=deposit_report_${from}_to_${to}.pdf`);
        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).send("Error generating PDF.");
    }
});

router.post("/select", async (req, res) => {
    const {datas} = req.body;
    const from = datas.from;
    const to = datas.to;
    try
    {
        // const results = await backendController.selectQuery(`SELECT t1.account_name as accs,t2.name as name,t2.entity_type as entype,t1.uniqueid as uniqueid,t2.uniqueid as uniqueid2 FROM chart_of_accounts as t1 join entities as t2 on t1.uniqueid=t2.account_id where t1.deleteon=? and t2.deleteon=? and t1.branch=? and t2.branch=?`,['0000-00-00','0000-00-00',userToken.site,userToken.site]);
        const results = await backendController.selectQuery(`SELECT * FROM customers_deposit where deleteon=? and branch=? and bonddate between ? and ?`,['0000-00-00',userToken.site, from, to]);
        const totalRows = await backendController.selectQuery(`SELECT count(*) as total FROM customers_deposit where deleteon=? and branch=? and bonddate between ? and ?`,['0000-00-00',userToken.site, from, to]);
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
                    edit_and_delete += `<img src="/images/print.png" width="25" height="25" class="print-iconi" title="" id="print-user${item.depositid}" deposit="${item.depositid}" datas='${JSON.stringify(item)}'/>`;
                }
            edit_and_delete += `</div>`;
            sno++;
        
            htmlContent += `<tr><td>${sno}</td><td>${item.depositid}</td><td>${backendController.rawDateFormat(item.bonddate,'dmy')}</td><td>${backendController.rawDateFormat(item.maturity_date,'dmy')}</td><td>${backendController.caps(item.name)}<br>${item.phone}<br>${backendController.caps(item.address)}</td><td class='right-align'>${item.depositamount}</td><td class='right-align'>${item.depositgram}</td><td class='right-align'>${item.purchase_gram}</td><td class='right-align'>${item.available_gram}</td><td>${edit_and_delete}</td></tr>`;
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