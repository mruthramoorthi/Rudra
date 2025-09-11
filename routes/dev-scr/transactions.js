const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const { body } = require("express-validator");
const { Table } = require("jspdf-autotable");
const router = express.Router();

router.get("/group", async (req, res) => {
    backendController.selectQuery(`SELECT * FROM saving_schemes where deleteon=? and branch=? and status=?`,['0000-00-00',userToken.site,'0'])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item["schemecode"]}">${backendController.allCaps(item['schemegroup'])}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
 });

 router.get("/savings", async (req, res) => {
    const group = req.headers.data;
    backendController.selectQuery(`SELECT * FROM scheme_group_count where deleteon=? and branch=? and schemecode=?`,['0000-00-00',userToken.site,group])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item["savingsnumber"]}">${item['savingscount']}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
 });

 router.post("/balance", async (req, res) => {
    const {from, to} = req.body;
    try{
        let html="";
        const total = await backendController.selectQuery(`SELECT sum(due) as total FROM savings_transactions where deleteon=? and branch=? and duedate<?`,['0000-00-00',userToken.site,from]);
        const inbetween = await backendController.selectQuery(`SELECT sum(due) as total FROM savings_transactions where deleteon=? and branch=? and duedate between ? and ?`,['0000-00-00',userToken.site,from,to]);
        // const closed = await backendController.selectQuery(`SELECT sum(t1.due) as total FROM savings_transactions as t1 JOIN customer_savings_enroll as t2 on t2.savings_number=t1.savingnumber where t1.deleteon=? and t1.branch=? and t1.deleteon=? and t1.branch=? and t2.closed=? and t1.duedate between ? and ?`,['0000-00-00',userToken.site,'0000-00-00',userToken.site,'1',from,to]);
        const closing = parseInt(backendController.valNum(inbetween[0].total) + backendController.valNum(total[0].total));
        html += `<label>Opening : ${backendController.money(total[0].total,0,1)}</label><br><label>Collection (${backendController.rawDateFormat(from,'dmy')}) to (${backendController.rawDateFormat(to,'dmy')}) : ${backendController.money(inbetween[0].total,0,1)}</label><br><label>Total Closed : ${backendController.money(closing,0,1)}</label>`;
        res.json({ success: true, response: html });
    }
    catch(error){
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    };
 });

router.post("/select", async (req, res) => {
    const {fromdate,todate} = JSON.parse(req.body.datas);
    const totalRecode = await backendController.selectQuery(`SELECT count(*) as total FROM savings_transactions where deleteon=? and branch=? and duedate between ? and ?;`,['0000-00-00', userToken.site, fromdate, todate]);
    backendController.selectQuery(`SELECT t1.savingnumber,t1.savingcount,t1.cashamount,t1.bankamount,t1.via,t1.bank,t1.duemonth,t1.amountin,t2.name,t2.ph1,t2.ph2,t1.due,t1.duedate FROM savings_transactions as t1 join customer_savings_enroll as t2 on t1.savingnumber = t2.savings_number WHERE t1.deleteon=? and t2.deleteon=? and t1.branch=? and t2.branch=? and t1.duedate between ? and ?;`,['0000-00-00','0000-00-00', userToken.site, userToken.site, fromdate, todate])  
        .then(results => {
            const html = generateHTMLData(results);
            res.json({ success: true, response: html, total: totalRecode[0].total, msg: "ok" });
        })
        .catch(error => {
            console.error('Error:', error);  // Handle rejection properly here
            res.status(500).json({ success: false, msg: "Server Error" });
        });
});

let sno = 0;
function generateHTMLData(results) {
    let htmlContent = '';
    let bankAmt = 0;
    let cashAmt = 0;
    results.forEach(item => {
        sno ++;
        const entryDate = backendController.rawDateFormat(item.duedate,'dmy');
        htmlContent += `<tr><td>${sno}</td><td>${entryDate}</td><td>${backendController.allCaps(item.savingnumber)} - ${item.savingcount}</td><td>${backendController.caps(item.name)}</td><td>${item.ph1}</td><td>${backendController.money(item.due,0,1)}</td><td class='right-align'>${backendController.caps(item.amountin)}</td><td class='right-align'>${backendController.caps(item.bank)}</td><td class='right-align'>${backendController.money(item.cashamount,0,1)}</td><td class='right-align'>${backendController.money(item.bankamount,0,1)}</td></tr>`;
        bankAmt += item.bankamount;
        cashAmt += item.cashamount;
    });
    footer = `<td colspan='8'>Total</td><td class='right-align'>${backendController.money(cashAmt,0,1)}</td><td class='right-align'>${backendController.money(bankAmt,0,1)}</td>`;
    sno = 0;
    return htmlContent+"[tdfooter]"+footer;
}

router.post("/individual", async (req, res) => {
    const {count} = JSON.parse(req.body.datas);
    const totalRecode = await backendController.selectQuery(`SELECT count(*) as total FROM savings_transactions where deleteon=? and branch=? and savingnumber=?`,['0000-00-00', userToken.site, count]);
    backendController.selectQuery(`SELECT t1.savingnumber,t1.savingcount,t1.cashamount,t1.bankamount,t1.via,t1.bank,t1.duemonth,t1.amountin,t2.name,t2.ph1,t2.ph2,t1.due,t1.entrydate,t1.rate,t1.gram FROM savings_transactions as t1 join customer_savings_enroll as t2 on t1.savingnumber = t2.savings_number WHERE t1.deleteon=? and t2.deleteon=? and t1.branch=? and t2.branch=? and t2.savings_number=?`,['0000-00-00','0000-00-00', userToken.site, userToken.site, count])  
        .then(results => {
            const html = generateHTMLData1(results);
            res.json({ success: true, response: html, total: totalRecode[0].total, msg: "ok" });
        })
        .catch(error => {
            console.error('Error:', error);  // Handle rejection properly here
            res.status(500).json({ success: false, msg: "Server Error" });
        });
});

let ssno = 0;
function generateHTMLData1(results) {
    let htmlContent = '';
    let bankAmt = 0;
    let cashAmt = 0;
    results.forEach(item => {
        ssno ++;
        const entryDate = backendController.rawDateFormat(item.entrydate,'dmy');
        if(!userToken.rights_result||userToken.rights_result.delete_rights===0)
            edit_and_delete = `<img src="/images/delete.png" class="delete-icon" title="" width="25" height="25" id="delete-user${item.uniqueid}" uniquekey="${item.uniqueid}" datas='${JSON.stringify(item)}'/>`;
        htmlContent += `<tr><td>${ssno}</td><td>${entryDate}</td><td>${backendController.money(item.due,0,1)}</td><td class='right-align'>${backendController.caps(item.amountin)}</td><td class='right-align'>${backendController.caps(item.bank)}</td><td class='right-align'>${backendController.money(item.rate,0,1)}</td><td class='right-align'>${backendController.money(item.gram,3,1)}</td><td class='right-align'>${backendController.money(item.cashamount,0,1)}</td><td class='right-align'>${backendController.money(item.bankamount,0,1)}</td><td>${edit_and_delete}</td></tr>`;
        bankAmt += item.bankamount;
        cashAmt += item.cashamount;
    });
    footer = `<td colspan='7'>Total</td><td class='right-align'>${backendController.money(cashAmt,0,1)}</td><td class='right-align'>${backendController.money(bankAmt,0,1)}</td><td></td>`;
    ssno = 0;
    return htmlContent+"[tdfooter]"+footer;
}

module.exports = router;