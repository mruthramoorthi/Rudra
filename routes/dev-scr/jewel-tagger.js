const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const { body } = require("express-validator");
const { Table } = require("jspdf-autotable");
const router = express.Router();

router.post("/select", async (req, res) => {
    // console.log(req.body.datas); // Logs all top-level keys of req
    const dealer_purchase = await backendController.selectQuery(`SELECT count(*) as total FROM dealer_purchase where deleteon=? and branch=?`,['0000-00-00',userToken.site]);
    try{
        const purchase = await backendController.selectQuery(`SELECT * FROM dealer_purchase where deleteon=? and branch=? order by uniqueid desc`,['0000-00-00',userToken.site])
        const html = await generateHTMLData(purchase);
        res.json({ success: true, response: html, total: dealer_purchase[0].total, msg: "ok" });
    }
    catch(error) 
    {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg: "Server Error" });
    };
 });

 let sno = 0;
 async function generateHTMLData(results) {
     let htmlContent = '';
     
     for (const item of results) { // ✅ Use for...of instead of forEach
         const tagged_jewels = await backendController.selectQuery(`SELECT SUM(pcs) AS pcs, SUM(weight) AS wt FROM tagged_jewels WHERE deleteon=? AND branch=? AND lotno=?`, ['0000-00-00', userToken.site, item.lotcode]);
         const adjust_jewels = await backendController.selectQuery(`SELECT SUM(pcs) AS pcs, SUM(weight) AS wt FROM stock_adjustment WHERE deleteon=? AND branch=? AND lotno=?`, ['0000-00-00', userToken.site, item.lotcode]);
         const missing_jewels = await backendController.selectQuery(`SELECT SUM(pcs) AS pcs, SUM(weight) AS wt FROM stock_missing WHERE deleteon=? AND branch=? AND lotno=?`, ['0000-00-00', userToken.site, item.lotcode]);
         const jewel_control = await backendController.selectQuery(`SELECT * FROM jewel_master_control where deleteon=? and branch=? and code=? and category=? order by uniqueid desc`,['0000-00-00', userToken.site, item.jewelcode, item.category]);
            const total_weight = item.weight - item.airweight - (tagged_jewels[0].wt || 0) - (adjust_jewels[0].wt || 0) - (missing_jewels[0].wt || 0);
            const total_pcs = item.pcs - (tagged_jewels[0].pcs || 0) - (adjust_jewels[0].pcs || 0) - (missing_jewels[0].pcs || 0);
         let subtypes = "nd:Subtype";
         if (item.subtype !== "nd" && item.subtype) {
             subtypes = item.subtype + ":" + backendController.caps(item.subtype);
         }
 
         const entryDate = backendController.rawDateFormat(item.entrydate, 'dmy');
        if(total_weight>0 && total_pcs>0)
        {
            sno++;
         htmlContent += `<tr><td id='rowspantag${item.lotcode}'>${sno}</td>
                             <td><font class='purchaseid'>${backendController.caps(item.purchaseid)}</font> [ <font class='counter'>${backendController.caps(item.counter)}</font> ] Lot - 
                                 <font class='lot'>${backendController.money(item.lotcode, 0, 1)}</font> 
                                 ( <font class='dealercode'>${backendController.allCaps(item.dealercode)}</font> ) 
                                 ${entryDate}<br>
                                 <div class='inventory'>
                                     <div class='purchase'>
                                         ${backendController.caps(item.category)} <b>|</b> 
                                         ${backendController.caps(item.jeweltype)} - 
                                         ${backendController.caps(item.subtype)} <br> 
                                         ${backendController.money(item.weight - item.airweight - (adjust_jewels[0].wt || 0) - (missing_jewels[0].wt || 0), 3, 1)} .G 
                                         ( ${backendController.money(item.pcs - (adjust_jewels[0].pcs || 0) - (missing_jewels[0].pcs || 0), 0, 1)} .pcs ) 
                                     </div>
                                     <div>
                                        <b>|</b><img src='/images/tag.png' class='tagged'> Tagged <br> 
                                        <b>|</b><font id='tagged_gram_details${item.lotcode}'>${backendController.money((tagged_jewels[0].wt || 0),3,1)}</font>.G 
                                        ( <font id='tagged_pcs_details${item.lotcode}'>${backendController.money((tagged_jewels[0].pcs || 0),0,1)}</font>.pcs)
                                     </div>
                                     <div class='tags'>
                                         <b>|</b><img src='/images/weight.png' class='tagged'>  Remaining <br> 
                                         <b>|</b><font id='remin_tagged_gram_details${item.lotcode}'>${backendController.money(item.weight - item.airweight - (tagged_jewels[0].wt || 0) - (adjust_jewels[0].wt || 0) - (missing_jewels[0].wt || 0), 3, 1)}</font> .G 
                                         ( <font id='remin_tagged_pcs_details${item.lotcode}'>${backendController.money(item.pcs - (tagged_jewels[0].pcs || 0) - (adjust_jewels[0].pcs || 0) - (missing_jewels[0].pcs || 0), 0, 1)}</font> .pcs )
                                     </div>
                                 </div>
                                 <br>`;
                                 if(total_weight>0 && total_pcs>0)
                                 {
                                                htmlContent += `<button type='button' class='get-tag' id='tag-btn${item.lotcode}' lot='${item.lotcode}'>Get Tag</button><br>
                                                <div id='tagging${item.lotcode}' class='tagging'>
                                                    <div class='tagoptions'>
                                                        ${htmls.selectBoxes({id:'subtype'+item.lotcode, options:subtypes})} 
                                                        ${htmls.createInputElement({id:"pcs"+item.lotcode, type:"number", placeholder:"Pcs"})} 
                                                        ${htmls.createInputElement({id:"weight"+item.lotcode, type:"number", placeholder:"Weight"})}
                                                        <div id='img_loader${item.lotcode}'>
                                                            ${htmls.imageLoader({id:"jewelpic"+item.lotcode, placeholder:"Upload Jewel Photo"})}
                                                        </div>
                                                    </div>
                                                    <div><div class='addondetails' id='addondetails${item.lotcode}'></div><br><button id='add-on-btn${item.lotcode}' class='add-on-btn' type='button' lot='${item.lotcode}'>Add-on</button><br><div class='stonedetails' id='stonedetails${item.lotcode}'></div><br><button id='stone-btn${item.lotcode}' class='stone-btn' type='button' lot='${item.lotcode}'>Add Stone</button></div>
                                                    <br><div class='taggin-details'>
                                                        <button type='button' class='tag' id='tag${item.lotcode}' lot='${item.lotcode}'>Tag</button>
                                                        <button type='button' class='cancel-tag' id='canceltag${item.lotcode}' lot='${item.lotcode}'>Cancel</button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        <input type='hidden' id='purity${item.lotcode}' name='purity${item.lotcode}' value='${item.lotcode}'/>
                                        <input type='hidden' id='counter${item.lotcode}' name='counter${item.lotcode}' value='${item.counter}'/>
                                        <input type='hidden' id='category${item.lotcode}' name='category${item.lotcode}' value='${item.category}'/>
                                        <input type='hidden' id='code${item.lotcode}' name='code${item.lotcode}' value='${item.jeweltype}'/>
                                        <input type='hidden' id='jt${item.lotcode}' name='jt${item.lotcode}' value='${jewel_control[0].jeweltype}'/>
                                        <input type='hidden' id='st${item.lotcode}' name='st${item.lotcode}' value='${item.subtype}'/>
                                        <input type='hidden' id='wt${item.lotcode}' name='wt${item.lotcode}' value='${item.weight - item.airweight - (adjust_jewels[0].wt || 0) - (missing_jewels[0].wt || 0)}'/>
                                        <input type='hidden' id='piece${item.lotcode}' name='piece${item.lotcode}' value='${item.pcs - (adjust_jewels[0].pcs || 0) - (missing_jewels[0].pcs || 0)}'/>
                                        <input type='hidden' id='total_stone_price${item.lotcode}' name='total_stone_price${item.lotcode}' value=''/>`;
                                 }
                                 else if((total_weight==0 || total_pcs==0) && (total_weight!=0 || total_pcs!=0))
                                 {
                                    htmlContent += `<button type='button' class='get-remove' id='get-remove${item.lotcode}' lot='${item.lotcode}'>Remove Air Weight</button><br>`;
                                 }
                                 else
                                 {
                                    htmlContent += `<label class="notag">There is No Pcs/Weight To Tag</label>`;
                                 }
                                }
     }
 
     sno = 0;
     return htmlContent;
 }
 
