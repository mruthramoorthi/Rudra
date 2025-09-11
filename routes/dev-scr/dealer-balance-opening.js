const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const router = express.Router();
const { jsPDF } = require("jspdf");
const { all } = require("./order-report");
const { body } = require("express-validator");
require("jspdf-autotable");

router.post("/insert", async (req, res) => {
    const { dealer,crweight,drweight,crcash,drcash,metal } = req.body;
    if(metal=="nd" && (crweight!=0 || drweight!=0))
        return res.json({success:false, msg_type:"error", msg:"Please Select Metal to Mention Weight Balance"});
    try{
        const weight = crweight > 0 ? crweight : -Math.abs(drweight);
        const cash = crcash > 0 ? crcash : -Math.abs(drcash);
        const date = backendController.getCurrentDate();
        await backendController.deleted({body:{tableName:"dealer_balance_opening",whereCondition:"dealercode=?", values:[dealer]}});
        const insert = await backendController.insert({body: {tableName:"dealer_balance_opening", data: { date,weight,cash,dealercode:dealer,metal }}});
        if(insert.success)
            return res.json({success:true, msg_type:"success", msg:"Dealer "+backendController.allCaps(dealer)+" Balance Updated Successfully..."});
        else
            return res.json({success:false, msg_type:"error", msg:"Dealer "+backendController.allCaps(dealer)+" Balance Updation Failed..."});
    }
    catch(e)
    {
        console.error('Error in Insert:', error);
        return res.json({success:false, msg_type:"error", msg:"Ob Entry Failed"});
    }
});

router.post("/select", async (req, res) => {
    try{
        const totalRecode = await backendController.selectQuery(
            `SELECT count(distinct dealercode) as total FROM dealer_balance where deleteon=? and branch=?`,
            ['0000-00-00', userToken.site]
        );
        
        const results = await backendController.selectQuery(
            `SELECT distinct dealercode,sum(weight) as weight,sum(cash) as cash FROM dealer_balance where deleteon=? and branch=? group by dealercode order by uniqueid desc`,
            ['0000-00-00', userToken.site]
        );

        const html = await generateHTMLData(results);
        res.json({
            success: true, 
            response: html, 
            total: parseInt(totalRecode[0].total), 
            msg: "ok" 
        });
    }
    catch(error){
        console.error('Error:', error);
        res.status(500).json({ success: false, msg: "Server Error" });
    }
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

let sno = 0;
async function generateHTMLData(groupedResults) {
    let htmlContent = '';
    let weight = 0;
    let amount = 0;
    for (let i = 0; i < groupedResults.length; i++) {
            const old = groupedResults[i];
            const opening = await backendController.selectQuery(
            `SELECT distinct dealercode,sum(weight) as weight,sum(cash) as cash FROM dealer_balance_opening where deleteon=? and branch=? and dealercode=? group by dealercode order by uniqueid desc`,
            ['0000-00-00', userToken.site, old.dealercode]
        );
        const payment = await backendController.selectQuery(
            `SELECT distinct dealercode,sum(weight) as weight,sum(cash) as cash FROM dealer_payment where deleteon=? and branch=? and dealercode=? group by dealercode order by uniqueid desc`,
            ['0000-00-00', userToken.site, old.dealercode]
        );
            sno++;
            let obwt = 0;
            let obCs = 0;
            let dealWt = 0;
            let dealCs = 0;
            const balWt = backendController.money(old.weight,3,0);
            const balCs = backendController.money(old.cash,3,0);
            if(opening[0])
            {
                obwt = backendController.money(opening[0].weight,3,0);
                obCs = backendController.money(opening[0].cash,3,0);
            }
            if(payment[0])
            {
                dealWt = backendController.money(payment[0].weight,3,0);
                dealCs = backendController.money(payment[0].cash,3,0);
            }
            const totalWeight = backendController.valNum(balWt) + backendController.valNum(obwt) - backendController.valNum(dealWt);
            const totalCash = backendController.valNum(balCs) + backendController.valNum(obCs) - backendController.valNum(dealCs);
            let drtotalWeight = 0;
            let drtotalCash = 0;
            let crtotalWeight = 0;
            let crtotalCash = 0;
            if(totalWeight>=0)
                crtotalWeight = totalWeight;
            if(totalCash>=0)
                crtotalCash = totalCash;
            if(totalWeight<0)
                drtotalWeight = totalWeight;
            if(totalCash<0)
                drtotalCash = totalCash;
        htmlContent += `
            <tr>
                <td>${sno}</td>
                <td>${backendController.caps(old.dealercode)}</td>
                <td>${htmls.selectBoxes({id:"metal_"+old.dealercode, options:"nd:Metal"})}</td>
                <td class='right-align'>${htmls.createInputElement({id:"drweight_"+old.dealercode, placeholder:"Weight", value: backendController.money(drtotalWeight,3,0), className:"pcswt"})}</td>
                <td class='right-align'>${htmls.createInputElement({id:"drcash_"+old.dealercode, placeholder:"Cash", value: backendController.money(drtotalCash,0,0), className:"pcswt"})}</td>
                <td class='right-align'>${htmls.createInputElement({id:"crweight_"+old.dealercode, placeholder:"Weight", value: backendController.money(crtotalWeight,3,0), className:"pcswt"})}</td>
                <td class='right-align'>${htmls.createInputElement({id:"crcash_"+old.dealercode, placeholder:"Cash", value: backendController.money(crtotalCash,0,0), className:"pcswt"})}</td>
                <td class='right-align'><button type='button' class='ob-bal-btn' dealer='${old.dealercode}' id="btn_${old.dealercode}">Assing</button></td>
            </tr>`;
            weight += parseFloat(totalWeight);
            amount += parseFloat(totalCash);
    }
    
    sno = 0;
    return htmlContent;
}

module.exports = router;