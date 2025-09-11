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
        autoTable(doc, {
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

router.get("/loadDistrict", async (req, res) => {
    backendController.selectQuery(`SELECT distinct districtname FROM maps where deleteon=? order by districtname`,['0000-00-00'])
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
    try{
        const results = await backendController.selectQuery(
            `SELECT DISTINCT counter, metal, category, jeweltype, sum(weight) as weight, sum(pcs) as pcs FROM dealer_purchase where deleteon=? and branch=? and date<=? group by counter, jeweltype, metal, category ORDER BY uniqueid DESC`,
            ['0000-00-00', userToken.site, fdate]
        );
        console.log(results)
        const html = await generateHTMLData(results);
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
async function generateHTMLData(groupedResults) {
    let htmlContent = '';
    for (let k = 0; k < groupedResults.length; k++) {
        const tagger = await backendController.selectQuery(`SELECT DISTINCT subtype, sum(weight) as weight, sum(pcs) as pcs FROM tagged_jewels where deleteon=? and branch=? and jeweltype=? and solddate=? group by counter, jeweltype, category ORDER BY uniqueid DESC`, ['0000-00-00', userToken.site, groupedResults[k].jeweltype,'0000-00-00']);
        let allWeight = groupedResults[k].weight;
        let allPcs = groupedResults[k].pcs;
        if(tagger.length>0)
        {
            for (let j = 0; j < tagger.length; j++) {
                sno++;
                htmlContent += `
                <tr>
                    <td>${sno}</td>
                    <td>${backendController.caps(groupedResults[k].counter)}</td>
                    <td>${backendController.caps(groupedResults[k].category)}</td>
                    <td>${backendController.caps(groupedResults[k].jeweltype)}</td>
                    <td>${backendController.caps(tagger[j].subtype)}</td>
                    <td class='right-align'>${backendController.money(tagger[j].weight,3,1)}</td>
                    <td class='right-align'>${backendController.money(tagger[j].pcs,3,1)}</td>
                </tr>`;
                allWeight -= tagger[j].weight;
                allPcs -= tagger[j].pcs;
            }
        }
        sno++;
        htmlContent += `
            <tr>
                <td>${sno}</td>
                <td>${backendController.caps(groupedResults[k].counter)}</td>
                <td>${backendController.caps(groupedResults[k].category)}</td>
                <td>${backendController.caps(groupedResults[k].jeweltype)}</td>
                <td>${backendController.caps(groupedResults[k].subtype)}</td>
                <td class='right-align'>${backendController.money(allWeight,3,1)}</td>
                <td class='right-align'>${backendController.money(allPcs,3,1)}</td>
            </tr>`;
    }
    let total = sno;    
    sno = 0;
    return { html: htmlContent, total: total };
}

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
            options_arr.push(`<option value="${item['code']}">${item['jeweltype']}</option>`);
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