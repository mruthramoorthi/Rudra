const express = require("express");
const backendController = require('../../controllers/backend-functions');
const router = express.Router();
const htmls = require('../../helpers');
const { jsPDF } = require("jspdf");
require("jspdf-autotable");
router.get("/loaduser", async (req, res) => {
    const role = req.headers.data;
    backendController.selectQuery(`SELECT distinct path FROM all_pages_roles where deleteon=? and role=?`,['0000-00-00',role])
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

router.post("/update", async (req, res) => {
   const {path,route,role,editstatus,editlimit,editdays,edittime,deletestatus,deletelimit,deletedays,deletetime,viewstatus,viewlimit,viewdays,viewtime,pdfstatus,pdflimit,pdfdays,pdftime,datestatus,datelimit,datedays,datetime} = req.body;
   // Perform the comparisons separately
    if(editstatus===true) editstatus1= 0; else editstatus1=1;
    if(editlimit===true) editlimit1= 0; else editlimit1=1;
    if(deletestatus===true) deletestatus1= 0; else deletestatus1=1;
    if(deletelimit===true) deletelimit1= 0; else deletelimit1=1;
    if(viewstatus===true) viewstatus1= 0; else viewstatus1=1;
    if(viewlimit===true) viewlimit1= 0; else viewlimit1=1;
    if(pdfstatus===true) pdfstatus1= 0; else pdfstatus1=1;
    if(pdflimit===true) pdflimit1= 0; else pdflimit1=1;
    if(datestatus===true) datestatus1= 0; else datestatus1=1;
    if(datelimit===true) datelimit1= 0; else datelimit1=1;
    console.log(edittime);
    const data = {
        path,
        page:route,
        role,
        edit_rights:editstatus1,
        edit_condition:editlimit1,
        edit_rights_duration_days:editdays,
        edit_time_limit:edittime,
        delete_rights:deletestatus1,
        delete_condition:deletelimit1,
        delete_rights_duration_days:deletedays,
        delete_time_limit:deletetime,
        view_rights:viewstatus1,
        view_condition:viewlimit1,
        view_rights_duration_days:viewdays,
        view_time_limit:viewtime,
        print_rights:pdfstatus1,
        print_condition:pdflimit1,
        print_rights_duration_days:pdfdays,
        print_time_limit:pdftime,
        date_change_rights:datestatus1,
        date_change_condition:datelimit1,
        date_change_rights_duration_days:datedays,
        date_change_time_limit:datetime,
    };
    try {
        // Call the `deleted()` function with the necessary arguments
        // await backendController.deleted({ body : {'tableName' :'page_feature_rights', 'whereCondition': `path = ?`, 'values':[path]}});
        const update = await backendController.updateQuery("page_feature_rights",data,'path=? and role=?',[path,role])
        if (update.success)
            res.json({msg: "Data updated successfully", msg_type : 'success', success: true});
      } catch (error) {
        console.error('Error in deleting:', error.message);
      }
});

router.post("/select", async (req, res) => {
    const { datas } = req.body;  // Default page 1 and limit 10
    let querySize = '';
    const data = JSON.parse(datas);
    let params = [];
        if(data.roles!="nd")
        {
            querySize += ' and role=?';
            params.push(data.roles);
        }
        if(data.pages!="nd")
        {
            querySize += ' and path=?';
            params.push(data.pages);
        }
    try
    {
        const results = await backendController.selectQuery(`SELECT * FROM all_pages_roles where deleteon=?${querySize}`,['0000-00-00',...params]);
        const totalRows = await backendController.selectQuery(`SELECT count(*) as total FROM all_pages_roles where deleteon=?${querySize}`,['0000-00-00',...params]);
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
        // Using for...of to handle async/await properly
        for (const item of results) {
            if (item.route.endsWith(".hbs")) {
                // Wait for the result from the backend query
                const features = await backendController.selectQuery("select * from page_feature_rights where deleteon=? and path=? and role=? and branch=?", ['0000-00-00', item.path, item.role, userToken.site]);
                let edit_rights_checked = "checked";
                let edit_condition_checked = "checked";
                let delete_rights_checked = "checked";
                let delete_condition_checked = "checked";
                let view_rights_checked = "checked";
                let view_condition_checked = "checked";
                let print_rights_checked = "checked";
                let print_condition_checked = "checked";
                let date_change_rights_checked = "checked";
                let date_change_condition_checked = "checked";
                let edit_rights_duration_days = "checked";
                let delete_rights_duration_days = "checked";
                let view_rights_duration_days = "checked";
                let print_rights_duration_days = "checked";
                let date_change_rights_duration_days = "checked";
                let edit_rights_duration_time = "checked";
                let delete_rights_duration_time = "checked";
                let view_rights_duration_time = "checked";
                let print_rights_duration_time = "checked";
                let date_change_rights_duration_time = "checked";
                if (features[0])
                {
                    const feature = features[0];
                    edit_rights_checked = feature.edit_rights === 1 ?  "" : "checked";
                    edit_condition_checked = feature.edit_condition === 1 ?  "" : "checked";
                    delete_rights_checked = feature.delete_rights === 1 ?  "" : "checked";
                    delete_condition_checked = feature.delete_condition === 1 ?  "" : "checked";
                    view_rights_checked = feature.view_rights === 1 ?  "" : "checked";
                    view_condition_checked = feature.view_condition === 1 ?  "" : "checked";
                    print_rights_checked = feature.print_rights === 1 ?  "" : "checked";
                    print_condition_checked = feature.print_condition === 1 ?  "" : "checked";
                    date_change_rights_checked = feature.date_change_rights === 1 ?  "" : "checked";
                    date_change_condition_checked = feature.date_change_condition === 1 ?  "" : "checked";
                    edit_rights_duration_days = feature.edit_rights_duration_days;
                    delete_rights_duration_days = feature.delete_rights_duration_days;
                    view_rights_duration_days = feature.view_rights_duration_days;
                    print_rights_duration_days = feature.print_rights_duration_days;
                    date_change_rights_duration_days = feature.date_change_rights_duration_days;
                    edit_rights_duration_time = feature.edit_time_limit === "00:00:00" ? "" : feature.edit_time_limit || "";
                    delete_rights_duration_time = feature.delete_time_limit === "00:00:00" ? "" : feature.delete_time_limit || "";
                    view_rights_duration_time = feature.view_time_limit === "00:00:00" ? "" : feature.view_time_limit || "";
                    print_rights_duration_time = feature.print_time_limit === "00:00:00" ? "" : feature.print_time_limit || "";
                    date_change_rights_duration_time = feature.date_change_time_limit === "00:00:00" ? "" : feature.date_change_time_limit || "";
                }
                sno++;
                htmlContent += `
                    <tr class='trs' dataset='${JSON.stringify(item)}'>
                        <td>${sno}</td>
                        <td>${backendController.capitalizeFirstLetters(item.route.replaceAll("-", " ").replaceAll(".hbs", ""))}</td>
                        <td>${htmls.createCustomCheckbox({ id: "editstatus" + item.uniqueid, className: "just-check", placeholder: " ", style: "", checked: edit_rights_checked })}</td>
                        <td>${htmls.createCustomCheckbox({ id: "editlimit" + item.uniqueid, className: "just-check", placeholder: " ", style: "", checked: edit_condition_checked })}</td>
                        <td>${htmls.createInputElement({ type: "number", id: "editdays" + item.uniqueid, placeholder: "Days", value: edit_rights_duration_days })}</td>
                        <td>${htmls.createInputElement({ type: "time", id: "edittime" + item.uniqueid, placeholder: "Time" , value:edit_rights_duration_time})}</td>
                        
                        <td>${htmls.createCustomCheckbox({ id: "deletestatus" + item.uniqueid, className: "just-check", placeholder: " ", style: "", checked: delete_rights_checked })}</td>
                        <td>${htmls.createCustomCheckbox({ id: "deletelimit" + item.uniqueid, className: "just-check", placeholder: " ", style: "", checked: delete_condition_checked })}</td>
                        <td>${htmls.createInputElement({ type: "number", id: "deletedays" + item.uniqueid, placeholder: "Days", value: delete_rights_duration_days })}</td>
                        <td>${htmls.createInputElement({ type: "time", id: "deletetime" + item.uniqueid, placeholder: "Time" , value:delete_rights_duration_time})}</td>
                        
                        <td>${htmls.createCustomCheckbox({ id: "viewstatus" + item.uniqueid, className: "just-check", placeholder: " ", style: "", checked: view_rights_checked })}</td>
                        <td>${htmls.createCustomCheckbox({ id: "viewlimit" + item.uniqueid, className: "just-check", placeholder: " ", style: "", checked: view_condition_checked })}</td>
                        <td>${htmls.createInputElement({ type: "number", id: "viewdays" + item.uniqueid, placeholder: "Days", value: view_rights_duration_days })}</td>
                        <td>${htmls.createInputElement({ type: "time", id: "viewtime" + item.uniqueid, placeholder: "Time" , value:view_rights_duration_time})}</td>
                        
                        <td>${htmls.createCustomCheckbox({ id: "pdfstatus" + item.uniqueid, className: "just-check", placeholder: " ", style: "", checked: print_rights_checked })}</td>
                        <td>${htmls.createCustomCheckbox({ id: "pdflimit" + item.uniqueid, className: "just-check", placeholder: " ", style: "", checked: print_condition_checked })}</td>
                        <td>${htmls.createInputElement({ type: "number", id: "pdfdays" + item.uniqueid, placeholder: "Days", value: print_rights_duration_days })}</td>
                        <td>${htmls.createInputElement({ type: "time", id: "pdftime" + item.uniqueid, placeholder: "Time" , value:print_rights_duration_time})}</td>
                        
                        <td>${htmls.createCustomCheckbox({ id: "datestatus" + item.uniqueid, className: "just-check", placeholder: " ", style: "", checked: date_change_rights_checked })}</td>
                        <td>${htmls.createCustomCheckbox({ id: "datelimit" + item.uniqueid, className: "just-check", placeholder: " ", style: "", checked: date_change_condition_checked })}</td>
                        <td>${htmls.createInputElement({ type: "number", id: "datedays" + item.uniqueid, placeholder: "Days", value: date_change_rights_duration_days })}</td>
                        <td>${htmls.createInputElement({ type: "time", id: "datetime" + item.uniqueid, placeholder: "Time" , value:date_change_rights_duration_time})}</td>
                    </tr>
                    
                    
                    <tr dataset='${JSON.stringify(item)}'>
                        <td colspan='22'>
                            <button type='button' class='assign-btn' id='${item.uniqueid}'>Save</button>
                        </td>
                    </tr>
                `;
            }
        }

        sno = 0;
        if (!htmlContent) {
            htmlContent = "There is No Data to Load";
        }
        return htmlContent;
    } catch (error) {
        console.error('Error in generateHTMLData:', error);  // Handle rejection properly here
        throw error;  // Re-throw error for higher-level handling
    }
}


module.exports = router;