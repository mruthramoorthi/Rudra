const express = require("express");
const backendController = require('../../controllers/backend-functions');
const router = express.Router();
const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default;


router.post("/insert", async (req, res)=>{
    let {product,jewelname,jewelcode,measure,typeofjewel,jewelimg = "",editjeweltype,editcategory,allrowid} = req.body;

    try{

        // Split the `allrowid` into an array of individual row IDs
        const rowIds = [...new Set(allrowid.split(','))];

        // Prepare an array to hold the data that will be inserted
        const insertData = [];
        let edit = 0;
        if((editjeweltype===jewelname) && (product===editcategory))
        {
            edit++;
            const deleteid = await backendController.deleted({ body : {'tableName' :'jewel_master_control', 'whereCondition': `category=? and jeweltype=? and branch=?`,'values':[editcategory, editjeweltype, userToken.site]}});
        }
        // Loop through each rowId and collect the data for insertion
        for (const rowId of rowIds) {
            // Extract the values associated with the current rowId
            const subtype = req.body[`subtype-${rowId}`];
            const minwt = req.body[`minwt-${rowId}`];
            const maxwt = req.body[`maxwt-${rowId}`];
            const spltype = req.body[`spltype-${rowId}`];
            const splprice = req.body[`splprice-${rowId}`] || 0;
            const wastetype = req.body[`wastetype-${rowId}`];
            const minwaste = req.body[`minwaste-${rowId}`] || 0;
            const maxwaste = req.body[`maxwaste-${rowId}`] || 0;
            const mctype = req.body[`mctype-${rowId}`];
            const minmc = req.body[`minmc-${rowId}`] || 0;
            const maxmc = req.body[`maxmc-${rowId}`] || 0;
            const comtype = req.body[`comtype-${rowId}`];
            const commission = req.body[`commission-${rowId}`] || 0;
            const data = {spltype,splprice,category:product,jeweltype:jewelname,code:jewelcode,measure,saletype:typeofjewel,samplepic:jewelimg,subtype,minweight:minwt,maxweight:maxwt,wastetype,minwaste,maxwaste,mctype,minmc,maxmc,commissiontype:comtype,commissionvalue:commission};
            backendController.insert({body: {tableName: 'jewel_master_control',data: data}});
        }
        if(edit!==0)
            res.json({msg: "Data Updated successfully", msg_type : 'success', success: true});
        else
            res.json({msg: "Data entered successfully", msg_type : 'success', success: true});
    }
    catch (error)
    {
        console.error('Error during insert operation:', error);
        res.json({
            success: false,
            msg: 'Error occurred while inserting data',
            msg_type: 'error',
            error: error.message || 'Unknown error'
        });
    }    
});

