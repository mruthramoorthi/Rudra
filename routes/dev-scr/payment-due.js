const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const router = express.Router();
const { jsPDF } = require("jspdf");
const { body } = require("express-validator");
require("jspdf-autotable");

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

router.post("/select", async (req, res) => {
   
    const {datas} = req.body;
    const customer_saving_number = JSON.parse(datas);
    const number = customer_saving_number.datai;
    const controls = await backendController.selectQuery(`select * from saving_scheme_controller where deleteon=? and branch=?`,['0000-00-00',userToken.site]);
    const savings = await backendController.selectQuery(`select * from savings_transactions where deleteon=? and branch=? and savingnumber=? order by uniqueid desc`,['0000-00-00',userToken.site, number]);
    const enroll = await backendController.selectQuery(`SELECT * FROM customer_savings_enroll where deleteon=? and branch=? and savings_number=?`,['0000-00-00',userToken.site,number]);
    if(!enroll[0])
        return res.json({ success: true, response: "<label style='color:red'>There is No Savings Number Like That</label>", msg: "ok" });
    const scheme = await backendController.selectQuery(`SELECT * FROM saving_schemes where deleteon=? and branch=? and schemecode=?`,['0000-00-00',userToken.site,enroll[0].schemecode]);
    const rate = await backendController.selectQuery(`SELECT * FROM rate_master where branch=? and deleteon=? and category=?`,[userToken.site, '0000-00-00',"gold22k"]);
    const savings_limitations = await backendController.selectQuery(`select schemetype from savings_limitations where deleteon=? and branch=? and schemename=?`,['0000-00-00', userToken.site, scheme[0].scheme]);
    const savings_types = await backendController.selectQuery(`select payment_type,type from savings_types where deleteon=? and savingstype=?`,['0000-00-00', savings_limitations[0].schemetype]);
    backendController.selectQuery(`SELECT * FROM customer_savings_enroll where deleteon=? and branch=? and savings_number=?`,['0000-00-00',userToken.site,number])
        .then(results => {
            const html = generateHTMLData(results,controls,savings,rate,scheme,savings_types);
            res.json({ success: true, response: html, msg: "ok",total:1 });
        })
        .catch(error => {
            console.error('Error:', error);  // Handle rejection properly here
            res.status(500).json({ success: false, msg: "Server Error" });
        });
});
let sno = 0;
function generateHTMLData(results,controls,savings,rate,scheme,savings_types) {
    let htmlContent = '';
    let entryDate='';
    if(savings[0])
    {
        entryDate = backendController.rawDateFormat(savings[0].entrydate);
    }
    let next_due_date = backendController.DateAfterOneMonth(entryDate);
    let dueDte = "readonly";
    if(controls[0].due_date_edit)
        dueDte="";
    results.forEach(item => {
    let cash = item.due
    if(savings_types[0].type == "weight")
        cash = item.due * rate[0]["price"];
    let gram = parseFloat(cash)/parseFloat(rate[0]["price"]);
        sno ++;
        let gram_or_cash_conditions = '';
        if(scheme[0].category!='cash'&&item.closed=="0")
        {
            gram_or_cash_conditions = `<label>You Have to Pay <font id='pay_cash_lbl' name='pay_cash_lbl'>${backendController.money(cash, 3, 1)}</font> for Save ${backendController.caps(scheme[0].category)}[${backendController.formatNumberWithCommas(rate[0]["price"])}] <font id='gram_lbl' name='gram_lbl'>${backendController.money(gram, 3, 1)}</font> G</label><br>
            <input type="hidden" id="rate" name="rate" value="${rate[0]["price"]}">
            <input type="hidden" id="gram" name="gram" value="${backendController.money(gram, 3, 1)}">`;
        }
        htmlContent += `<div class="snowdiv paginate"><h3>${backendController.caps(item.savingname)}</h3>
                <span class="custombadge">${backendController.caps(item.schemegroup)} [ ${item.savings_count} ] - ${backendController.caps(item.savings_number)}</span><br>
                <label>${backendController.caps(item.address)}</label><br>
                <label>${backendController.formatNumberWithCommas(item.totalamount)}</label><br>
                <label>Contact : ${item.ph1}, ${item.ph2}</label><br>
                <input type="hidden" id="savinggrp" name="savinggrp" value="${item.schemecode}">
                <input type="hidden" id="savingnumbers" name="savingnumbers" value="${item.savings_number}">
                <input type="hidden" id="savingph1" name="savingph1" value="${item.ph1}">
                <input type="hidden" id="savingname" name="savingname" value="${item.savingname}">
                <input type="hidden" id="savingph2" name="savingph2" value="${item.ph2}">
                <input type="hidden" id="savingtype" name="savingtype" value="${scheme[0].type}">
                <input type="hidden" id="savingcategory" name="savingcategory" value="${scheme[0].category}">${gram_or_cash_conditions}
                <input type="hidden" id="strict_no_duration" name="strict_no_duration" value="${controls[0].strict_no_duration}">`;
        let readonly = "";
        if(savings_types[0].payment_type=="0")
            readonly = "readonly";
        if(item.closed=="0" && savings[0])
        {
            const today = backendController.getCurrentDate();
            const nextduedate = backendController.rawDateFormat(savings[0].nextduedate)
            let cls = "nextdue";
            if(nextduedate<today)
                cls = "blink";
            htmlContent += `<label class='paidalert'>So far, ${parseInt(savings.length) } Month due Paid...</label><br>
            <input type="hidden" id="savingscount" name="savingscount" value="${item.savings_count}">`;
            if(savings[0].length!=controls[0].month)
                htmlContent += `<label class='${cls}'>Next Due Date is On ${backendController.rawDateFormat(savings[0].nextduedate,'dmy')}</label>`;
            else
                htmlContent += `<label>You Finish The Savings Scheme Successfully</label>`;
            let restrict = 1;
            if((backendController.rawDateFormat(savings[0].nextduedate))>today)
                restrict = savings[0].restrict + 1;
            // console.log(controls[0].paypermonth, controls[0].month, savings[0].restrict, savings[0].length)
            if((nextduedate<=today || controls[0].paypermonth>savings[0].restrict) && savings.length<controls[0].month)
            {
                if(controls[0].strict_no_duration=="0")
                next_due_date = backendController.DateAfterOneMonth(savings[0].nextduedate);
                htmlContent += `<input type="hidden" id="realdue" name="realdue" value="${cash}">
                <input type="hidden" id="restrict" name="restrict" value="${restrict}">
                <input type="hidden" id="next_due_date" name="next_due_date" value="${next_due_date}">
                <input type="hidden" id="duemonth" name="duemonth" value="${parseInt(savings.length + 1)}">
                <div class="savings-ele">
                ${htmls.selectBoxes({id:"paymenttype",options:"cash:Cash,bank:Bank,both:Both"})}
                ${htmls.createInputElement({type:"number" ,id:"due", placeholder:"Cash Due", value:cash, othersForInput:readonly})}
                ${htmls.createInputElement({type:"date" ,id:"duedate", placeholder:"Due Date", othersForInput:dueDte})}
                <div id="bankdiv">
                    ${htmls.selectBoxes({id:"banks",options:"nd:Banks"})}
                    ${htmls.selectBoxes({id:"transactiontype",options:"nd:Transaction Type"})}
                    ${htmls.createInputElement({type:"number" ,id:"bank", placeholder:"Bank Due", value:0})}
                </div>
                <button type="button" id="paid" name="paid">Paid</button><br>`;
            }
            else
            {
                if(restrict>1)
                    htmlContent += `<br><label class='alert-saving'>Already Paid With Exceed Limit...</label>`;
            }
            if(savings.length>=1)
                htmlContent += `<br><button type='button' id='close' name='close' class='close-savings'>Close</button>`;
        }
        else if(!savings[0])
        {
            htmlContent += `<input type="hidden" id="savingscount" name="savingscount" value="${item.savings_count}">
            <input type="hidden" id="realdue" name="realdue" value="${cash}">
                <input type="hidden" id="restrict" name="restrict" value="1">
                <input type="hidden" id="next_due_date" name="next_due_date" value="${next_due_date}">
                <input type="hidden" id="duemonth" name="duemonth" value="1"><div class="savings-ele">
                ${htmls.selectBoxes({id:"paymenttype",options:"cash:Cash,bank:Bank,both:Both"})}
                ${htmls.createInputElement({type:"number" ,id:"due", placeholder:"Cash Due", value:cash, othersForInput:readonly})}
                ${htmls.createInputElement({type:"date" ,id:"duedate", placeholder:"Due Date", othersForInput:dueDte})}
                <div id="bankdiv">
                    ${htmls.selectBoxes({id:"banks",options:"nd:Banks"})}
                    ${htmls.selectBoxes({id:"transactiontype",options:"nd:Transaction Type"})}
                    ${htmls.createInputElement({type:"number" ,id:"bank", placeholder:"Bank Due", value:0})}
                </div>
                <button type="button" id="paid" name="paid">Paid</button><br>`;
        }
        else
        {
            htmlContent += `<br><label class='close-badge'>Closed</label>`;
        }
        htmlContent += `</div></div>`;
    });
    sno = 0;
    return htmlContent;
}

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

