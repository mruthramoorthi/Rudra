const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const { body } = require("express-validator");
const router = express.Router();
const axios = require('axios');
const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default;

// Route to generate and serve PDF
router.post("/pdf", async (req, res) => {
    const { id } = req.body;
    try {
        // Fetch data from the database
        const purchase = await backendController.selectQuery("select * from placed_orders where deleteon=? and branch=? and orderid=?", ["0000-00-00",userToken.site,id]);
        
        // Create a new PDF document with A4 size
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });
    
        // Company details
        const companyName = "Your Company Name";
        const companyAddress = "123 Business Street, City - 123456";
        const contactDetails = "Phone: 9876543210 | Email: contact@company.com";
        const gstNumber = "GSTIN: 22AAAAA0000A1Z5";
    
        // Get the page width and calculate the center
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;
    
        // Add company name (1st line - centered)
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(companyName, centerX, 10, { align: "center" });
    
        // Add company address (2nd line - centered)
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(companyAddress, centerX, 16, { align: "center" });
    
        // Add contact details (3rd line - centered)
        doc.text(contactDetails, centerX, 20, { align: "center" });
    
        // Add GST number (4th line - centered)
        doc.text(gstNumber, centerX, 24, { align: "center" });
    
        // Customer details and date/gold rate
        const customerName = "Customer: John Doe";
        const customerNumber = "Phone: 9876543210";
        const currentDate = backendController.rawDateFormat(purchase[0].orderdate,'dmy');
        const dateString = `Date: ${currentDate}`;
        const goldRate = "Gold Rate: 5,000";
    
        // Add customer name (left corner)
        doc.text(customerName, 15, 30);
    
        // Add customer number below customer name
        doc.text(customerNumber, 15, 34);
    
        // Add date and gold rate (right corner)
        doc.text(dateString, pageWidth - 15, 30, { align: "right" });
        doc.text(goldRate, pageWidth - 15, 34, { align: "right" });
    
        // Add a horizontal line to separate header from content
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(15, 38, pageWidth - 15, 38);
    
        const fetchImage = async (url) => {
            try {
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                return response.data; // Returns raw image buffer (no Base64 needed)
            } catch (error) {
                console.error("Error loading image:", error);
                return null;
            }
        };

        // Prepare the data for the table
        const filteredRows = purchase.map((row, index) => {
            // Calculate waste value based on type

            let wasteValue;
            if (row.wastetype === 'perc') {
                wasteValue = backendController.money(row.wasteperc, 0, 1) + '%';
            } else if (row.wastetype === 'amt') {
                // Calculate waste amount per gram if weight is available
                const wasteAmt = row.wt ? (row.wasteamt / row.wt) : 0;
                wasteValue = backendController.money(wasteAmt, 0, 1);
            } else {
                wasteValue = '-';
            }
        
            // Calculate MC value based on type
            let mcValue;
            if (row.mctype === 'perc') {
                mcValue = backendController.money(row.mcperc, 0, 1) + '%';
            } else if (row.mctype === 'amt') {
                // Calculate MC amount per gram if weight is available
                const mcAmt = row.wt ? (row.mcamt / row.wt) : 0;
                mcValue = backendController.money(mcAmt, 0, 1);
            } else {
                mcValue = '-';
            }
            
            return [
                index + 1, 
                "", 
                backendController.caps(row.category+" - "+row.jeweltype), 
                backendController.money(row.pcs, 0, 1), 
                backendController.money(row.wt, 0, 1),
                wasteValue,  // Shows either percentage or amount/weight for waste
                mcValue,     // Shows either percentage or amount/weight for MC
                backendController.money(row.stonetype, 0, 1), 
                backendController.money(row.jewelprice, 0, 1), 
            ];
        });
    
        const columns = ["#", "Photo", "Jewel", "Pieces", "Weight", "Waste", "MC", "Stone", "Cash"];
        
        const totalAmountInWords = backendController.numberToWords(purchase[0].nettotal);
    
        // Add the table to the PDF
        autoTable(doc, {
            head: [columns],
            body: filteredRows,
            startY: 40,
            headStyles: {
                halign: 'center',
                fontSize: 13,
                textColor: [255, 255, 255],
                fillColor: [0, 0, 0]
            },
            columnStyles: {
                1: { halign: 'center' },
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right' },
                6: { halign: 'right' },
                7: { halign: 'right' },
                8: { halign: 'right' },
            },
            didDrawPage: (data) => {
                const finalY = data.cursor.y;
                let currentY = finalY + 5;  // Increased initial spacing
                
                // Prepare exchange details lines
                const exchangeLines = [];
                const lineHeight = 6;  // Define a fixed line height
                
                if (purchase[0].gst > 0) {
                    exchangeLines.push(
                        `GST - ${purchase[0].gst}% = ${backendController.money(purchase[0].gstamount,0,1)}`
                    );
                }

                if (purchase[0].gst > 0) {
                    exchangeLines.push(
                        `Grand total = ${backendController.money(purchase[0].grand_amount,0,1)}`
                    );
                }

                // Cash Advance
                if (purchase[0].advance_cash > 0) {
                    exchangeLines.push(
                        `Cash Advance = - ${backendController.money(purchase[0].advance_cash,0,1)}`
                    );
                }
                
                // Bank Advance
                if (purchase[0].advance_bank > 0) {
                    exchangeLines.push(
                        `Bank Advance = - ${backendController.money(purchase[0].advance_bank,0,1)}`
                    );
                }
                
                // Old Jewel
                if (purchase[0].old_weight > 0) {
                    const oldWaste = purchase[0].old_waste || 0;
                    const oldRate = purchase[0].old_weight ? (purchase[0].old_amount / purchase[0].old_weight) : 0;
                    const oldNetWeight = purchase[0].old_weight - oldWaste;
                    const oldCalculatedAmt = oldNetWeight * oldRate;
                    
                    exchangeLines.push(
                        `Old  ${backendController.money(purchase[0].old_weight,0,1)}g - ${backendController.money(oldWaste,0,1)}g * ${backendController.money(oldRate,0,1)} = - ${backendController.money(oldCalculatedAmt,0,1)}`
                    );
                }
                
                // Exchange Amount
                if (purchase[0].ex_amount > 0) {
                    exchangeLines.push(
                        `Exchange wt ${backendController.money(purchase[0].ex_weight,0,1)}g = - ${backendController.money(purchase[0].ex_amount,0,1)}`
                    );
                }
                
                // Pure
                if (purchase[0].pure_weight > 0) {
                    const pureRate = purchase[0].pure_weight ? (purchase[0].pure_amount / purchase[0].pure_weight) : 0;
                    exchangeLines.push(
                        `Pure ${backendController.money(purchase[0].pure_weight,0,1)}g * ${backendController.money(pureRate,0,1)} = - ${backendController.money(purchase[0].pure_amount,0,1)}`
                    );
                }
                
                // Coin
                if (purchase[0].coin_weight > 0) {
                    const coinRate = purchase[0].coin_weight ? (purchase[0].coin_amount / purchase[0].coin_weight) : 0;
                    exchangeLines.push(
                        `Coin ${backendController.money(purchase[0].coin_weight,0,1)}g * ${backendController.money(coinRate,0,1)} = - ${backendController.money(purchase[0].coin_amount,0,1)}`
                    );
                }

                if (purchase[0].gst > 0) {
                    exchangeLines.push(
                        `Net Total = ${backendController.money(purchase[0].afterreduction,0,1)}`
                    );
                }

                if (purchase[0].gst > 0) {
                    exchangeLines.push(
                        `Round Off = ${backendController.money(purchase[0].roundoff,0,1)}`
                    );
                }
                
                // Add exchange details lines
                if (exchangeLines.length > 0) {
                    exchangeLines.forEach((line, index) => {
                        doc.setFontSize(10);
                        doc.setFont("helvetica", "normal");
                        doc.text(line, pageWidth - 16, currentY, { align: "right" });
                        currentY += lineHeight;  // Use fixed line height
                    });
                    currentY += 4;  // Additional spacing after the block
                }
                
                // Add total amount in numbers
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.text(`Total Amount: ${backendController.money(purchase[0].nettotal,0,1)}`, pageWidth - 16, currentY, { align: "right" });
                
                // Add total amount in words
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.text(`(${totalAmountInWords})`, pageWidth - 16, currentY + lineHeight, { align: "right" });
                
                // Calculate due date
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 7);
                const dueDateString = dueDate.toLocaleDateString();
                
                // Add payment reminder
                doc.setFontSize(10);
                doc.text(`Please pay the balance before ${dueDateString}`, centerX, currentY + (lineHeight * 2.5), { align: "center" });
                
                // Add thank you message
                doc.text("Thank you for your purchase!", centerX, currentY + (lineHeight * 3.5), { align: "center" });
            }
        });

        // **Step 4: Manually Add Images After Table is Drawn**
        const table = doc.lastAutoTable; // Get the generated table
        const imgUrl = 'https://cdn-icons-png.flaticon.com/512/263/263399.png';
        
        const imagePromises = purchase.map(async (row, i) => {
            const photoCell = table.body[i].cells[1];
            const dynamicUrl = row.jewelphoto ? `http://localhost:5000${row.jewelphoto.replace("[pics~pics]","")}` : imgUrl;
            
            try {
              const imgBuffer = await fetchImage(dynamicUrl);
              if (imgBuffer) {
                doc.addImage(
                  imgBuffer,
                  'PNG',
                  photoCell.x + (photoCell.width - 5)/2,
                  photoCell.y + (photoCell.height - 5)/2,
                  5,
                  5
                );
              }
            } catch (error) {
              console.error(`Error processing image for row ${i}:`, error);
            }
          });
          
          await Promise.all(imagePromises);
    
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
        `SELECT count(*) as total FROM placed_orders where deleteon=? and branch=?`,
        ['0000-00-00', userToken.site]
    );
    
    backendController.selectQuery(
        `SELECT * FROM placed_orders where deleteon=? and branch=? order by uniqueid desc`,
        ['0000-00-00', userToken.site]
    )
    .then(results => {
        // Group results by orderid
        const groupedResults = groupByOrderId(results);
        const html = generateHTMLData(groupedResults);
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

// Helper function to group records by orderid
function groupByOrderId(results) {
    const grouped = {};
    
    results.forEach(item => {
        if (!grouped[item.orderid]) {
            grouped[item.orderid] = {
                orderid: item.orderid,
                name: item.name,
                phone: item.phone,
                entryDate: item.orderdate,
                deliverydate: item.deliverydate,
                items: []
            };
        }
        
        grouped[item.orderid].items.push({
            category: item.category,
            jeweltype: item.jeweltype,
            subtype: item.subtype,
            wt: item.wt,
            pcs: item.pcs,
            advance_cash: item.advance_cash,
            advance_bank: item.advance_bank,
            old_amount: item.old_amount,
            pure_amount: item.pure_amount,
            ex_amount: item.ex_amount,
            coin_amount: item.coin_amount,
            nettotal: item.nettotal
        });
    });
    
    return Object.values(grouped);
}

let sno = 0;
function generateHTMLData(groupedResults) {
    let htmlContent = '';
    
    groupedResults.forEach(order => {
        sno++;
        const entryDate = backendController.rawDateFormat(order.entryDate,'dmy');
        const deliverydate = backendController.rawDateFormat(order.deliverydate,'dmy');
        
        // Generate jewel details HTML for all items in this order
        let jewelDetails = '';
        let totalWt = 0;
        let totalPcs = 0;
        let totalAmount = 0;
        let totalNet = 0;
        
        order.items.forEach(item => {
            jewelDetails += `
                <div class="jewel-item">
                    ${backendController.caps(item.category)} -
                    ${backendController.caps(item.jeweltype)} ( 
                    ${backendController.caps(item.subtype)} ) 
                </div>`;
            
            totalWt += parseFloat(item.wt) || 0;
            totalPcs += parseFloat(item.pcs) || 0;
            totalAmount = (parseInt(item.advance_cash) || 0) + 
                          (parseInt(item.advance_bank) || 0) + 
                          (parseInt(item.old_amount) || 0) + 
                          (parseInt(item.pure_amount) || 0) + 
                          (parseInt(item.ex_amount) || 0) + 
                          (parseInt(item.coin_amount) || 0);
            totalNet = parseFloat(item.nettotal) || 0;
        });
        
        let edit_and_delete = `<div class='flex-with-space-edit-delete'>
            <img src="/images/print.png" width="25" height="25" class="print-iconi" title="" id="print-order${order.orderid}" purchase="${order.orderid}" datas='${JSON.stringify(order)}'/>
            <img src="/images/edit.png" width="25" height="25" class="edit-iconi" title="" id="edit-order${order.orderid}" uniquekey="${order.orderid}" datas='${JSON.stringify(order)}'/>
            <img src="/images/delete.png" class="delete-iconi" title="" width="25" height="25" id="delete-order${order.orderid}" uniquekey="${order.orderid}" datas='${JSON.stringify(order)}'/>
        </div>`;
        
        htmlContent += `
            <tr>
                <td>${sno}</td>
                <td>${backendController.caps(order.orderid)}</td>
                <td>${backendController.caps(order.name)}<br>${order.phone}</td>
                <td>
                    ${jewelDetails}
                </td>
                <td class='right-align'>${backendController.money(totalPcs,0,1)}</td>
                <td class='right-align'>${backendController.money(totalWt,3,1)}</td>
                <td>${entryDate}</td>
                <td>${deliverydate}</td>
                <td class='right-align'>${backendController.money(totalAmount,3,1)}</td>
                <td class='right-align'>${backendController.money(totalNet,0,1)}</td>
                <td>${edit_and_delete}</td>
            </tr>`;
    });
    
    sno = 0;
    return htmlContent;
}

router.post('/edit',async (req, res) => {
    const { uniquekey } = req.body;
    const orders = await backendController.selectQuery(`SELECT * FROM placed_orders where deleteon=? and branch=? and orderid=? order by uniqueid desc`,['0000-00-00', userToken.site, uniquekey]);
    let ids = "";
    let html="";
    const ex = await backendController.selectQuery(`SELECT * FROM exchanges where deleteon=? and branch=? and id=? and category=? order by uniqueid desc`,['0000-00-00', userToken.site, uniquekey, 'order']);
    // console.log();
    for(let b=0; b<orders.length; b++)
    {
        const addid = backendController.generateUniqueId();
        ids += addid+"[s~1]";
        const control = await backendController.selectQuery(`SELECT * FROM jewel_master_control where deleteon=? and branch=? and category=? and jeweltype=? and subtype=? and minweight<=? and maxweight>=?`,['0000-00-00',userToken.site,orders[b].category,orders[b].jeweltype,orders[b].subtype,parseFloat(orders[b].wt/orders[0].pcs),parseFloat(orders[b].wt/orders[0].pcs)]);
        let stone_type = orders[b].stonetype.split("[s~1]");
        let stone_count = orders[b].stonecount.split("[s~1]");
        let stone_weight = orders[b].stoneweight.split("[s~1]");
        let stone_price = orders[b].stoneprice.split("[s~1]");
        let stone_carat_size = orders[b].caratsize.split("[s~1]");
        let stone_carat_price = orders[b].caratprice.split("[s~1]");
        let stone_total_price = orders[b].totalstoneprice;
        let stone_total_weight = orders[b].totalstoneweight;
        let stone_html = '';
        if(stone_type[0])
            for (let i=0;i<stone_type.length-1;i++)
                stone_html += `<label>${backendController.caps(stone_type[i])} (${stone_weight[i]}.G = ${backendController.money(stone_price[i],0,1)}) [${stone_carat_size[i]}.ct X ${backendController.money(stone_carat_price[i],0,1)}] = ${backendController.money(stone_total_price,0,1)}</label>`;
        const weight = backendController.valNum(orders[b].wt) - backendController.valNum(stone_total_weight);
        let rate = 0;
        let jewel_rate = 0;
        if(control[0].spltype!='nd' && control[0].spltype)
        {
            rate = control[0].splprice;
            if(control[0].spltype=="gram")
            jewel_rate = parseFloat(backendController.valNum(rate)) * parseFloat(backendController.valNum(weight));
            else
            jewel_rate = parseFloat(backendController.valNum(rate));
        }
        else
        {
            rate = orders[b].rate;
            jewel_rate = parseFloat(backendController.valNum(rate)) * parseFloat(backendController.valNum(weight));
        }
        const jewel_raw_Amount = parseFloat(backendController.valNum(jewel_rate));
        let min_w_gram = 0;
        let min_w_amount = 0;
            let min_w_perc = 0;
        if (control[0].wastetype == "perc")
        {
                min_w_perc = control[0].minwaste;
            min_w_gram = parseFloat(backendController.valNum(control[0].minwaste / 100)) * parseFloat(backendController.valNum(weight));
            min_w_amount = parseFloat(backendController.valNum(min_w_gram)) * parseFloat(backendController.valNum(rate));
        }
        else if (control[0].wastetype == "amt")
        {
            min_w_amount = parseFloat(backendController.valNum(control[0].minwaste)) * parseFloat(backendController.valNum(weight));
        }
        let max_w_gram = 0;
        let max_w_amount = 0;
        let max_w_perc = 0;
        let w_read_only = "";
        if (control[0].wastetype == "perc")
        {
            max_w_perc = control[0].maxwaste;
            max_w_gram = parseFloat(backendController.valNum(control[0].maxwaste / 100)) * parseFloat(backendController.valNum(weight));
            max_w_amount = parseFloat(backendController.valNum(max_w_gram)) * parseFloat(backendController.valNum(rate));
        }
        else if (control[0].wastetype == "amt")
        {
            w_read_only = "readonly";
            max_w_amount = parseFloat(backendController.valNum(control[0].maxwaste)) * parseFloat(backendController.valNum(weight));
        }
        let min_mc_gram = 0;
        let min_mc_amount = 0;
        let min_mc_perc = 0;
        if (control[0].mctype == "perc")
        {
            min_mc_perc = control[0].minmc;
            min_mc_gram = parseFloat(backendController.valNum(control[0].minmc / 100)) * parseFloat(backendController.valNum(weight));
            min_mc_amount = parseFloat(backendController.valNum(min_mc_gram)) * parseFloat(backendController.valNum(rate));
        }
        else if (control[0].mctype == "amt")
        {
            min_mc_amount = parseFloat(backendController.valNum(control[0].minmc)) * parseFloat(backendController.valNum(weight));
        }
        let max_mc_gram = 0;
        let max_mc_amount = 0;
        let max_mc_perc = 0;
        let mc_read_only = "readonly";
        if (control[0].mctype == "perc")
        {
            max_mc_perc = control[0].maxmc;
            max_mc_gram = parseFloat(backendController.valNum(control[0].maxmc / 100)) * parseFloat(backendController.valNum(weight));
            max_mc_amount= parseFloat(backendController.valNum(max_mc_gram)) * parseFloat(backendController.valNum(rate));
        }
        else if (control[0].mctype == "amt")
        {
            mc_read_only = "readonly";
            max_mc_amount= parseFloat(backendController.valNum(control[0].maxmc)) * parseFloat(backendController.valNum(weight));
        }    
        const total_jewel_amount = parseFloat(stone_total_price) + parseFloat(orders[b].wasteamt) + parseFloat(orders[b].mcamt) + parseFloat(jewel_raw_Amount);
        let photo = "";
        if(orders[b].jewelphoto)
            photo = orders[b].jewelphoto.split("[pics~pics]")[1];
        let edit_and_delete = `<div class='flex-with-space-edit-delete'>
                <img src="/images/edit.png" width="25" height="25" class="edit-addJewel" title="" id="edit-addjewel_${addid}" uniquekey="${addid}"/>
                <img src="/images/delete.png" class="delete-addJewel" title="" width="25" height="25" id="edit-addjewel_${addid}" uniquekey="${addid}"/>
            </div>`;
        html += `<tr id='jewel${addid}'>
        <td>${backendController.generateImageTag(photo, 'profile', 'popup-img', 'width: 100px;border-radius: 10%;height: 100px;')}</td>
        <td>${orders[b].pcs}</td>
        <td><label>${backendController.caps(control[0].category)} - ( ${backendController.caps(control[0].code)} ) ${backendController.caps(control[0].subtype)}</label><br>
        <div class='jewels-permenent' id='jwlper_${addid}'><div class="display-f adj"><label><b>Waste</b></label>
        <input type="hidden" name="minwastep_${addid}" id="minwastep_${addid}" value="${min_w_perc}"/>
        <input type="hidden" name="minwasteg_${addid}" id="minwasteg_${addid}" value="${min_w_gram}"/>
        <input type="hidden" name="minwastea_${addid}" id="minwastea_${addid}" value="${min_w_amount}"/>
        <input type="hidden" name="maxwastep_${addid}" id="maxwastep_${addid}" value="${max_w_perc}"/>
        <input type="hidden" name="maxwasteg_${addid}" id="maxwasteg_${addid}" value="${max_w_gram}"/>
        <input type="hidden" name="maxwastea_${addid}" id="maxwastea_${addid}" value="${max_w_amount}"/>
        <div><input type="number" name="wastep_${addid}" id="wastep_${addid}" class='adj-box jwl_range_adjusters ${w_read_only}' value="${backendController.money(max_w_perc,3,0)}"/><label>.%</label></div>
        <div><input type="number" name="wasteg_${addid}" id="wasteg_${addid}" class='adj-box jwl_range_adjusters ${w_read_only}' value="${backendController.money(max_w_gram,3,0)}"/><label>.G</label></div>
        <div><input type="number" name="wastea_${addid}" id="wastea_${addid}" class='adj-box jwl_range_adjusters' value="${backendController.money(orders[b].wasteamt,3,0)}"/><label>./-</label></div></div>
        <input type='range' id="waste_${addid}" name="waste_${addid}" class='jwl_range_adjusters' step='1' ctype='${control[0].wastetype}' minwaste='${control[0].minwaste}' maxwaste='${control[0].maxwaste}' min='${min_w_amount}' max='${max_w_amount}' value='${orders[b].wasteamt}'>
        
        <div class="display-f adj"><label><b>MC</b></label>
        <input type="hidden" name="minmcp_${addid}" id="minmcp_${addid}" value="${min_mc_perc}"/>
        <input type="hidden" name="minmcg_${addid}" id="minmcg_${addid}" value="${min_mc_gram}"/>
        <input type="hidden" name="minmca_${addid}" id="minmca_${addid}" value="${min_mc_amount}"/>
        <input type="hidden" name="maxmcp_${addid}" id="maxmcp_${addid}" value="${max_mc_perc}"/>
        <input type="hidden" name="maxmcg_${addid}" id="maxmcg_${addid}" value="${max_mc_gram}"/>
        <input type="hidden" name="maxmca_${addid}" id="maxmca_${addid}" value="${max_mc_amount}"/>
        <div><input type="number" name="mcp_${addid}" id="mcp_${addid}" class='adj-box jwl_range_adjusters ${mc_read_only}' value="${backendController.money(max_mc_perc,3,0)}"/><label>.%</label></div>
        <div><input type="number" name="mcg_${addid}" id="mcg_${addid}" class='adj-box jwl_range_adjusters ${mc_read_only}' value="${backendController.money(max_mc_gram,3,0)}"/><label>.G</label></div>
        <div><input type="number" name="mca_${addid}" id="mca_${addid}" class='adj-box jwl_range_adjusters' value="${backendController.money(orders[b].mcamt,3,0)}"/><label>./-</label></div></div>
        <input type='range' id="mc_${addid}" name="mc_${addid}" class='jwl_range_adjusters' step='1' ctype='${control[0].mctype}' minmc='${control[0].minmc}' maxmc='${control[0].maxmc}' min='${min_mc_amount}' max='${max_mc_amount}' value='${orders[b].mcamt}'>
        <input type="hidden" name="splprice_${addid}" id="splprice_${addid}" ctype='${control[0].spltype}' value="${control[0].splprice}"/></div>
        </td>
        <td>${stone_html}</td>
        <td>${backendController.money(orders[b].wt,3,1)}</td>
        <td id='individual_jwl_amt_${addid}'>${backendController.money(total_jewel_amount,2,1)}</td>
        <td>${edit_and_delete}</td><input type='hidden' id='individual-jwl${addid}' name='individual-jwl${addid}' class='all_jewel_amount' value='${total_jewel_amount}'>
        <input type='hidden' id='individual-jwl-wt${addid}' name='individual-jwl-wt${addid}' class='all_jewel_weight' value='${orders[b].wt}'>
        <input type='hidden' id='stone_type_${addid}' name='stone_type_${addid}' class='' value='${orders[b].stonetype}'>
        <input type='hidden' id='jewelphoto_${addid}' name='jewelphoto_${addid}' class='' value='${orders[b].jewelphoto}'>
        <input type='hidden' id='pcs_${addid}' name='pcs_${addid}' class='' value='${orders[0].pcs}'>
        <input type='hidden' id='code_${addid}' name='code_${addid}' class='' value='${control[0].code}'>
        <input type='hidden' id='product_${addid}' name='product_${addid}' class='' value='${control[0].category}'>
        <input type='hidden' id='jewel_type_${addid}' name='jewel_type_${addid}' class='' value='${control[0].jeweltype}'>
        <input type='hidden' id='sub_type_${addid}' name='sub_type_${addid}' class='' value='${control[0].subtype}'>
        <input type='hidden' id='jewel_rate_${addid}' name='jewel_rate_${addid}' class='' value='${orders[b].rate}'>
        <input type='hidden' id='spltype_${addid}' name='spltype_${addid}' class='' value='${control[0].spltype}'>
        <input type='hidden' id='mctype_${addid}' name='mctype_${addid}' class='' value='${control[0].mctype}'>
        <input type='hidden' id='wastetype_${addid}' name='wastetype_${addid}' class='' value='${control[0].wastetype}'>
        <input type='hidden' id='stone_count_${addid}' name='stone_count_${addid}' class='' value='${orders[b].stonecount}'>
        <input type='hidden' id='stone_weight_${addid}' name='stone_weight_${addid}' class='' value='${orders[b].stoneweight}'>
        <input type='hidden' id='stone_price_${addid}' name='stone_price_${addid}' class='' value='${orders[b].stoneprice}'>
        <input type='hidden' id='stone_carat_size_${addid}' name='stone_carat_size_${addid}' class='' value='${orders[b].caratsize}'>
        <input type='hidden' id='stone_carat_price_${addid}' name='stone_carat_price_${addid}' class='' value='${orders[b].caratprice}'>
        <input type='hidden' id='stone_total_price_${addid}' name='stone_total_price_${addid}' class='totalstoneprices' value='${stone_total_price}'>
        <input type='hidden' id='stone_total_weight_${addid}' name='stone_total_weight_${addid}' class='totalstoneweights' value='${stone_total_weight}'></tr>`;
    }
    res.json({ success: true, html: html, id:ids, ex:ex[0], orderid:uniquekey, order_id:orders[0].ordercode, phone:orders[0].phone, userid: orders[0].userid, name:orders[0].name,item:orders[0] });
});

// POST route to handle form submission
router.post('/delete',async (req, res) => {
    const { uniquekey } = req.body;
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const deleteid = await backendController.deleted({ body : {'tableName' :'placed_orders', 'whereCondition': `orderid=?`,'values':[uniquekey]}});
          if (deleteid.success)
            res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});

router.post("/insert", async (req, res) => {
    const {customer, customername, ph1, ph2, address, att1, att2, att3, orderdate, deliverydate, advance, orderid, order_id, stonepart, oldpart, bankpart, exchangeFunction, addid, total_weights_value, total_amounts_value, advance_amounts_value,advanced_value,advance_bank_amounts_value,old_weights_value,old_waste_value,pure_weights_value,exchange_weights_value,coin_weights_value,old_amounts_value, pure_amounts_value, ex_amounts_value, coin_amounts_value, reduction_amounts_value, grand_amounts_value, gst_perc_value, gst_value_value, gst_amounts_value, discount_amounts_value, round_off_amounts_value, net_amounts_value} = req.body;
    // Initialize an object to store the dynamic values
    const rate_master = await backendController.selectQuery(`SELECT GROUP_CONCAT(category SEPARATOR '[s~1]') AS concatenated_categories, GROUP_CONCAT(price SEPARATOR '[s~1]') AS concatenated_prices FROM rate_master WHERE deleteon = ? and branch = ?`,['0000-00-00',userToken.site])
    let ordercode =  backendController.generateUniqueId();
    const addid_arr = addid.split("[s~1]");
    if(customer=="nd")
        return res.json({success:false, msg_type:"error", msg:"Must Select a Customer to Place Order..."});
    if(!customername)
        return res.json({success:false, msg_type:"error", msg:"Please Enter Valid Customer Name"}); 
    let orderids = await backendController.generateUniqueNumbers('placed_orders', 'orderid', 4, 'o');
    if(!orderids)
        return res.json({success:false, msg_type:"error", msg:"Contact Developer to Ask..."}); 
    if(att1=="nd"&&att2=="nd"&&att3=="nd")
        return res.json({success:false, msg_type:"error", msg:"Atleast Need Anyone Attender to Place Order"}); 
    if(!addid_arr[0])
        return res.json({success:false, msg_type:"error", msg:"Atleast Need to Add Any Jewel to Place Order"});
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
    const oldpart_arr = oldpart.split("[s~1]");
    const bankpart_arr = bankpart.split("[s~1]");
    let banks = "";
    let transaction_types = "";
    let bank_amts = "";
    let advance_bank = 0;
    if(oldpart_arr[0])
        for (let i=0;i<oldpart_arr.length-1;i++) {
            const exchange_type = req.body[`exchange_${oldpart_arr[i]}`];
            exchange_types += exchange_type+"[0~0]";
            if(exchange_type=="old")
            {
                if(!req.body[`oldweight_${oldpart_arr[i]}`] && backendController.valNum(req.body[`oldweight_${oldpart_arr[i]}`])<=0)
                    return res.json({success:false, msg_type:"error", msg:"Old Weight"}); 
                if(!req.body[`oldwaste_${oldpart_arr[i]}`] && backendController.valNum(req.body[`oldwaste_${oldpart_arr[i]}`])<0)
                    return res.json({success:false, msg_type:"error", msg:"Old Weight"}); 
                if(!req.body[`totaloldprice${oldpart_arr[i]}`] && backendController.valNum( req.body[`totaloldprice${oldpart_arr[i]}`])<=0)
                    return res.json({success:false, msg_type:"error", msg:"Old Weight"}); 
                old_metal += req.body[`oldmetal_${oldpart_arr[i]}`]+"[0~0]";
                old_pcs += req.body[`oldpcs_${oldpart_arr[i]}`]+"[0~0]";
                old_weight += req.body[`oldweight_${oldpart_arr[i]}`]+"[0~0]";
                old_waste += req.body[`oldwaste_${oldpart_arr[i]}`]+"[0~0]";
                old_price += req.body[`oldprice_${oldpart_arr[i]}`]+"[0~0]";
                old_totalprice += req.body[`oldtotalprice_${oldpart_arr[i]}`]+"[0~0]";
                old_caratsize += req.body[`oldcaratsize_${oldpart_arr[i]}`]+"[0~0]";
                old_caratrate += req.body[`oldcaratprice_${oldpart_arr[i]}`]+"[0~0]";
                old_carat_totalprice += req.body[`oldcarattotalprice_${oldpart_arr[i]}`]+"[0~0]";
                old_pic += req.body[`proof_${oldpart_arr[i]}`]+"[0~0]";
                totaloldprice += req.body[`totaloldprice${oldpart_arr[i]}`]+"[0~0]";
                ex.push({type:"old", data:{date:orderdate,metal:req.body[`oldmetal_${oldpart_arr[i]}`] || '',pcs:req.body[`oldpcs_${oldpart_arr[i]}`] || '',weight:req.body[`oldweight_${oldpart_arr[i]}`] || '',waste:req.body[`oldwaste_${oldpart_arr[i]}`] || '',rate:req.body[`oldprice_${oldpart_arr[i]}`] || '',oldamount:req.body[`oldtotalprice_${oldpart_arr[i]}`] || '',caratsize:req.body[`oldcaratsize_${oldpart_arr[i]}`] || '',caratrate:req.body[`oldcaratprice_${oldpart_arr[i]}`] || '',carattotalprice:req.body[`oldcarattotalprice_${oldpart_arr[i]}`] || '',proof:req.body[`proof_${oldpart_arr[i]}`] || '',totalamount:req.body[`totaloldprice${oldpart_arr[i]}`]}});
            }
            if(exchange_type=="pure")
            {
                if(!req.body[`pureweight_${oldpart_arr[i]}`] && backendController.valNum(req.body[`pureweight_${oldpart_arr[i]}`])<=0)
                    return res.json({success:false, msg_type:"error", msg:"Pure Weight"}); 
                pure_metal += req.body[`puremetal_${oldpart_arr[i]}`]+"[0~0]";
                pure_weight += req.body[`purepcs_${oldpart_arr[i]}`]+"[0~0]";
                pure_pcs += req.body[`pureweight_${oldpart_arr[i]}`]+"[0~0]";
                pure_price += req.body[`pureprice_${oldpart_arr[i]}`]+"[0~0]";
                pure_pic += req.body[`proof_${oldpart_arr[i]}`]+"[0~0]";
                pure_totalprice += req.body[`puretotalprice_${oldpart_arr[i]}`]+"[0~0]";
                ex.push({type:"pure", data:{date:orderdate,metal: req.body[`puremetal_${oldpart_arr[i]}`] || '',weight: req.body[`purepcs_${oldpart_arr[i]}`] || '',pcs: req.body[`pureweight_${oldpart_arr[i]}`] || '',rate: req.body[`pureprice_${oldpart_arr[i]}`] || '',proof: req.body[`proof_${oldpart_arr[i]}`] || '',total: req.body[`puretotalprice_${oldpart_arr[i]}`]}});
            }
            if(exchange_type=="coin")
            {
                if(!req.body[`coinweight_${oldpart_arr[i]}`] && backendController.valNum(req.body[`coinweight_${oldpart_arr[i]}`])<=0)
                    return res.json({success:false, msg_type:"error", msg:"Coin Weight"}); 
                coin_metal += req.body[`coinmetal_${oldpart_arr[i]}`]+"[0~0]";
                coin_pcs += req.body[`coinpcs_${oldpart_arr[i]}`]+"[0~0]";
                coin_weight += req.body[`coinweight_${oldpart_arr[i]}`]+"[0~0]";
                coin_price += req.body[`coinprice_${oldpart_arr[i]}`]+"[0~0]";
                coin_pic += req.body[`proof_${oldpart_arr[i]}`]+"[0~0]";
                coin_totalprice	+= req.body[`cointotalprice_${oldpart_arr[i]}`]+"[0~0]";
                ex.push({type:"coin", data:{date:orderdate,metal: req.body[`coinmetal_${oldpart_arr[i]}`] || '',pcs: req.body[`coinpcs_${oldpart_arr[i]}`] || '',weight: req.body[`coinweight_${oldpart_arr[i]}`] || '',rate: req.body[`coinprice_${oldpart_arr[i]}`] || '',proof: req.body[`proof_${oldpart_arr[i]}`] || '',totalamount: req.body[`cointotalprice_${oldpart_arr[i]}`]}});
            }
            if(exchange_type=="exchange")
            {
                if(!req.body[`exchangeprice${oldpart_arr[i]}`] && backendController.valNum(req.body[`exchangeprice${oldpart_arr[i]}`])<=0)
                    return res.json({success:false, msg_type:"error", msg:"Exchane Price"}); 
                ex_code += req.body[`excode_${oldpart_arr[i]}`]+"[0~0]";
                ex_pic += req.body[`proof_${oldpart_arr[i]}`]+"[0~0]";
                ex_price += req.body[`exchangeprice${oldpart_arr[i]}`]+"[0~0]";
                ex.push({type:"exchange", data:{ date:orderdate,tagno: req.body[`excode_${oldpart_arr[i]}`] || '',proof: req.body[`proof_${oldpart_arr[i]}`] || '',price: req.body[`exchangeprice${oldpart_arr[i]}`]}});
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
    if(order_id && orderid)
    {
        ordercode = order_id;
        orderids[0] = orderid;
        try
        {
            await backendController.accountsDelete("order" , orderid);
            await backendController.deleted({body:{tableName:"exchanges",whereCondition:"id=? and category=?", values:[orderid,"order"]}});
            await backendController.deleted({body:{tableName:"customer_wallet",whereCondition:"id=? and category=?", values:[orderid,"order"]}});
            await backendController.deleted({body:{tableName:"old",whereCondition:"id=? and category=?", values:[orderid,"order"]}});
            await backendController.deleted({body:{tableName:"pure",whereCondition:"id=? and category=?", values:[orderid,"order"]}});
            await backendController.deleted({body:{tableName:"coin",whereCondition:"id=? and category=?", values:[orderid,"order"]}});
            await backendController.deleted({body:{tableName:"exchange",whereCondition:"id=? and category=?", values:[orderid,"order"]}});
            await backendController.deleted({body:{tableName:"placed_orders",whereCondition:"orderid=? and ordercode=?", values:[orderid,order_id]}});
        }
        catch(error) 
        {
            console.error('Error in Insert:', error.message);
        }
    }
    try
    {
        const entity = await backendController.newAccount("34",ph1);
        if(bankpart_arr[0])
        for(let j=0;j<bankpart_arr.length-1;j++) {
            banks += req.body[`bank_${bankpart_arr[j]}`]+"[s~1]";
            transaction_types += req.body[`transactiontype_${bankpart_arr[j]}`]+"[s~1]";
            bank_amts += req.body[`bankamount_${bankpart_arr[j]}`]+"[s~1]";
            let bank = req.body[`bank_${bankpart_arr[j]}`];
            let transaction_type = req.body[`transactiontype_${bankpart_arr[j]}`];
            let bank_amt = req.body[`bankamount_${bankpart_arr[j]}`];
            advance_bank += backendController.valNum(bank_amt);
            await backendController.insert({body: {tableName:"customer_wallet",data: {userid:customer,name:customername,phone:ph1,type:"bank",amount:bank_amt,gram:total_weights_value,date:orderdate,categories:rate_master[0].concatenated_categories,rates:rate_master[0].concatenated_prices,category:"order",id:orderids[0]}}});
            await backendController.cdAccounts("34", "11", "payable", orderdate, entity[0].id, bank_amt, "bank", "order", orderids[0], 0, "", "order advance", entity[0].name, "bank", 0, bank_amt, bank, transaction_type);
        }
        if(parseFloat(backendController.valNum(advance))>0)
        {
            await backendController.insert({body: {tableName:"customer_wallet",data: {userid:customer,name:customername,phone:ph1,type:"cash",amount:advance,gram:total_weights_value,date:orderdate,categories:rate_master[0].concatenated_categories,rates:rate_master[0].concatenated_prices,category:"order",id:orderids[0]}}});
            await backendController.cdAccounts("34", "1", "payable", orderdate, entity[0].id, advance, "cash", "order", orderids[0], 0, "", "order advance", entity[0].name, "cash", advance, 0, "nd", "nd");
        }
        if(parseFloat(backendController.valNum(old_amounts_value))>0)
        {
            await backendController.insert({body: {tableName:"customer_wallet",data: {userid:customer,name:customername,phone:ph1,type:"old",amount:old_amounts_value,gram:total_weights_value,date:orderdate,categories:rate_master[0].concatenated_categories,rates:rate_master[0].concatenated_prices,category:"order",id:orderids[0]}}});
            await backendController.cdAccounts("34", "35", "payable", orderdate, entity[0].id, old_amounts_value, "old gold", "order", orderids[0], 0, "", "order advance", entity[0].name, "credit", 0, 0, "nd", "nd");
        }
        if(parseFloat(backendController.valNum(pure_amounts_value))>0)
        {
            await backendController.insert({body: {tableName:"customer_wallet",data: {userid:customer,name:customername,phone:ph1,type:"pure",amount:pure_amounts_value,gram:total_weights_value,date:orderdate,categories:rate_master[0].concatenated_categories,rates:rate_master[0].concatenated_prices,category:"order",id:orderids[0]}}});
            await backendController.cdAccounts("34", "36", "payable", orderdate, entity[0].id, pure_amounts_value, "pure gold", "order", orderids[0], 0, "", "order advance", entity[0].name, "credit", 0, 0, "nd", "nd");
        }
        if(parseFloat(backendController.valNum(ex_amounts_value))>0)
        {
            await backendController.insert({body: {tableName:"customer_wallet",data: {userid:customer,name:customername,phone:ph1,type:"exchange",amount:ex_amounts_value,gram:total_weights_value,date:orderdate,categories:rate_master[0].concatenated_categories,rates:rate_master[0].concatenated_prices,category:"order",id:orderids[0]}}});
            await backendController.cdAccounts("34", "35", "payable", orderdate, entity[0].id, ex_amounts_value, "pure gold", "order", orderids[0], 0, "", "order advance", entity[0].name, "credit", 0, 0, "nd", "nd");
        }
        if(parseFloat(backendController.valNum(coin_amounts_value))>0)
        {
            await backendController.insert({body: {tableName:"customer_wallet",data: {userid:customer,name:customername,phone:ph1,type:"coin",amount:coin_amounts_value,gram:total_weights_value,date:orderdate,categories:rate_master[0].concatenated_categories,rates:rate_master[0].concatenated_prices,category:"order",id:orderids[0]}}});
            await backendController.cdAccounts("34", "37", "payable", orderdate, entity[0].id, coin_amounts_value, "pure gold", "order", orderids[0], 0, "", "order advance", entity[0].name, "credit", 0, 0, "nd", "nd");
        }
        for(let d=0;d<ex.length;d++)
        {
            const table = ex[d].type;
            const data = ex[d].data;
            await backendController.insert({body: {tableName:table,data: data}});
        }
        for(let j=0;j<addid_arr.length-1;j++)
        {
            const jeweltype = req.body[`jewel_type_${addid_arr[j]}`];
            const jewelphoto = req.body[`jewelphoto_${addid_arr[j]}`];
            const subtype = req.body[`sub_type_${addid_arr[j]}`];
            const jewelrate = req.body[`jewel_rate_${addid_arr[j]}`];
            const product = req.body[`product_${addid_arr[j]}`];
            const code = req.body[`code_${addid_arr[j]}`];
            const pcs = req.body[`pcs_${addid_arr[j]}`];
            const wt = req.body[`individual-jwl-wt${addid_arr[j]}`];
            const jewelprice = req.body[`individual-jwl${addid_arr[j]}`];
            const spltype = req.body[`spltype_${addid_arr[j]}`];
            const splprice = req.body[`splprice_${addid_arr[j]}`];
            const wastetype = req.body[`wastetype_${addid_arr[j]}`];
            const mctype = req.body[`mctype_${addid_arr[j]}`];
            const wasteamt = req.body[`waste_${addid_arr[j]}`];
            const mcamt = req.body[`mc_${addid_arr[j]}`];
            const wasteperc = req.body[`wastep_${addid_arr[j]}`];
            const mcperc = req.body[`mcp_${addid_arr[j]}`];
            const wastegram = req.body[`wasteg_${addid_arr[j]}`];
            const mcgram = req.body[`mcg_${addid_arr[j]}`];
            const stonetype = req.body[`stone_type_${addid_arr[j]}`];
            const stonecount = req.body[`stone_count_${addid_arr[j]}`];
            const stoneweight = req.body[`stone_weight_${addid_arr[j]}`];
            const stoneprice = req.body[`stone_price_${addid_arr[j]}`];
            const caratsize = req.body[`stone_carat_size_${addid_arr[j]}`];
            const caratprice = req.body[`stone_carat_price_${addid_arr[j]}`];
            const totalstoneprice = req.body[`stone_total_price_${addid_arr[j]}`];
            const totalstoneweight = req.body[`stone_total_weight_${addid_arr[j]}`];
            const data = {jewelphoto,categories:rate_master[0].concatenated_categories,rates:rate_master[0].concatenated_prices,rate: jewelrate, orderid: orderids[0], ordercode, orderdate, deliverydate, name: customername, phone:ph1, userid: customer, category: product, jeweltype, subtype, wt, pcs, spltype, splprice, mctype, mcperc, mcgram, mcamt, wastetype, wasteperc, wastegram, wasteamt, stonetype, stonecount, stoneweight, stoneprice, caratsize, caratprice, totalstoneweight, totalstoneprice, jewelprice, exchangetype: exchange_types, advance_cash: advance, advance_bank: advance_bank, bank: banks, transactiontype: transaction_types, bank_amt: bank_amts, attender1: att1, attender2: att2, attender3: att3, old_weight: old_weights_value, old_waste: old_waste_value, pure_weight: pure_weights_value, exchange_weight: exchange_weights_value, coin_weight: coin_weights_value, old_amount: old_amounts_value, pure_amount: pure_amounts_value, ex_amount: ex_amounts_value, coin_amount: coin_amounts_value, grand_amount: gst_amounts_value, totalamount:grand_amounts_value, gst: gst_perc_value, gstamount: gst_value_value, afterreduction: reduction_amounts_value, discount: discount_amounts_value, roundoff: round_off_amounts_value, nettotal: net_amounts_value}; 
            await backendController.insert({body: {tableName:"placed_orders",data: data}});
        }
        await backendController.insert({body: {tableName: 'exchanges',data: {exdate:orderdate,category:"order",id:orderids[0],exchange_types,old_metal,old_pcs,old_weight,old_waste,old_price,old_totalprice,old_caratsize,old_caratrate,old_carat_totalprice,old_pic,totaloldprice,pure_metal,pure_weight,pure_pcs,pure_price,pure_pic,pure_totalprice,coin_metal,coin_pcs,coin_weight,coin_price,coin_pic,coin_totalprice,ex_code,ex_price,ex_pic}}});
        return res.json({success:true, msg_type:"success", msg:"Order Placed Successfully...", pdf:orderids[0]});
    }
    catch(error) 
    {
        console.error('Error in Insert:', error);
    }    
});

router.post("/insert_quot", async (req, res) => {
    const {customer, customername, ph1, ph2, address, att1, att2, att3, orderdate, deliverydate, advance, banks, transactiontype, bank, orderid, order_id, stonepart, oldpart, exchangeFunction, addid, total_weights_value, total_amounts_value, advance_amounts_value,advanced_value,advance_bank_amounts_value,old_weights_value,old_waste_value,pure_weights_value,exchange_weights_value,coin_weights_value,old_amounts_value, pure_amounts_value, ex_amounts_value, coin_amounts_value, reduction_amounts_value, grand_amounts_value, gst_perc_value, gst_value_value, gst_amounts_value, discount_amounts_value, round_off_amounts_value, net_amounts_value} = req.body;
    // Initialize an object to store the dynamic values
    const rate_master = await backendController.selectQuery(`SELECT GROUP_CONCAT(category SEPARATOR '[s~1]') AS concatenated_categories, GROUP_CONCAT(price SEPARATOR '[s~1]') AS concatenated_prices FROM rate_master WHERE deleteon = ? and branch = ?`,['0000-00-00',userToken.site])
    let ordercode =  backendController.generateUniqueId();
    const addid_arr = addid.split("[s~1]");
    if(customer=="nd")
        return res.json({success:false, msg_type:"error", msg:"Must Select a Customer to Place Order..."});
    if(!customername)
        return res.json({success:false, msg_type:"error", msg:"Please Enter Valid Customer Name"}); 
    let orderids = await backendController.generateUniqueNumbers('placed_orders_quot', 'orderid', 4, 'o');
    if(!orderids)
        return res.json({success:false, msg_type:"error", msg:"Contact Developer to Ask..."}); 
    if(att1=="nd"&&att2=="nd"&&att3=="nd")
        return res.json({success:false, msg_type:"error", msg:"Atleast Need Anyone Attender to Place Order"}); 
    if(!addid_arr[0])
        return res.json({success:false, msg_type:"error", msg:"Atleast Need to Add Any Jewel to Place Order"}); 
    if((backendController.valNum(bank)>0&&(banks=="nd" || transactiontype=="nd")) || ((backendController.valNum(bank)<=0|| banks=="nd") && transactiontype!="nd") || ((backendController.valNum(bank)<=0 || transactiontype=="nd")&&banks!="nd"))
        return res.json({success:false, msg_type:"error", msg:"Bank Details Are Not Valid"}); 
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
    const oldpart_arr = oldpart.split("[s~1]");
    if(oldpart_arr[0])
        for (let i=0;i<oldpart_arr.length-1;i++) {
            const exchange_type = req.body[`exchange_${oldpart_arr[i]}`];
            exchange_types += exchange_type+"[0~0]";
            if(exchange_type=="old")
            {
                if(!req.body[`oldweight_${oldpart_arr[i]}`] && backendController.valNum(req.body[`oldweight_${oldpart_arr[i]}`])<=0)
                    return res.json({success:false, msg_type:"error", msg:"Old Weight"}); 
                if(!req.body[`oldwaste_${oldpart_arr[i]}`] && backendController.valNum(req.body[`oldwaste_${oldpart_arr[i]}`])<0)
                    return res.json({success:false, msg_type:"error", msg:"Old Weight"}); 
                if(!req.body[`totaloldprice${oldpart_arr[i]}`] && backendController.valNum( req.body[`totaloldprice${oldpart_arr[i]}`])<=0)
                    return res.json({success:false, msg_type:"error", msg:"Old Weight"}); 
                old_metal += req.body[`oldmetal_${oldpart_arr[i]}`]+"[0~0]";
                old_pcs += req.body[`oldpcs_${oldpart_arr[i]}`]+"[0~0]";
                old_weight += req.body[`oldweight_${oldpart_arr[i]}`]+"[0~0]";
                old_waste += req.body[`oldwaste_${oldpart_arr[i]}`]+"[0~0]";
                old_price += req.body[`oldprice_${oldpart_arr[i]}`]+"[0~0]";
                old_totalprice += req.body[`oldtotalprice_${oldpart_arr[i]}`]+"[0~0]";
                old_caratsize += req.body[`oldcaratsize_${oldpart_arr[i]}`]+"[0~0]";
                old_caratrate += req.body[`oldcaratprice_${oldpart_arr[i]}`]+"[0~0]";
                old_carat_totalprice += req.body[`oldcarattotalprice_${oldpart_arr[i]}`]+"[0~0]";
                old_pic += req.body[`proof_${oldpart_arr[i]}`]+"[0~0]";
                totaloldprice += req.body[`totaloldprice${oldpart_arr[i]}`]+"[0~0]";
                ex.push({type:"old", data:{metal:req.body[`oldmetal_${oldpart_arr[i]}`] || '',pcs:req.body[`oldpcs_${oldpart_arr[i]}`] || '',weight:req.body[`oldweight_${oldpart_arr[i]}`] || '',waste:req.body[`oldwaste_${oldpart_arr[i]}`] || '',rate:req.body[`oldprice_${oldpart_arr[i]}`] || '',oldamount:req.body[`oldtotalprice_${oldpart_arr[i]}`] || '',caratsize:req.body[`oldcaratsize_${oldpart_arr[i]}`] || '',caratrate:req.body[`oldcaratprice_${oldpart_arr[i]}`] || '',carattotalprice:req.body[`oldcarattotalprice_${oldpart_arr[i]}`] || '',proof:req.body[`proof_${oldpart_arr[i]}`] || '',totalamount:req.body[`totaloldprice${oldpart_arr[i]}`]}});
            }
            if(exchange_type=="pure")
            {
                if(!req.body[`pureweight_${oldpart_arr[i]}`] && backendController.valNum(req.body[`pureweight_${oldpart_arr[i]}`])<=0)
                    return res.json({success:false, msg_type:"error", msg:"Pure Weight"}); 
                pure_metal += req.body[`puremetal_${oldpart_arr[i]}`]+"[0~0]";
                pure_weight += req.body[`purepcs_${oldpart_arr[i]}`]+"[0~0]";
                pure_pcs += req.body[`pureweight_${oldpart_arr[i]}`]+"[0~0]";
                pure_price += req.body[`pureprice_${oldpart_arr[i]}`]+"[0~0]";
                pure_pic += req.body[`proof_${oldpart_arr[i]}`]+"[0~0]";
                pure_totalprice += req.body[`puretotalprice_${oldpart_arr[i]}`]+"[0~0]";
                ex.push({type:"pure", data:{metal: req.body[`puremetal_${oldpart_arr[i]}`] || '',weight: req.body[`purepcs_${oldpart_arr[i]}`] || '',pcs: req.body[`pureweight_${oldpart_arr[i]}`] || '',rate: req.body[`pureprice_${oldpart_arr[i]}`] || '',proof: req.body[`proof_${oldpart_arr[i]}`] || '',total: req.body[`puretotalprice_${oldpart_arr[i]}`]}});
            }
            if(exchange_type=="coin")
            {
                if(!req.body[`coinweight_${oldpart_arr[i]}`] && backendController.valNum(req.body[`coinweight_${oldpart_arr[i]}`])<=0)
                    return res.json({success:false, msg_type:"error", msg:"Coin Weight"}); 
                coin_metal += req.body[`coinmetal_${oldpart_arr[i]}`]+"[0~0]";
                coin_pcs += req.body[`coinpcs_${oldpart_arr[i]}`]+"[0~0]";
                coin_weight += req.body[`coinweight_${oldpart_arr[i]}`]+"[0~0]";
                coin_price += req.body[`coinprice_${oldpart_arr[i]}`]+"[0~0]";
                coin_pic += req.body[`proof_${oldpart_arr[i]}`]+"[0~0]";
                coin_totalprice	+= req.body[`cointotalprice_${oldpart_arr[i]}`]+"[0~0]";
                ex.push({type:"coin", data:{metal: req.body[`coinmetal_${oldpart_arr[i]}`] || '',pcs: req.body[`coinpcs_${oldpart_arr[i]}`] || '',weight: req.body[`coinweight_${oldpart_arr[i]}`] || '',rate: req.body[`coinprice_${oldpart_arr[i]}`] || '',proof: req.body[`proof_${oldpart_arr[i]}`] || '',totalamount: req.body[`cointotalprice_${oldpart_arr[i]}`]}});
            }
            if(exchange_type=="exchange")
            {
                if(!req.body[`exchangeprice${oldpart_arr[i]}`] && backendController.valNum(req.body[`exchangeprice${oldpart_arr[i]}`])<=0)
                    return res.json({success:false, msg_type:"error", msg:"Exchane Price"}); 
                ex_code += req.body[`excode_${oldpart_arr[i]}`]+"[0~0]";
                ex_pic += req.body[`proof_${oldpart_arr[i]}`]+"[0~0]";
                ex_price += req.body[`exchangeprice${oldpart_arr[i]}`]+"[0~0]";
                ex.push({type:"exchange", data:{ tagno: req.body[`excode_${oldpart_arr[i]}`] || '',proof: req.body[`proof_${oldpart_arr[i]}`] || '',price: req.body[`exchangeprice${oldpart_arr[i]}`]}});
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
    if(order_id && orderid)
    {
        ordercode = order_id;
        orderids[0] = orderid;
        try
        {
            await backendController.deleted({body:{tableName:"placed_orders_quot",whereCondition:"orderid=? and ordercode=?", values:[orderid,order_id]}});
        }
        catch(error) 
        {
            console.error('Error in Insert:', error.message);
        }
    }
    try
    {
        for(let d=0;d<ex.length;d++)
        {
            const table = ex[d].type;
            const data = ex[d].data;
            await backendController.insert({body: {tableName:table,data: data}});
        }
        for(let j=0;j<addid_arr.length-1;j++)
        {
            const jeweltype = req.body[`jewel_type_${addid_arr[j]}`];
            const jewelphoto = req.body[`jewelphoto_${addid_arr[j]}`];
            const subtype = req.body[`sub_type_${addid_arr[j]}`];
            const jewelrate = req.body[`jewel_rate_${addid_arr[j]}`];
            const product = req.body[`product_${addid_arr[j]}`];
            const code = req.body[`code_${addid_arr[j]}`];
            const pcs = req.body[`pcs_${addid_arr[j]}`];
            const wt = req.body[`individual-jwl-wt${addid_arr[j]}`];
            const jewelprice = req.body[`individual-jwl${addid_arr[j]}`];
            const spltype = req.body[`spltype_${addid_arr[j]}`];
            const splprice = req.body[`splprice_${addid_arr[j]}`];
            const wastetype = req.body[`wastetype_${addid_arr[j]}`];
            const mctype = req.body[`mctype_${addid_arr[j]}`];
            const wasteamt = req.body[`waste_${addid_arr[j]}`];
            const mcamt = req.body[`mc_${addid_arr[j]}`];
            const wasteperc = req.body[`wastep_${addid_arr[j]}`];
            const mcperc = req.body[`mcp_${addid_arr[j]}`];
            const wastegram = req.body[`wasteg_${addid_arr[j]}`];
            const mcgram = req.body[`mcg_${addid_arr[j]}`];
            const stonetype = req.body[`stone_type_${addid_arr[j]}`];
            const stonecount = req.body[`stone_count_${addid_arr[j]}`];
            const stoneweight = req.body[`stone_weight_${addid_arr[j]}`];
            const stoneprice = req.body[`stone_price_${addid_arr[j]}`];
            const caratsize = req.body[`stone_carat_size_${addid_arr[j]}`];
            const caratprice = req.body[`stone_carat_price_${addid_arr[j]}`];
            const totalstoneprice = req.body[`stone_total_price_${addid_arr[j]}`];
            const totalstoneweight = req.body[`stone_total_weight_${addid_arr[j]}`];
            const data = {jewelphoto,categories:rate_master[0].concatenated_categories,rates:rate_master[0].concatenated_prices,rate: jewelrate, orderid: orderids[0], ordercode, orderdate, deliverydate, name: customername, phone:ph1, userid: customer, category: product, jeweltype, subtype, wt, pcs, spltype, splprice, mctype, mcperc, mcgram, mcamt, wastetype, wasteperc, wastegram, wasteamt, stonetype, stonecount, stoneweight, stoneprice, caratsize, caratprice, totalstoneweight, totalstoneprice, jewelprice, exchangetype: exchange_types, advance_cash: advance, advance_bank: bank, bank: banks, transactiontype, attender1: att1, attender2: att2, attender3: att3, old_weight: old_weights_value, old_waste: old_waste_value, pure_weight: pure_weights_value, exchange_weight: exchange_weights_value, coin_weight: coin_weights_value, old_amount: old_amounts_value, pure_amount: pure_amounts_value, ex_amount: ex_amounts_value, coin_amount: coin_amounts_value, grand_amount: gst_amounts_value, totalamount:grand_amounts_value, gst: gst_perc_value, gstamount: gst_value_value, afterreduction: reduction_amounts_value, discount: discount_amounts_value, roundoff: round_off_amounts_value, nettotal: net_amounts_value}; 
            await backendController.insert({body: {tableName:"placed_orders_quot",data: data}});
        }
        // await backendController.insert({body: {tableName: 'exchanges',data: {exdate:orderdate,category:"order",id:orderids[0],exchange_types,old_metal,old_pcs,old_weight,old_waste,old_price,old_totalprice,old_caratsize,old_caratrate,old_carat_totalprice,old_pic,totaloldprice,pure_metal,pure_weight,pure_pcs,pure_price,pure_pic,pure_totalprice,coin_metal,coin_pcs,coin_weight,coin_price,coin_pic,coin_totalprice,ex_code,ex_price,ex_pic}}});
        return res.json({success:true, msg_type:"success", msg:"Order Quotation Saved Successfully..."});
    }
    catch(error) 
    {
        console.error('Error in Insert:', error.message);
    }    
});

router.get("/loadCate", async (req, res) => {
    backendController.selectQuery(`SELECT distinct product,category FROM product_category where deleteon=? and branch=?`,['0000-00-00',userToken.site])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['category']}">${backendController.caps(item['category'])}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.get("/loadStone", async (req, res) => {
    backendController.selectQuery(`SELECT distinct name FROM stone_products where deleteon=? and branch=?`,['0000-00-00',userToken.site])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['name']}">${backendController.caps(item['name'])}</option>`);
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
            options_arr.push(`<option value="${item['counter']}">${backendController.caps(item['counter'])}</option>`);
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
            options_arr.push(`<option value="${item['code']}[s~1]${item['jeweltype']}">${backendController.caps(item['jeweltype'])}</option>`);
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
    backendController.selectQuery(`SELECT distinct subtype FROM jewel_master_control where deleteon=? and branch=? and category=? and code=?`,['0000-00-00',userToken.site,category[1],category[0]])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['subtype']}">${backendController.caps(item['subtype'])}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.get("/staffs", async (req, res) => {
    
    backendController.selectQuery(`SELECT distinct name,userid FROM users where deleteon=? and branch=? and typeofpeople!=?`,['0000-00-00',userToken.site,'customer'])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['userid']}">${backendController.caps(item['name'])}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
 });

router.post("/addJewel", async (req, res) => {
    const { product,typeofjewel,subtype,pcs,totalweight,jewelamount,waste,mc,stonepart,imgpath_photo } = req.body;
    const addid = backendController.generateUniqueId();
    const control = await backendController.selectQuery(`SELECT * FROM jewel_master_control where deleteon=? and branch=? and category=? and code=? and subtype=? and minweight<=? and maxweight>=?`,['0000-00-00',userToken.site,product,typeofjewel,subtype,backendController.valNum(parseFloat(totalweight/pcs)),backendController.valNum(parseFloat(totalweight/pcs))]);
    if(!control[0])
    {
        return res.json({ success: false, msg_type:"error", msg:"Jewel control specifications have not been defined for this weight category." });
    }
    if(parseInt(backendController.valNum(pcs))<=0)
        return res.json({ success: false, msg_type:"error", msg:"Please enter the number of pieces." });
    if(parseInt(backendController.valNum(totalweight))<=0)
        return res.json({ success: false, msg_type:"error", msg:"Weight required! Gold won’t float." });
    if(product=="nd")
        return res.json({ success: false, msg_type:"error", msg:"Please select a product category" });
    if(typeofjewel=="nd")
        return res.json({ success: false, msg_type:"error", msg:"Please select a jewel type" });
    if(subtype=="nd")
        return res.json({ success: false, msg_type:"error", msg:"Please select a subtype" });
    let stone_type = "";
    let stone_count = "";
    let stone_weight = "";
    let stone_price = "";
    let stone_carat_size = "";
    let stone_carat_price = "";
    let stone_total_price = 0;
    let stone_total_weight = 0;
    let stone_html = '';
    const stonepart_arr = stonepart.split("[s~1]");
    if(stonepart_arr[0])
        for (let i=0;i<stonepart_arr.length-1;i++) {
            if(req.body[`stones_${stonepart_arr[i]}`]=="nd")
                return res.json({ success: false, msg_type:"error", msg:"Stone Type is Missing" });
            if(parseFloat(req.body[`stw_${stonepart_arr[i]}`])<=0)
                return res.json({ success: false, msg_type:"error", msg:"Stone Weight is Missing" });
            if(parseFloat(req.body[`caratprice_${stonepart_arr[i]}`])<=0 || parseFloat(req.body[`stp_${stonepart_arr[i]}`])<=0)
                return res.json({ success: false, msg_type:"error", msg:"Stone Price is Missing" });
            stone_type += req.body[`stones_${stonepart_arr[i]}`]+"[s~1]";
            stone_count += req.body[`stc_${stonepart_arr[i]}`]+"[s~1]";
            stone_weight += req.body[`stw_${stonepart_arr[i]}`]+"[s~1]";
            stone_price += req.body[`stp_${stonepart_arr[i]}`]+"[s~1]";
            stone_carat_size += req.body[`caratsize_${stonepart_arr[i]}`]+"[s~1]";
            stone_carat_price += req.body[`caratprice_${stonepart_arr[i]}`]+"[s~1]";
            stone_total_price += parseFloat(backendController.valNum(req.body[`stonestotalprice${stonepart_arr[i]}`]));
            stone_total_weight += parseFloat(backendController.valNum(req.body[`stw_${stonepart_arr[i]}`]));
            stone_html += `<label>${backendController.caps(req.body[`stones_${stonepart_arr[i]}`])} (${req.body[`stw_${stonepart_arr[i]}`]}.G = ${backendController.money(backendController.valNum(req.body[`stp_${stonepart_arr[i]}`]))}) [${backendController.valNum(req.body[`caratsize_${stonepart_arr[i]}`])}.ct X ${backendController.valNum(req.body[`caratprice_${stonepart_arr[i]}`])}] = ${backendController.money(backendController.valNum(req.body[`stonestotalprice${stonepart_arr[i]}`]))}</label>`;
        }
    const weight = backendController.valNum(totalweight) - backendController.valNum(stone_total_weight);
    let rate = 0;
    let jewel_rate = 0;
    if(control[0].spltype!='nd' && control[0].spltype)
    {
        rate = control[0].splprice;
        if(control[0].spltype=="gram")
        jewel_rate = parseFloat(backendController.valNum(rate)) * parseFloat(backendController.valNum(weight));
        else
        jewel_rate = parseFloat(backendController.valNum(rate));
    }
    else
    {
        rate = req.body[product];
        jewel_rate = parseFloat(backendController.valNum(rate)) * parseFloat(backendController.valNum(weight));
    }
    const jewel_raw_Amount = parseFloat(backendController.valNum(jewel_rate));
    stone_type = backendController.rtrim(stone_type, "[s~1]");
    stone_count = backendController.rtrim(stone_count, "[s~1]");
    stone_weight = backendController.rtrim(stone_weight, "[s~1]");
    stone_price = backendController.rtrim(stone_price, "[s~1]");
    stone_carat_size = backendController.rtrim(stone_carat_size, "[s~1]");
    stone_carat_price = backendController.rtrim(stone_carat_price, "[s~1]");
    let min_w_gram = 0;
    let min_w_amount = 0;
    let min_w_perc = 0;
    if (control[0].wastetype == "perc")
    {
        min_w_perc = control[0].minwaste;
        min_w_gram = parseFloat(backendController.valNum(control[0].minwaste / 100)) * parseFloat(backendController.valNum(weight));
        min_w_amount = parseFloat(backendController.valNum(min_w_gram)) * parseFloat(backendController.valNum(rate));
    }
    else if (control[0].wastetype == "amt")
    {
        min_w_amount = parseFloat(backendController.valNum(control[0].minwaste)) * parseFloat(backendController.valNum(weight));
    }
    let max_w_gram = 0;
    let max_w_amount = 0;
    let max_w_perc = 0;
    let w_read_only = "";
    if (control[0].wastetype == "perc")
    {
        max_w_perc = control[0].maxwaste;
        max_w_gram = parseFloat(backendController.valNum(control[0].maxwaste / 100)) * parseFloat(backendController.valNum(weight));
        max_w_amount = parseFloat(backendController.valNum(max_w_gram)) * parseFloat(backendController.valNum(rate));
    }
    else if (control[0].wastetype == "amt")
    {
        w_read_only = "readonly";
        max_w_amount = parseFloat(backendController.valNum(control[0].maxwaste)) * parseFloat(backendController.valNum(weight));
    }
    let min_mc_gram = 0;
    let min_mc_amount = 0;
    let min_mc_perc = 0;
    if (control[0].mctype == "perc")
    {
        min_mc_perc = control[0].minmc;
        min_mc_gram = parseFloat(backendController.valNum(control[0].minmc / 100)) * parseFloat(backendController.valNum(weight));
        min_mc_amount = parseFloat(backendController.valNum(min_mc_gram)) * parseFloat(backendController.valNum(rate));
    }
    else if (control[0].mctype == "amt")
    {
        min_mc_amount = parseFloat(backendController.valNum(control[0].minmc)) * parseFloat(backendController.valNum(weight));
    }
    let max_mc_gram = 0;
    let max_mc_amount = 0;
    let max_mc_perc = 0;
    let mc_read_only = "readonly";
    if (control[0].mctype == "perc")
    {
        max_mc_perc = control[0].maxmc;
        max_mc_gram = parseFloat(backendController.valNum(control[0].maxmc / 100)) * parseFloat(backendController.valNum(weight));
        max_mc_amount= parseFloat(backendController.valNum(max_mc_gram)) * parseFloat(backendController.valNum(rate));
    }
    else if (control[0].mctype == "amt")
    {
        mc_read_only = "readonly";
        max_mc_amount= parseFloat(backendController.valNum(control[0].maxmc)) * parseFloat(backendController.valNum(weight));
    }    
    const total_jewel_amount = parseFloat(stone_total_price) + parseFloat(waste) + parseFloat(mc) + parseFloat(jewel_raw_Amount);
    try{
        let edit_and_delete = `<div class='flex-with-space-edit-delete'>
                <img src="/images/edit.png" width="25" height="25" class="edit-addJewel" title="" id="edit-addjewel_${addid}" uniquekey="${addid}"/>
                <img src="/images/delete.png" class="delete-addJewel" title="" width="25" height="25" id="edit-addjewel_${addid}" uniquekey="${addid}"/>
              </div>`;
        html = `
                <td>${backendController.generateImageTag(imgpath_photo, 'profile', 'popup-img', 'width: 100px;border-radius: 10%;height: 100px;object-fit: cover;')}</td>
                <td>${pcs}</td>
                <td><label>${backendController.caps(control[0].category)} - ( ${backendController.caps(control[0].code)} ) ${backendController.caps(control[0].subtype)}</label><br>
                <div class='jewels-permenent' id='jwlper_${addid}'><div class="display-f adj"><label><b>Waste</b></label>
                <input type="hidden" name="minwastep_${addid}" id="minwastep_${addid}" value="${min_w_perc}"/>
                <input type="hidden" name="minwasteg_${addid}" id="minwasteg_${addid}" value="${min_w_gram}"/>
                <input type="hidden" name="minwastea_${addid}" id="minwastea_${addid}" value="${min_w_amount}"/>
                <input type="hidden" name="maxwastep_${addid}" id="maxwastep_${addid}" value="${max_w_perc}"/>
                <input type="hidden" name="maxwasteg_${addid}" id="maxwasteg_${addid}" value="${max_w_gram}"/>
                <input type="hidden" name="maxwastea_${addid}" id="maxwastea_${addid}" value="${max_w_amount}"/>
                <div><input type="number" name="wastep_${addid}" id="wastep_${addid}" class='adj-box jwl_range_adjusters ${w_read_only}' value="${backendController.money(max_w_perc,3,0)}"/><label>.%</label></div>
                <div><input type="number" name="wasteg_${addid}" id="wasteg_${addid}" class='adj-box jwl_range_adjusters ${w_read_only}' value="${backendController.money(max_w_gram,3,0)}"/><label>.G</label></div>
                <div><input type="number" name="wastea_${addid}" id="wastea_${addid}" class='adj-box jwl_range_adjusters' value="${backendController.money(waste,3,0)}"/><label>./-</label></div></div>
                <input type='range' id="waste_${addid}" name="waste_${addid}" class='jwl_range_adjusters' step='1' ctype='${control[0].wastetype}' minwaste='${control[0].minwaste}' maxwaste='${control[0].maxwaste}' min='${min_w_amount}' max='${max_w_amount}' value='${waste}'>
                
                <div class="display-f adj"><label><b>MC</b></label>
                <input type="hidden" name="minmcp_${addid}" id="minmcp_${addid}" value="${min_mc_perc}"/>
                <input type="hidden" name="minmcg_${addid}" id="minmcg_${addid}" value="${min_mc_gram}"/>
                <input type="hidden" name="minmca_${addid}" id="minmca_${addid}" value="${min_mc_amount}"/>
                <input type="hidden" name="maxmcp_${addid}" id="maxmcp_${addid}" value="${max_mc_perc}"/>
                <input type="hidden" name="maxmcg_${addid}" id="maxmcg_${addid}" value="${max_mc_gram}"/>
                <input type="hidden" name="maxmca_${addid}" id="maxmca_${addid}" value="${max_mc_amount}"/>
                <div><input type="number" name="mcp_${addid}" id="mcp_${addid}" class='adj-box jwl_range_adjusters ${mc_read_only}' value="${backendController.money(max_mc_perc,3,0)}"/><label>.%</label></div>
                <div><input type="number" name="mcg_${addid}" id="mcg_${addid}" class='adj-box jwl_range_adjusters ${mc_read_only}' value="${backendController.money(max_mc_gram,3,0)}"/><label>.G</label></div>
                <div><input type="number" name="mca_${addid}" id="mca_${addid}" class='adj-box jwl_range_adjusters' value="${backendController.money(mc,3,0)}"/><label>./-</label></div></div>
                <input type='range' id="mc_${addid}" name="mc_${addid}" class='jwl_range_adjusters' step='1' ctype='${control[0].mctype}' minmc='${control[0].minmc}' maxmc='${control[0].maxmc}' min='${min_mc_amount}' max='${max_mc_amount}' value='${mc}'>
                <input type="hidden" name="splprice_${addid}" id="splprice_${addid}" ctype='${control[0].spltype}' value="${control[0].splprice}"/></div>
                </td>
                <td>${stone_html}</td>
                <td>${backendController.money(totalweight,3,1)}</td>
                <td id='individual_jwl_amt_${addid}'>${backendController.money(total_jewel_amount,2,1)}</td>
                <td>${edit_and_delete}</td><input type='hidden' id='individual-jwl${addid}' name='individual-jwl${addid}' class='all_jewel_amount' value='${total_jewel_amount}'>
                <input type='hidden' id='individual-jwl-wt${addid}' name='individual-jwl-wt${addid}' class='all_jewel_weight' value='${totalweight}'>
                <input type='hidden' id='stone_type_${addid}' name='stone_type_${addid}' class='' value='${stone_type}'>
                <input type='hidden' id='jewelphoto_${addid}' name='jewelphoto_${addid}' class='' value='${imgpath_photo}'>
                <input type='hidden' id='pcs_${addid}' name='pcs_${addid}' class='' value='${pcs}'>
                <input type='hidden' id='code_${addid}' name='code_${addid}' class='' value='${control[0].code}'>
                <input type='hidden' id='product_${addid}' name='product_${addid}' class='' value='${control[0].category}'>
                <input type='hidden' id='jewel_type_${addid}' name='jewel_type_${addid}' class='' value='${control[0].jeweltype}'>
                <input type='hidden' id='sub_type_${addid}' name='sub_type_${addid}' class='' value='${control[0].subtype}'>
                <input type='hidden' id='jewel_rate_${addid}' name='jewel_rate_${addid}' class='' value='${rate}'>
                <input type='hidden' id='spltype_${addid}' name='spltype_${addid}' class='' value='${control[0].spltype}'>
                <input type='hidden' id='mctype_${addid}' name='mctype_${addid}' class='' value='${control[0].mctype}'>
                <input type='hidden' id='wastetype_${addid}' name='wastetype_${addid}' class='' value='${control[0].wastetype}'>
                <input type='hidden' id='stone_count_${addid}' name='stone_count_${addid}' class='' value='${stone_count}'>
                <input type='hidden' id='stone_weight_${addid}' name='stone_weight_${addid}' class='' value='${stone_weight}'>
                <input type='hidden' id='stone_price_${addid}' name='stone_price_${addid}' class='' value='${stone_price}'>
                <input type='hidden' id='stone_carat_size_${addid}' name='stone_carat_size_${addid}' class='' value='${stone_carat_size}'>
                <input type='hidden' id='stone_carat_price_${addid}' name='stone_carat_price_${addid}' class='' value='${stone_carat_price}'>
                <input type='hidden' id='stone_total_price_${addid}' name='stone_total_price_${addid}' class='totalstoneprices' value='${stone_total_price}'>
                <input type='hidden' id='stone_total_weight_${addid}' name='stone_total_weight_${addid}' class='totalstoneweights' value='${stone_total_weight}'>`;

        res.json({ success: true, html: html, id:addid });
    }
    catch(error) 
    {
        console.error('Error in Fetch order jewel adding :', error.message);
    }
});

router.post("/fetchDetails", async (req, res) => {
    const {customer} = req.body;
    try{
            const customer_details = await backendController.selectQuery(`select * from users where deleteon=? and branch=? and userid=?`,['0000-00-00',userToken.site,customer]);
            res.json({success:true, response: customer_details});
    } catch (error) {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg: "Server Error" });
    }
});

