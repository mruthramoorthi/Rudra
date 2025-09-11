const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const { options } = require("pdfkit");
const { route } = require("../pages");
const router = express.Router();

// Route to generate and serve PDF
router.get("/pdf", async (req, res) => {
    try {
        // Call the createPDF function to generate the PDF document
        const pdfDoc = await backendController.createPDF(); // to create a pdf
        const font = await backendController.createFont(pdfDoc,'Helvetica'); // to create a font type
        const Bfont = await backendController.createFont(pdfDoc,'Helvetica-Bold'); // to create a font type
        // A4 dimensions: 595.28 x 841.89 (width x height) ethathu theriyutha
        const page = pdfDoc.addPage([595.28, 841.89]); // a4 size
        const { width, height } = page.getSize();

        const all_pages = await backendController.selectQuery("select distinct t1.role as role,t1.path as path,t2.pagename as pagename from all_pages_roles as t1 join all_pages_details as t2 on t1.path=t2.path where t1.deleteon=? and t2.deleteon=? group by t1.role,t1.path",['0000-00-00','0000-00-00']);
        // Add text to the A4 page
        // page.drawText('Hello, PDF-lib on A4 Sheet! hoo', {x: 50, y: 750, font: font, size: 30});
        // page.drawText('This PDF is sized to A4 dimensions.', {x: 50, y: 700, font: font,size: 20});

        const cmToPoints = 28.35; // 1 cm in PDF points
        const margin = cmToPoints; // 1 cm margin on each side
        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();

        const tableMarginLeft = margin; // Left margin
        const tableMarginTop = pageHeight - margin; // Top margin
        const sNoColumnWidth = 50; // Width for S.No column
        const remainingWidth = pageWidth - 2 * margin - sNoColumnWidth;
        const columnWidth = remainingWidth / 2; // Divide remaining space equally for Path and Page Name columns
        const rowHeight = 20; // Height of each row

        // Function to draw a rectangle (closed table cell)
        const drawRectangle = (x, y, width, height) => {
        page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness: 0.5 }); // Top border
        page.drawLine({ start: { x, y }, end: { x, y: y - height }, thickness: 0.5 }); // Left border
        page.drawLine({ start: { x: x + width, y }, end: { x: x + width, y: y - height }, thickness: 0.5 }); // Right border
        page.drawLine({ start: { x, y: y - height }, end: { x: x + width, y: y - height }, thickness: 0.5 }); // Bottom border
        };

        // Function to center-align text
        const drawCenteredText = (text, x, y, width, font, fontSize) => {
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const centerX = x + (width - textWidth) / 2;
        page.drawText(text, { x: centerX, y, font, size: fontSize });
        };

        // Function to center-align text
        const drawLeftText = (text, x, y, width, font, fontSize) => {
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const centerX = x + (width);
        page.drawText(text, { x, y, font, size: fontSize });
        };

        // Draw the table header
        drawRectangle(tableMarginLeft, tableMarginTop, sNoColumnWidth, rowHeight); // S.No header
        drawRectangle(tableMarginLeft + sNoColumnWidth, tableMarginTop, columnWidth, rowHeight); // Path header
        drawRectangle(tableMarginLeft + sNoColumnWidth + columnWidth, tableMarginTop, columnWidth, rowHeight); // Page Name header

        // Center-align headers
        drawCenteredText('S.No', tableMarginLeft, tableMarginTop - 15, sNoColumnWidth, Bfont, 14);
        drawCenteredText('Path', tableMarginLeft + sNoColumnWidth, tableMarginTop - 15, columnWidth, Bfont, 14);
        drawCenteredText('Page Name', tableMarginLeft + sNoColumnWidth + columnWidth, tableMarginTop - 15, columnWidth, Bfont, 14);
        let head = null;

        // Loop through all_pages and draw each row
        all_pages.forEach((pageData, index) => {
            const currentRowY = tableMarginTop - (index + 1) * rowHeight;

            // Check if the role has changed
            if (head !== pageData.role) {
                // If the role has changed, draw a single rectangle containing the role centered
                const roleText = backendController.capitalizeFirstLetters(pageData.role);
                
                // Draw a rectangle spanning the entire table width (this will be the single rectangle)
                drawRectangle(tableMarginLeft, currentRowY, pageWidth - 2 * margin, rowHeight); 

                // Draw the role text in the center of this rectangle
                drawCenteredText(roleText, tableMarginLeft, currentRowY - 15, pageWidth - 2 * margin, Bfont, 12);

                // Stop drawing rows if content exceeds the bottom margin
                if (currentRowY - rowHeight < margin) return;
            }

            head = pageData.role;

            // Draw the table rows for the regular content
            drawRectangle(tableMarginLeft, currentRowY, sNoColumnWidth, rowHeight); // S.No column
            drawRectangle(tableMarginLeft + sNoColumnWidth, currentRowY, columnWidth, rowHeight); // Path column
            drawRectangle(tableMarginLeft + sNoColumnWidth + columnWidth, currentRowY, columnWidth, rowHeight); // Page Name column

            // Draw the content (center-aligned for S.No, left-aligned for Path and Page Name)
            drawCenteredText((index + 1).toString(), tableMarginLeft, currentRowY - 15, sNoColumnWidth, font, 12); // S.No
            drawLeftText(backendController.capitalizeFirstLetters(pageData.path), tableMarginLeft + sNoColumnWidth + 5, currentRowY - 15, columnWidth, font, 12); // Path
            drawLeftText(backendController.capitalizeFirstLetters(pageData.pagename), tableMarginLeft + columnWidth + sNoColumnWidth + 5, currentRowY - 15, columnWidth, font, 12); // Page Name
        });

        
        // Generate the PDF bytes using generatePDF
        const pdfBytes = await backendController.generatePDF(pdfDoc);

        // Set the response headers for inline display
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline; filename=generated.pdf");

        // Send the PDF buffer directly
        res.end(pdfBytes); // No need to wrap in Buffer.from() since pdfBytes is already a Uint8Array
    } catch (err) {
        console.error("Error generating PDF:", err);
        res.status(500).send("Error generating PDF");
    }
});