router.post("/insert", async (req, res)=>{
    const {realdue, paymenttype, due, banks, transactiontype, bank, savinggrp, savingnumbers, savingscount, duemonth,duedate, restrict, savingtype, savingcategory, savingname, savingph1, staff} = req.body;
    let gram = 0;
    let rate = 0;
    let today = backendController.getCurrentDate()
    let next_due_date = backendController.FutureDate(duedate, 30)
    if(savingtype=="gram"&&savingcategory!='cash')
    {
        gram = req.body.gram;
        rate = req.body.rate;
    }
    // Validate the 'pages' and 'roles' fields (should not be "nd")
    if (paymenttype !== 'cash') {
        if(parseInt(bank)<1)
            return res.json({ msg: "Bank Payment is Invalid", msg_type: 'error', success: false });
        if(banks === "nd" || transactiontype === "nd")
            return res.json({ msg: "Banks Name is Invalid", msg_type: 'error', success: false });
    }
    if(staff=="nd")
        return res.json({ msg: "Attender Must", msg_type: 'error', success: false });
    if(parseInt(realdue)<1)
        return res.json({ msg: "In Valid Due Amount", msg_type: 'error', success: false });
   
    try
    {
        let check_account = await backendController.selectQuery(`select * from entities where deleteon=? and branch=? and (ph1=? or ph2=?) and account_id=?`,['0000-00-00',userToken.site,savingph1,savingph1,"22"]);
        if(!check_account[0])
        {
            check_account = await backendController.newAccount("22",savingph1);
        }
        const insertResponse = await backendController.insert({body: {tableName: 'savings_transactions', data:{due: (parseFloat(due) + parseFloat(bank || 0)),savinggroup:savinggrp, savingnumber:savingnumbers, savingcount:savingscount, cashamount:due, bankamount:bank, bank:banks, via:transactiontype, amountin:paymenttype, duedate, nextduedate:next_due_date, duemonth, restrict, gram, rate,attender: staff}}});
        if(due>0)    
            await backendController.cdAccounts("1", "22", "payable", duedate, check_account[0].id, due, "cash", "savings", insertResponse.lastInsertId, suspense = 0, savingnumbers, "customer savings installment",savingname, "cash", due, 0, "nd", "nd");
        if(bank>0)    
            await backendController.cdAccounts("1", "22", "payable", duedate, check_account[0].id, bank, banks, "savings", insertResponse.lastInsertId, suspense = 0, savingnumbers, "customer savings installment",savingname, "bank", 0, bank, banks, transactiontype);
        // Ensure you handle the response outside of the asynchronous block
        if (insertResponse.success)
            res.json({ msg: "Data entered successfully", msg_type: 'success', success: true });
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

router.post("/close", async (req, res)=>{
    const { savinggrp, savingnumbers, savingscount, savingtype, savingcategory, savingname, savingph1} = req.body;
    let gram = 0;
    let rate = 0;
    // Validate the 'pages' and 'roles' fields (should not be "nd")
    try
    {
        const savings = await backendController.selectQuery(`select sum(bankamount+cashamount) as amt,sum(gram) as grm,avg(rate) as rate,max(duemonth) as due from savings_transactions where deleteon=? and branch=? and savingnumber=? order by uniqueid desc`,['0000-00-00',userToken.site, savingnumbers]);
        const enroll = await backendController.selectQuery(`SELECT * FROM customer_savings_enroll where deleteon=? and branch=? and savings_number=?`,['0000-00-00',userToken.site,savingnumbers]);
        const updateResponse = backendController.updateQry(`update customer_savings_enroll set closed=? where deleteon=? and branch=? and savings_number=? and savings_count=?`,['1','0000-00-00',userToken.site,savingnumbers,savingscount]);
        // Ensure you handle the response outside of the asynchronous block
        const insertResponse = await backendController.insert({body: {tableName:"closed_savings",data:{name:enroll[0].name,savingname:enroll[0].savingname,id:enroll[0].id,ph1:enroll[0].ph1,ph2:enroll[0].ph2,savingnumber:enroll[0].savings_number,savingcount:enroll[0].savings_count,totalamount:savings[0].amt,reminingamount:savings[0].amt,totalweight:savings[0].grm,reminingweight:savings[0].grm,totalduemonth:savings[0].due,avgrate:savings[0].rate}}});
        if (insertResponse.success)
            res.json({ msg: "Scheme Closed successfully", msg_type: 'success', success: true });
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