router.get("/customer", async (req, res) => {
    backendController.selectQuery(`SELECT distinct name,userid,primaryphonenumber FROM users where deleteon=? and branch=? and typeofpeople=?`,['0000-00-00',userToken.site,'customer'])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['userid']}">${backendController.caps(item['name'])} - ${backendController.caps(item['primaryphonenumber'])}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.post("/jewel_control", async (req, res) => {
    const {product,typeofjewel,subtype,totalweight,pcs} = req.body;
    try{
        const control = await backendController.selectQuery(`SELECT * FROM jewel_master_control where deleteon=? and branch=? and category=? and code=? and subtype=? and minweight<=? and maxweight>=? order by uniqueid desc`,['0000-00-00',userToken.site,product,typeofjewel,subtype,parseFloat(totalweight/pcs),parseFloat(totalweight/pcs)]);
        if(!control[0])
            return res.json({ success: false, msg_type:"error", msg:"Jewel control specifications have not been defined for this weight category." });
        res.json({ success: true, response: control[0]});
    }
    catch(e)
    {
        console.error('Error in Fetch order jewel adding :', error.message);
    }
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

router.get("/modes", async (req, res) => {
    let options_arr = [];
    options_arr.push(`<option value="old">Old</option>`);
    options_arr.push(`<option value="coin">Coin</option>`);
    options_arr.push(`<option value="exchange">Exchange</option>`);
    options_arr.push(`<option value="pure">Pure</option>`);
    const html = options_arr.join('');
    res.json({ success: true, response: html });
 });

module.exports = router;