// POST route to handle form submission
router.post('/delete',async (req, res) => {
    const { category, jeweltype } = req.body;
    if (category && jeweltype) {
        try {
            // Call the `deleted()` function with the necessary arguments
            const deleteid = await backendController.deleted({ body : {'tableName' :'jewel_master_control', 'whereCondition': `category=? and jeweltype=? and branch=?`,'values':[category, jeweltype, userToken.site]}});
            if (deleteid.success)
                res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});

router.post("/select", async (req, res) => {
    try
    {
        const results = await backendController.selectQuery("SELECT DISTINCT category,jeweltype,code,measure,saletype,samplepic,GROUP_CONCAT(CONCAT(subtype, '[r~1]', minweight, '[r~1]', maxweight,'[r~1]',wastetype,'[r~1]',minwaste,'[r~1]',maxwaste,'[r~1]',mctype,'[r~1]',minmc,'[r~1]',maxmc,'[r~1]',commissiontype,'[r~1]',commissionvalue)) as combine FROM `jewel_master_control` where deleteon=? and branch=? GROUP by jeweltype,code,category;",['0000-00-00', userToken.site]);
        const totalRows = await backendController.selectQuery(`SELECT count(*) as total FROM jewel_master_control where deleteon=? and branch=?`,['0000-00-00',userToken.site]);
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
        results.forEach(item => {
            // Step 1: First, split the combined string by commas to separate the subtypes
            const combinedData = item.combine.split(',');

            // Step 2: Then, split each element by [r~1] to separate individual values (subtype, minwt, maxwt, etc.)
            const rowsData = combinedData.map(entry => entry.split('[r~1]'));

            // For each item, create a row with rowspan if necessary
            let firstRow = true;
            rowsData.forEach((dataRow, index) => {
                let edit_and_delete = `<div class='flex-with-space-edit-delete'>`;
                if (!userToken.rights_result || userToken.rights_result.edit_rights === 0)
                    edit_and_delete += `<img src="/images/edit.png" class="edit-row" title="" width="25" height="25" id="${item.category+item.jeweltype}" category="${item.category}" jeweltype="${item.jeweltype}" datas='${JSON.stringify(item)}'/>`;
                if (!userToken.rights_result || userToken.rights_result.delete_rights === 0)
                    edit_and_delete += `<img src="/images/delete.png" class="delete-row" title="" width="25" height="25" id="${item.category+item.jeweltype}" category="${item.category}" jeweltype="${item.jeweltype}" datas='${JSON.stringify(item)}'/>`;
                edit_and_delete += `</div>`;

                sno++;

                // Create the first row with the remaining cells
                if (firstRow) {
                    htmlContent += `
                        <tr>
                            <td rowspan="${rowsData.length}">${sno}</td>
                            <td rowspan="${rowsData.length}">${backendController.caps(item.category)}</td>
                            <td rowspan="${rowsData.length}">${backendController.caps(item.jeweltype)}</td>
                            <td>${backendController.caps(dataRow[0])}</td>
                            <td>${dataRow[1]} - ${dataRow[2]}</td>
                            <td>(${dataRow[3]}) ${dataRow[4]} - ${dataRow[5]}</td>
                            <td>(${dataRow[6]}) ${dataRow[7]} - ${dataRow[8]}</td>
                            <td>(${dataRow[9]}) ${dataRow[10]}</td>
                            <td rowspan="${rowsData.length}">${edit_and_delete}</td>
                        </tr>
                    `;
                    firstRow = false;
                } else {
                    // For subsequent rows, only add the remaining columns
                    htmlContent += `
                        <tr>
                            <td>${backendController.caps(dataRow[0])}</td>
                            <td>${dataRow[1]} - ${dataRow[2]}</td>
                            <td>(${dataRow[3]}) ${dataRow[4]} - ${dataRow[5]}</td>
                            <td>(${dataRow[6]}) ${dataRow[7]} - ${dataRow[8]}</td>
                            <td>(${dataRow[9]}) ${dataRow[10]}</td>
                        </tr>
                    `;
                }
            });
        });

        sno = 0;
        if (!htmlContent)
            htmlContent = "There is No Data to Load";
        return htmlContent;
    } catch (error) {
        console.error('Error in generateHTMLData:', error);
        throw error;  // Re-throw error for higher-level handling
    }
}

// Route to generate and serve PDF
router.get("/pdf", async (req, res) => {
    try {
        // Fetch data from the database
        const all_users = await backendController.selectQuery("select * from jewel_master_control where deleteon=? and branch=? order by category,jeweltype asc", ["0000-00-00",userToken.site]);
        
        // Create a new PDF document with A4 size
        const doc = new jsPDF({
            orientation: "landscape", // "portrait" or "landscape"
            unit: "mm",              // Measurement unit (mm)
            format: "a4",            // Set format to A4
        });

        // Add the heading "All Users"
        doc.setFontSize(16);

        // Get the page width and calculate the center
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;

        // Add the text, centered at the calculated position
        doc.text("All Users", centerX, 10, { align: "center" });


        // Get the current date and time
        const currentDate = new Date();
        const dateString = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;

        // Set font size for the date
        doc.setFontSize(10);

        // Get page width and calculate the right corner position
        const textWidth = doc.getTextWidth(dateString);
        const xPosition = pageWidth - textWidth - 15; // 10 is for padding from the edge

        // Add the date string to the top-right corner
        doc.text(dateString, xPosition, 10, { align: "left" });


        // Prepare the data for the table
        const filteredRows = all_users.map((row, index) => [
            index + 1, 
            row.category, 
            row.jeweltype+" ("+row.code+")", 
            row.subtype,
            row.minweight + " - " + row.maxweight, 
            row.wastetype, 
            row.minwaste+" - "+row.maxwaste,
            row.mctype,
            row.minmc+" - "+row.maxmc,
            "("+row.commissiontype+") "+row.commissionvalue
        ]);

        const columns = ["#", "Category", "Name", "Subtype", "Weight", "Waste Type", "Wastage", "Mc Type", "Mc", "Commission"];

        // Add the table to the PDF
autoTable(doc, {
    head: [columns], // Add column headers
    body: filteredRows, // Add filtered data
    startY: 15, // Start position (Y-axis) for the table
    headStyles: {
        halign: 'center', // Center align the heading columns
        fontSize: 13, // Font size for headers
        textColor: [255, 255, 255], // Black text color
    },
});


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

router.get("/loadCate", async (req, res) => {
    backendController.selectQuery(`SELECT distinct product,category FROM product_category where deleteon=? and branch=?`,['0000-00-00',userToken.site])
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
router.get("/loadMeasure", async (req, res) => {
    let options_arr = [];
    options_arr.push(`<option value="cm">Centi meater</option>`);
    options_arr.push(`<option value="mm">Milli meater</option>`);
    options_arr.push(`<option value="inch">Inch</option>`);
    options_arr.push(`<option value="feet">Reet</option>`);
    const html = options_arr.join('');
    res.json({ success: true, response: html });
});
router.get("/typeJewel", async (req, res) => {
    let options_arr = [];
    options_arr.push(`<option value="tag">Tagged</option>`);
    options_arr.push(`<option value="untag">Un Tagged</option>`);
    options_arr.push(`<option value="both">Both</option>`);
    const html = options_arr.join('');
    res.json({ success: true, response: html });
});
router.get("/wasteType", async (req, res) => {
    let options_arr = [];
    options_arr.push(`<option value="perc">Percent</option>`);
    options_arr.push(`<option value="amt">Amount</option>`);
    const html = options_arr.join('');
    res.json({ success: true, response: html });
});
router.get("/giftType", async (req, res) => {
    let options_arr = [];
    options_arr.push(`<option value="pcs">Pcs</option>`);
    options_arr.push(`<option value="gram">Gram</option>`);
    const html = options_arr.join('');
    res.json({ success: true, response: html });
});
router.get("/mcType", async (req, res) => {
    let options_arr = [];
    options_arr.push(`<option value="perc">Percent</option>`);
    options_arr.push(`<option value="amt">Amount</option>`);
    const html = options_arr.join('');
    res.json({ success: true, response: html });
});
router.get("/comType", async (req, res) => {
    let options_arr = [];
    options_arr.push(`<option value="pcs">Pieces</option>`);
    options_arr.push(`<option value="wt">Weight</option>`);
    const html = options_arr.join('');
    res.json({ success: true, response: html });
});

module.exports = router;