router.get("/subtype", async (req, res) => {
    const {jt,ct} = JSON.parse(req.headers.data);
    backendController.selectQuery(`SELECT * FROM jewel_master_control where deleteon=? and branch=? and jeweltype=? and category=?`,['0000-00-00',userToken.site,jt,ct])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item["subtype"]}">${backendController.caps(item['subtype'])}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.get("/loadAddon", async (req, res) => {
    backendController.selectQuery(`SELECT name FROM add_on_products where deleteon=? and branch=? and status=?`,['0000-00-00',userToken.site,'0'])
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

router.get("/loadStone", async (req, res) => {
    backendController.selectQuery(`SELECT name FROM stone_products where deleteon=? and branch=? and status=?`,['0000-00-00',userToken.site,'0'])
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

router.post('/addonPrice',async (req, res) => {
    const {addonvalue,id} = req.body;
    try{
        const addon_price = await backendController.selectQuery(`select * from rate_master where deleteon=? and branch=? and category=?`,['0000-00-00',userToken.site,addonvalue]);
        res.json({ success: true, id: "addonprc"+id, rate: addon_price[0].price });
    }
    catch(error)
    {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    }
});

router.post('/stonePrice',async (req, res) => {
    const {stonevalue,id} = req.body;
    try{
        const stone_price = await backendController.selectQuery(`select * from rate_master where deleteon=? and branch=? and category=?`,['0000-00-00',userToken.site,stonevalue]);
        res.json({ success: true, id: "caratprice"+id, rate: stone_price[0].price });
    }
    catch(error)
    {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    }
});

router.post('/tagged',async (req, res) => {
    const { lot,category,purity,counter,piece,wt,pcs,code,jeweltype,subtype,weight,image,addons,stones } = req.body;
    // console.log(lot,piece,wt,pcs,code,jeweltype,subtype,weight,image,addons,stones);
    const tagged_jewels = await backendController.selectQuery(`SELECT SUM(pcs) AS pcs, SUM(weight) AS wt FROM tagged_jewels WHERE deleteon=? AND branch=? AND lotno=?`, ['0000-00-00', userToken.site, lot]);
    const piece_now = parseInt(piece) - (parseInt(tagged_jewels[0].pcs) + parseInt(pcs));
    const weight_now = parseFloat(wt) - (parseFloat(tagged_jewels[0].wt) + parseFloat(weight));
    if(piece_now<0 || weight_now<0)
        return res.json({ msg: "Piece/Weight Not Available", msg_type: 'error', success: false });
    if(!lot)
        return res.json({ msg: "Lot Not Selected", msg_type: 'error', success: false });
    if(!pcs || pcs=="0")
        return res.json({ msg: "Pcs not Entered", msg_type: 'error', success: false });
    if(!subtype || subtype=="nd")
        return res.json({ msg: "Subtype Must Select to Tag", msg_type: 'error', success: false });
    if(!weight || weight=="0")
        return res.json({ msg: "Weight Must be Mention in tag", msg_type: 'error', success: false });
    const stone = stones.map(item => `${item.stone}[c~1]`).join('').slice(0, -5); // Remove the last [c~1]
    const stone_count = stones.map(item => `${item.stone_count}[c~1]`).join('').slice(0, -5);
    const stone_total_weight = stones.map(item => item.stone_weight).reduce((sum, qty) => parseFloat(sum) + parseFloat(qty), 0);
    const stone_weight = stones.map(item => `${item.stone_weight}[c~1]`).join('').slice(0, -5);
    const stone_size = stones.map(item => `${item.stone_size}[c~1]`).join('').slice(0, -5);
    const stone_carat = stones.map(item => `${item.stone_carat}[c~1]`).join('').slice(0, -5);
    const stone_total = stones.map(item => `${item.stone_total}[c~1]`).join('').slice(0, -5);

    const addon = addons.map(item => `${item.addon}[c~1]`).join('').slice(0, -5);
    const addon_total_weight = addons.map(item => item.addon_qty).reduce((sum, qty) => parseFloat(sum) + parseFloat(qty), 0);
    const addon_qty = addons.map(item => `${item.addon_qty}[c~1]`).join('').slice(0, -5);
    const addon_price = addons.map(item => `${item.addon_price}[c~1]`).join('').slice(0, -5);
    const addon_total = addons.map(item => `${item.addon_total}[c~1]`).join('').slice(0, -5);
    const tagid = await backendController.generateUniqueNumbers('tagged_jewels', 'tagid', 3, 'a');
    const entryDate = backendController.getCurrentDate();
    const data = { date: entryDate, tagid:tagid[0],lotno:lot,category,purity,counter,pcs,code,jeweltype,subtype,weight,stoneweight:stone_weight,stoneprice:stone_total,stonetype:stone,stonecount:stone_count,caratsize:stone_size,caratprice:stone_carat,jewelphoto:image,addon,addonqty:addon_qty,addonprice:addon_price,addontotalprice:addon_total,totalstoneweight:stone_total_weight,totaladdonweight:addon_total_weight };
    
    try
    {
        const insertResponse = await backendController.insert({body: {tableName: 'tagged_jewels',data: data}});
        const purchase = await backendController.selectQuery(`SELECT * FROM dealer_purchase where deleteon=? and branch=? and lotcode=? order by uniqueid desc`,['0000-00-00',userToken.site,lot]);
        const tagged_jewels = await backendController.selectQuery(`select sum(pcs) as pcs,sum(weight) as wt from tagged_jewels where deleteon=? and branch=? and lotno=?`,['0000-00-00',userToken.site,lot]);
        const reminweight = parseFloat(purchase[0].weight - purchase[0].airweight) - parseFloat(tagged_jewels[0].wt);
        const reminpcs = parseFloat(purchase[0].pcs) - parseFloat(tagged_jewels[0].pcs);
        if (insertResponse.success)
            res.json({msg: "Tagged successfully", response:"", lot:lot, weight:tagged_jewels[0].wt, reminweight, reminpcs, pcs:tagged_jewels[0].pcs, msg_type : 'success', success: true});
        else {
            console.log('Insert failed');
            res.json({success: false,msg: 'Error occurred while inserting data',msg_type: 'error',error: insertResponse.message || 'Unknown error'});
        }
    }
    catch (error)
    {
        console.error('Error during insert operation:', error);
        res.json({success: false,msg: 'Error occurred while inserting data',msg_type: 'error',error: error.message || 'Unknown error'});
    }
});


module.exports = router;