router.get("/loaduser", async (req, res) => {
    backendController.selectQuery(`SELECT distinct path FROM all_pages_details where deleteon='0000-00-00'`)
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            let optionTag = null;
            let lastOne = item['path'].split("\\")[item['path'].split("\\").length - 1];
            if(lastOne.endsWith(".hbs"))
            {
                optionTag = `<option value="${item['path']}">${lastOne}</option>`;
                options_arr.push(optionTag);
            }
        });
        
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.get("/loadrole", async (req, res) => {
    backendController.selectQuery(`SELECT role,companyname,priority FROM roles where deleteon='0000-00-00'`)
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
                let optionTag = `<option value="${item['role']}">${item['role']}</option>`;
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


// POST route to handle form submission
router.post('/update',async (req, res) => {
    const { clickedId } = req.body;
    const uniquekey = [clickedId.split("status")[1]];
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const results = await backendController.selectQuery(`SELECT * FROM all_pages_roles where deleteon=? and uniqueid=?`,['0000-00-00',...uniquekey])
          let sts = 1;
          if(results[0].status=='1')
            sts = 0;
            const all_path = results[0].path.split("\\");
            for (const item of all_path) 
                await backendController.updateQuery("all_pages_roles",{status:sts},'path=? and route=? and role=?',[results[0].path,item,results[0].role])
        } catch (error) {
          console.error('Error in update:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});


router.post("/select", async (req, res) => {
    let { page = 1, limit = 10, datas } = req.body;  // Default page 1 and limit 10
    // const offset = (page - 1) * limit;
    let querySize = '';
    let params = [];
    if(datas)
    {
        if(datas[0]!="nd")
        {
            querySize += ' and path=?';
            params.push(datas[0]);
        }
        if(datas[1]!="nd")
        {
            querySize += ' and role=?';
            params.push(datas[1]);
        }
    }
    try
    {
        const results = await backendController.selectQuery(`SELECT * FROM all_pages_roles where deleteon=?${querySize}`,['0000-00-00',...params]);
        const totalRows = await backendController.selectQuery(`SELECT count(*) as total FROM all_pages_roles where deleteon=?${querySize}`,['0000-00-00',...params]);
        // const regular = backendController.updateQuery("all_pages_roles",{role:'owneri',route:'12'},'route=?',['master'])
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
            let edit_and_delete = `<div class='flex-with-space-edit-delete'>
                        <img src="/images/edit.png" width="25" height="25" class="edit-icon" title="" id="edit-user${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>
                        <img src="/images/delete.png" class="delete-icon" title="" width="25" height="25" id="delete-user${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>
                    </div>`;
            if (item.route.endsWith(".hbs"))
            {
                let checked = "";
                if(item.status==1)
                    checked = "checked";
                sno++;
                htmlContent += `<tr><td>${sno}</td><td>${item.path}</td><td>${item.route}</td><td>${item.role}</td><td>${htmls.createCustomCheckbox({id:"status"+item.uniqueid, className:"just-check", placeholder:" ", style:"", checked:checked})}</td><td>${edit_and_delete}</td></tr>`;
            }
        });

        sno = 0;
        if (!htmlContent)
            htmlContent = "There is No Data to Load";
        return htmlContent;
    } catch (error) {
        console.error('Error in generateHTMLData:', error);  // Handle rejection properly here
        throw error;  // Re-throw error for higher-level handling
    }
}

// POST route to handle form submission
router.post('/delete',async (req, res) => {
    const { uniquekey } = req.body;
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const deleteid = await backendController.deleted({ body : {tableName :'all_pages_roles', whereCondition: `uniqueid = ?`, values : [uniquekey]}});
          if (deleteid.success)
            res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});

// router.post("/update", async (req, res) => {
//     let { uniquekey } = req.body;  // Default page 1 and limit 10
//     if (uniquekey) {
//           // Use for...of for synchronous iteration
//           const results = await backendController.selectQuery("SELECT * FROM all_pages_roles WHERE deleteon=? AND uniqueid = ?",['0000-00-00',uniquekey]);
//     }
//     else
//         return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
// });

router.post("/insert", async (req, res)=>{
    const {pages, roles, status, uniquekey} = req.body;
    const all_path = pages.split("\\");
    const already = await backendController.selectQuery(`SELECT * FROM all_pages_roles where path=? and role=? and deleteon=? and uniqueid!=?`,[pages,roles,'0000-00-00',uniquekey]);
    // Validate the 'pages' and 'roles' fields (should not be "nd")
    if(already[0])
        return res.json({ msg: "Already Exist this page for this Role.", msg_type: 'error', success: false });
    if (pages === 'nd') {
        return res.json({ msg: "Pages value is invalid", msg_type: 'error', success: false });
    }

    let changed = 0;
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          await backendController.deleted({tableName :'all_pages_roles', whereCondition : `uniqueid = ?`, values : [uniquekey]});
          changed=1;
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }      
    try
    {
        for (const item of all_path) 
        {  
            // Use for...of for synchronous iteration
            const results = await backendController.selectQuery(
                "SELECT * FROM all_pages_roles WHERE deleteon='0000-00-00' AND route = ? AND role = ?",
                [item, roles]
            );
    
            if (results.length > 0 && item.endsWith(".hbs"))
                return res.json({ success: false, msg: "Route and Right already exist", msg_type:'error' });
            else if(results.length > 0 )
            {
                continue;
            }
            if(item)
            {     
                // Insert the new record if no existing record found
                backendController.insert({body: {tableName: 'all_pages_roles',data: {role:roles, route: item,path:pages,status,}}});
            }
        }
        // Ensure you handle the response outside of the asynchronous block
        if (changed === 0)
            res.json({ msg: "Data entered successfully", msg_type: 'success', success: true });
        else if (changed === 1)
            res.json({ msg: "Data edited successfully", msg_type: 'success', success: true });
        else
        {
            console.log('Insert failed');
            res.json({
                success: false,
                msg: 'Error occurred while inserting data',
                msg_type: 'error',
                error: insertResponse.message || 'Unknown error'
            });
        }
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



module.exports = router;