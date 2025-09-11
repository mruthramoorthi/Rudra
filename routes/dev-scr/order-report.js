const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const router = express.Router();
const { jsPDF } = require("jspdf");
const { all } = require("./order-report");
const autoTable = require("jspdf-autotable").default;

router.post("/pdf", async (req, res) => {
    const { fdate, todate, decide } = req.body;

    try {
        // Fetch data from the database
        const results = await backendController.selectQuery(
            `SELECT * FROM placed_orders where deleteon=? and branch=? and orderdate between ? and ? order by uniqueid desc`,
            ['0000-00-00', userToken.site, fdate, todate]
        );

        // Create a new PDF document
        const doc = new jsPDF({
            orientation: "landscape", // "portrait" or "landscape"
            unit: "mm",               // Measurement unit (mm)
            format: "a4",             // Set format to A4
        });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        // Top Left Corner: From and To Dates
        doc.text(`${fdate} - ${todate}`, 10, 10);
        // Add the heading "Placed Orders Report"
        doc.setFontSize(16);
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;
        doc.text("Placed Orders Report", centerX, 10, { align: "center" });

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
            const order = results[i];

            // Fetch allocation details for each order
            const allot = await backendController.selectQuery(
                `SELECT * FROM order_allotment WHERE deleteon=? AND branch=? AND orderid=? AND uniquekey=?`,
                ['0000-00-00', userToken.site, order.orderid, order.uniqueid]
            );

            let smith = "No Smith";
            let cdate = backendController.getCurrentDate(); // Current date (default)
            let ddate = backendController.rawDateFormat(order.deliverydate, 'ymd', "-"); // Default delivery date

            // If the allocation exists, get dealer details
            if (allot[0]) {
                if (decide === "2") continue; // Skip if decide is "2" and allocation exists

                // Get dealer details if available
                const dealer = await backendController.selectQuery(
                    `SELECT dealername, code FROM dealers WHERE deleteon=? AND branch=? AND code=?`,
                    ['0000-00-00', userToken.site, allot[0].dealer]
                );
                smith = dealer[0].code;
                ddate = backendController.rawDateFormat(allot[0].dealerdelivery, "ymd", "-");
                cdate = backendController.rawDateFormat(allot[0].customerdelivery, "ymd", "-");
            } else {
                // If no allocation exists, decide whether to include the order
                if (decide === "1") continue; // Skip if decide is "1" and allocation does not exist
            }

            sno++;
            const entryDate = backendController.rawDateFormat(order.orderdate, 'dmy');
            const jewelDetails = `${backendController.caps(order.category)} - ${backendController.caps(order.jeweltype)} (${backendController.caps(order.subtype)})`;

            // Calculate totals
            let totalPcs = parseFloat(order.pcs) || 0;
            let totalWt = parseFloat(order.wt) || 0;
            let totalAmount = (parseInt(order.advance_cash) || 0) +
                              (parseInt(order.advance_bank) || 0) +
                              (parseInt(order.old_amount) || 0) +
                              (parseInt(order.pure_amount) || 0) +
                              (parseInt(order.ex_amount) || 0) +
                              (parseInt(order.coin_amount) || 0);
            let totalNet = parseFloat(order.nettotal) || 0;

            filteredRows.push([
                sno, 
                backendController.caps(order.orderid), 
                backendController.caps(order.name), 
                jewelDetails, 
                backendController.money(totalPcs, 0, 1), 
                backendController.money(totalWt, 3, 1), 
                entryDate, 
                smith,
                backendController.rawDateFormat(ddate,"dmy"), 
                backendController.rawDateFormat(cdate, "dmy")
            ]);
        }

        // Set table columns
        const columns = ["#", "Order ID", "Name", "Jewel Details", "Pieces", "Weight", "Date", "Smith", "D date", "C date"];

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
                3: { halign: 'left' }, // Jewel details
                4: { halign: 'right' }, // Pieces
                5: { halign: 'right' }, // Weight
                6: { halign: 'center' }, // Date
                8: { halign: 'right' }, // Amount
                9: { halign: 'right' }, // Net Total
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


router.post("/select", async (req, res) => {
    const {datas} = req.body;
    const fdate = datas.fdate;
    const todate = datas.todate;
    const decide = datas.decide;
    try{
        const totalRecode = await backendController.selectQuery(
            `SELECT count(*) as total FROM placed_orders where deleteon=? and branch=? and orderdate between ? and ?`,
            ['0000-00-00', userToken.site,fdate, todate]
        );
        
        const results = await backendController.selectQuery(
            `SELECT * FROM placed_orders where deleteon=? and branch=? and orderdate between ? and ? order by uniqueid desc`,
            ['0000-00-00', userToken.site,fdate, todate]
        );

        const html = await generateHTMLData(results,decide);
        res.json({ 
            success: true, 
            response: html, 
            total: totalRecode[0].total, 
            msg: "ok" 
        });
    }
    catch(error){
        console.error('Error:', error);
        res.status(500).json({ success: false, msg: "Server Error" });
    }
});

let sno = 0;
async function generateHTMLData(groupedResults, decide) {
    let htmlContent = '';
    let orders = "";
    let classes = "";
    let prevContent = "";
    for (let i = 0; i < groupedResults.length; i++) {
        const order = groupedResults[i];
        if(orders!=order.orderid)
        {
            classes = "exchange-lis";
            orders = order.orderid;
            htmlContent += prevContent;
        }
        else{
            classes="";
        }
        sno++;
        const entryDate = backendController.rawDateFormat(order.orderdate, 'dmy');
        const allot = await backendController.selectQuery(`select * from order_allotment where deleteon=? and branch=? and orderid=? and uniquekey=?`, ['0000-00-00', userToken.site, order.orderid, order.uniqueid]);
        // Generate jewel details HTML for all items in this order
        let jewelDetails = '';
        let totalWt = 0;
        let totalPcs = 0;
        let totalAmount = 0;
        let totalNet = 0;
        let smith = "nd:Smith";
        let cdate =  backendController.getCurrentDate();
        let ddate = backendController.rawDateFormat(order.deliverydate, 'ymd', "-");
        if(allot[0])
        {
            if(decide=="2")
                continue;
            const dealer = await backendController.selectQuery(`select dealername,code from dealers where deleteon=? and branch=? and code=?`, ['0000-00-00', userToken.site, allot[0].dealer]);
            smith = dealer[0].code+":"+backendController.caps(dealer[0].dealername)+",nd:Smith";
            ddate = backendController.rawDateFormat(allot[0].dealerdelivery,"ymd","-");
            cdate = backendController.rawDateFormat(allot[0].customerdelivery,"ymd","-");
        }
        else
        {
            if(decide=="1")
                continue;
        }
        jewelDetails += `
            <div class="jewel-item">
                ${backendController.caps(order.category)} - 
                ${backendController.caps(order.jeweltype)} (
                ${backendController.caps(order.subtype)} )
            </div>`;
    
        totalWt += parseFloat(order.wt) || 0;
        totalPcs += parseFloat(order.pcs) || 0;
        totalAmount = (parseInt(order.advance_cash) || 0) +
                      (parseInt(order.advance_bank) || 0) +
                      (parseInt(order.old_amount) || 0) +
                      (parseInt(order.pure_amount) || 0) +
                      (parseInt(order.ex_amount) || 0) +
                      (parseInt(order.coin_amount) || 0);
        totalNet = parseFloat(order.nettotal) || 0;

        htmlContent += `
            <tr class='${classes}'>
                <td>${sno}</td>
                <td>${backendController.caps(order.orderid)}</td>
                <td>${backendController.caps(order.name)}<br>${order.phone}</td>
                <td>
                    ${jewelDetails}
                </td>
                <td class='right-align'>${backendController.money(totalPcs, 0, 1)}</td>
                <td class='right-align'>${backendController.money(totalWt, 3, 1)}</td>
                <td>${entryDate}</td>
                <td class='right-align'>${backendController.money(totalAmount, 3, 1)}</td>
                <td class='right-align'>${backendController.money(totalNet, 0, 1)}</td>
                <td>${htmls.selectBoxes({ id: "smith" + sno, options: smith, classes: "smiths" })}</td>
                <td>${htmls.createInputElement({ id: "smithddate" + sno, type: "date", placeholder: "D Delivery", value: ddate })}</td>
                <td>${htmls.createInputElement({ id: "smithcdate" + sno, type: "date", placeholder: "C Delivery", value: cdate })}</td>
                <td><button type='button' class='assign-btn' id='assign${sno}'>Assign</button></td>
                <input type='hidden' id='orderid${sno}' name='orderid${sno}' value='${order.orderid}'>
                <input type='hidden' id='ordercode${sno}' name='ordercode${sno}' value='${order.ordercode}'>
                <input type='hidden' id='unique${sno}' name='unique${sno}' value='${order.uniqueid}'>
            </tr>`;
            prevContent = `<tr id='exchange${sno}' class='exchange-li'>
                <td colspan='13'>
                    Old Wt : ${order.old_weight} | Waste : ${order.old_waste} | Amount : ${order.old_amount}<br>
                    Pure Wt : ${order.pure_weight} | Amount : ${order.pure_amount}<br>
                    Ex Wt : ${order.exchange_weight} | Amount : ${order.ex_amount}<br>
                    Coin Wt : ${order.coin_weight} | Amount : ${order.coin_amount}<br>
                </td>
            </tr>`;
    }   
    sno = 0;
    return htmlContent;
}

router.post("/allot", async (req, res) => {
    const { orderid, ordercode, smith, smithdate, customerdate,unique } = req.body;
    try{
        await backendController.deleted({ body : {'tableName' :'order_allotment', 'whereCondition': `orderid=? and uniquekey=?`,'values':[orderid,unique]}});
        const insert = await backendController.insert({body: {tableName:"order_allotment", data: {orderid, ordercode, dealer:smith, dealerdelivery:smithdate, customerdelivery:customerdate,uniquekey:unique}}});
        if(insert.success)
            return res.json({success:true, msg_type:"success", msg:backendController.allCaps(orderid)+" Order Allotted Successfully..."});
        else
            return res.json({success:false, msg_type:"error", msg:"Allotment Not Valid"});
    }
    catch(e){
        return res.json({success:false, msg_type:"error", msg:"Allotment Not Valid"});
    }
});

router.get("/smith", async (req, res) => {
    backendController.selectQuery(`SELECT distinct code,dealername FROM dealers where deleteon=? and branch=? order by dealername asc`,['0000-00-00',userToken.site])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['code']}">${backendController.caps(item['dealername'])}</option>`);
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