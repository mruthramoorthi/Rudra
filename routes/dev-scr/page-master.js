const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const { options } = require("pdfkit");
const fs = require('fs');
const { route } = require("../pages");
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const router = express.Router();

router.get("/loaduser", async (req, res) => {
    backendController.selectQuery(`SELECT route FROM all_pages where deleteon='0000-00-00'`)
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            let optionTag = null;
            let lastOne = item['route'].split("\\")[item['route'].split("\\").length - 1];
            if(lastOne.endsWith(".hbs"))
            {
                optionTag = `<option value="${item['route']}">${lastOne}</option>`;
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

router.get('/pdf', async (req, res) => {
  try {
    const pdfDoc = await backendController.createPDF(); // your method to create a pdf-lib doc
    const font = await backendController.createFont(pdfDoc, 'Helvetica');
    const Bfont = await backendController.createFont(pdfDoc, 'Helvetica-Bold');

    const all_pages = await backendController.selectQuery(
      "select distinct description,pagename from all_pages_details where deleteon=?",
      ['0000-00-00']
    );

    // A4 size in points
    const pageWidth = 595.28;
    const pageHeight = 841.89;

    // Margins and sizing
    const cmToPoints = 28.35;
    const margin = cmToPoints; // 1 cm margin

    const sNoColumnWidth = 50;
    const remainingWidth = pageWidth - 2 * margin - sNoColumnWidth;
    const columnWidth = remainingWidth / 2;

    const fontSize = 11;
    const padding = 5;
    const lineHeight = fontSize + 2;
    const headerHeight = 25;

    // Helper to split text into lines to fit maxWidth
    function splitTextToLines(text, font, fontSize, maxWidth) {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    }

    // Draw table header function (for new pages)
    function drawHeader(page, y) {
      drawRectangle(page, margin, y, sNoColumnWidth, headerHeight);
      drawRectangle(page, margin + sNoColumnWidth, y, columnWidth, headerHeight);
      drawRectangle(page, margin + sNoColumnWidth + columnWidth, y, columnWidth, headerHeight);

      drawCenteredText(page, 'S.No', margin, y - 15, sNoColumnWidth, Bfont, 14);
      drawCenteredText(page, 'Page Name', margin + sNoColumnWidth, y - 15, columnWidth, Bfont, 14);
      drawCenteredText(page, 'Description', margin + sNoColumnWidth + columnWidth, y - 15, columnWidth, Bfont, 14);
    }

    // Drawing helper functions (pass page explicitly)
    function drawRectangle(page, x, y, width, height) {
      page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness: 0.5 });
      page.drawLine({ start: { x, y }, end: { x, y: y - height }, thickness: 0.5 });
      page.drawLine({ start: { x: x + width, y }, end: { x: x + width, y: y - height }, thickness: 0.5 });
      page.drawLine({ start: { x, y: y - height }, end: { x: x + width, y: y - height }, thickness: 0.5 });
    }

    function drawCenteredText(page, text, x, y, width, font, fontSize) {
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const centerX = x + (width - textWidth) / 2;
      page.drawText(text, { x: centerX, y, font, size: fontSize });
    }

    function drawLeftText(page, text, x, y, font, fontSize) {
      page.drawText(text, { x, y, font, size: fontSize });
    }

    // Create first page
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let currentY = pageHeight - margin;

    // Draw header on first page
    drawHeader(page, currentY);

    currentY -= headerHeight;

    // Loop through rows and draw
    for (let index = 0; index < all_pages.length; index++) {
      const data = all_pages[index];
      const sNo = (index + 1).toString();

      // Prepare wrapped lines for page name and description
      const pageNameLines = splitTextToLines(
        backendController.capitalizeFirstLetters(data.pagename),
        font,
        fontSize,
        columnWidth - padding * 2
      );
      const descriptionLines = splitTextToLines(
        backendController.capitalizeFirstLetters(data.description),
        font,
        fontSize,
        columnWidth - padding * 2
      );

      // Determine max lines in row
      const maxLines = Math.max(pageNameLines.length, descriptionLines.length);

      // Calculate dynamic row height
      const rowHeight = Math.max(20, maxLines * lineHeight + padding * 2);

      // Check if new page is needed
      if (currentY - rowHeight < margin) {
        // Add new page
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;

        // Draw header
        drawHeader(page, currentY);
        currentY -= headerHeight;
      }

      // Draw rectangles for each cell
      drawRectangle(page, margin, currentY, sNoColumnWidth, rowHeight);
      drawRectangle(page, margin + sNoColumnWidth, currentY, columnWidth, rowHeight);
      drawRectangle(page, margin + sNoColumnWidth + columnWidth, currentY, columnWidth, rowHeight);

      // Draw S.No centered vertically
      const sNoY = currentY - padding - fontSize - (rowHeight - (fontSize + padding * 2)) / 2;
      drawCenteredText(page, sNo, margin, sNoY, sNoColumnWidth, font, fontSize);

      // Draw pageName left aligned, multiple lines
      for (let i = 0; i < pageNameLines.length; i++) {
        const yPosition = currentY - padding - fontSize - i * lineHeight;
        drawLeftText(page, pageNameLines[i], margin + sNoColumnWidth + padding, yPosition, font, fontSize);
      }

      // Draw description left aligned, multiple lines
      for (let i = 0; i < descriptionLines.length; i++) {
        const yPosition = currentY - padding - fontSize - i * lineHeight;
        drawLeftText(page, descriptionLines[i], margin + sNoColumnWidth + columnWidth + padding, yPosition, font, fontSize);
      }

      currentY -= rowHeight;
    }

    // Generate PDF bytes
    const pdfBytes = await backendController.generatePDF(pdfDoc);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=generated.pdf');
    res.end(pdfBytes);
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).send('Error generating PDF');
  }
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
    }
    try
    {
        const results = await backendController.selectQuery(`SELECT * FROM all_pages_details where deleteon=?${querySize}`,['0000-00-00',...params])
        const totalRows = await backendController.selectQuery(`SELECT count(*) as total FROM all_pages_details where deleteon=?${querySize}`,['0000-00-00',...params])
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
            let checked = "";
            if(item.status==1)
                checked = "checked";
            if (item.route.endsWith(".hbs"))
            {
                sno++;
                htmlContent += `<tr><td>${sno}</td><td>${item.route}</td><td>${item.pagename}</td><td>${htmls.createCustomCheckbox({id:"status"+item.uniqueid, className:"just-check", placeholder:" ", style:"", checked:checked})}</td><td>${edit_and_delete}</td></tr>`;
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
          const deleteid = await backendController.deleted({ body : {'tableName' :'all_pages_details', 'whereCondition': `uniqueid = ?`, 'values':[uniquekey]}});
          if (deleteid.success)
            res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});

// POST route to handle form submission
router.post('/update',async (req, res) => {
    const { clickedId } = req.body;
    const uniquekey = [clickedId.split("status")[1]];
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const results = await backendController.selectQuery(`SELECT * FROM all_pages_details where deleteon=? and uniqueid=?`,['0000-00-00',...uniquekey])
          let sts = 1;
          if(results[0].status=='1')
            sts = 0;
            const all_path = results[0].path.split("\\");
            for (const item of all_path) 
            {  
                console.log(item);
                const update = await backendController.updateQuery("all_pages_details",{status:sts},'path=? and route=?',[results[0].path,item])
                if (update.success && item.endsWith(".hbs"))
                    res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
            }
        } catch (error) {
          console.error('Error in update:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});


router.post("/insert", async (req, res)=>{
    const {pagename, pages, description, status, uniquekey} = req.body;
    const all_path = pages.split("\\");
    // Validate the 'pages' and 'roles' fields (should not be "nd")
    const already = await backendController.selectQuery(`SELECT * FROM all_pages_details where path=? and deleteon=? and uniqueid!=?`,[pages,'0000-00-00',uniquekey]);
    if(already[0])
        return res.json({ msg: "Already Exist this Page.", msg_type: 'error', success: false });
    if (pages === 'nd') {
        return res.json({ msg: "Pages value is invalid", msg_type: 'error', success: false });
    }

    // Validate 'pagename' to ensure it has two words
    if (!/^[A-Za-z]+(?: [A-Za-z]+){1,}$/.test(pagename)) {
        return res.json({ msg: "Page name must contain two words", msg_type: 'error', success: false });
    }

    // Validate 'pagename' to ensure it has two words
    if (!/^[A-Za-z]+(?: [A-Za-z]+){1,}$/.test(description)) {
        return res.json({ msg: "Page description must contain two words", msg_type: 'error', success: false });
    }

    let changed = 0;
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          await backendController.deleted({ body : {'tableName' :'all_pages_details', 'whereCondition': `uniqueid = ?`, 'values':[uniquekey]}});
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
                "SELECT * FROM all_pages_details WHERE deleteon='0000-00-00' AND route = ?",
                [item]
            );
            if(item)
            {     
                // Insert the new record if no existing record found
                backendController.insert({body: {tableName: 'all_pages_details',data: {pagename,route: item,path:pages,description,status,}}});
            }
            if (results.length > 0 && item.endsWith(".hbs"))
                return res.json({ success: false, msg: "Route and Right already exist", msg_type:'error' });
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