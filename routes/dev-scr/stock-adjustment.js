const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const { body } = require("express-validator");
const router = express.Router();
const { jsPDF } = require("jspdf");
require("jspdf-autotable");

router.get("/subtypeTo", async (req, res) => {
    const category = req.headers.data.split("[w~12]");
    backendController.selectQuery(`SELECT distinct subtype FROM jewel_master_control where deleteon=? and branch=? and code=? and category=?`,['0000-00-00',userToken.site,category[0],category[1]])
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

router.get("/loadCateTo", async (req, res) => {
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

router.get("/counterTo", async (req, res) => {
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

router.get("/loadJewelTo", async (req, res) => {
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

router.post("/saveDet", async (req, res) => {
    const {counter,product,typeofjewel,subtype,tag,weight,pcs,lotno,joinlotno,counterto,productto,typeofjewelto,subtypeto,remainingPcs,remainingWeight} = req.body;  // For example, if allrowid = 3
    if(pcs>remainingPcs || weight>remainingWeight)
        return res.json({success:false, msg_type:"error", msg:"Pcs / Weight You Entered Invalid"});
    if(lotno==joinlotno)
        return res.json({success:false, msg_type:"error", msg:"Dont Push a Invalid Stock"});
    const date = backendController.getCurrentDate();
    const time = backendController.getCurrentTime();
    const purchasecode =  backendController.generateUniqueId();
    const purchaseids = await backendController.generateUniqueNumbers('dealer_purchase', 'purchaseid', 4, 'p');
    if(tag!="nd")
        await backendController.deleted({ body : {'tableName' :'tagged_jewels', 'whereCondition': `tagid=?`,'values':[tag]}});
    if(joinlotno!="nd")
    {
        newLot = joinlotno;
        const purchaseDetails = await backendController.selectQuery(`select * from dealer_purchase where deleteon=? and branch=? and lotcode=?`,['0000-00-00',userToken.site,newLot]);
        const pieces = backendController.valNum(pcs) + backendController.valNum(purchaseDetails[0].pcs);
        const weights = backendController.valNum(weight) + backendController.valNum(purchaseDetails[0].weight);
        const updateAdjustLot = await backendController.updateQuery("dealer_purchase", {metal: purchaseDetails[0].metal,date,purchaseid:purchaseids[0],counter:purchaseDetails[0].counter,purchasecode,dealercode:"adjust",category:purchaseDetails[0].category,jeweltype:purchaseDetails[0].jeweltype,subtype:purchaseDetails[0].subtype,pieces,weights}, "deleteon=? and branch=? and lotcode=?", ['0000-00-00', userToken.site, newLot], order="order by uniqueid desc", "lotcode", newLot);
        const insertAdj = await backendController.insert({body: {tableName:"stock_adjustment", data:{metal:purchaseDetails[0].metal,adjustdate:date,adjusttime:time,lotno,tag,counter,category:product,jeweltype:typeofjewel,subtype,pcs:"-"+pcs,weight:"-"+weight,tolotno:newLot,tocounter:counterto,tocategory:productto,tojeweltype:typeofjewelto,tosubtype:subtypeto}}});
        if(insertAdj.success && updateAdjustLot.success)
            return res.json({success:true, msg_type:"success", msg:"Report Tagged Jewel as Missing."});
        else
            return res.json({success:false, msg_type:"error", msg:"Not Inserted Properly"});
    }
    else
    {
        const insertPur = await backendController.insert({body: {tableName:"dealer_purchase", data:{metal:purchaseDetails[0].metal, date,purchaseid:purchaseids[0],counter:counterto,purchasecode,dealercode:"adjust",category:productto,jeweltype:typeofjewelto,subtype:subtypeto,pcs,weight}, column:"lotcode"}});
        let newLot = insertPur.lastInsertId;
        const insertAdj = await backendController.insert({body: {tableName:"stock_adjustment", data:{metal: purchaseDetails[0].metal,adjustdate:date,adjusttime:time,lotno,tag,counter,category:product,jeweltype:typeofjewel,subtype,pcs:"-"+pcs,weight:"-"+weight,tolotno:newLot,tocounter:counterto,tocategory:productto,tojeweltype:typeofjewelto,tosubtype:subtypeto}}});
        if(insertAdj.success && insertPur.success)
            return res.json({success:true, msg_type:"success", msg:"Report Tagged Jewel as Missing."});
        else
            return res.json({success:false, msg_type:"error", msg:"Not Inserted Properly"});
    }
});

router.get("/allTag", async (req, res) => {
    const counter = req.headers.data;
    backendController.selectQuery(`SELECT distinct tagid FROM tagged_jewels where deleteon=? and branch=? and tagid!=? and solddate=? and lotno=?`,['0000-00-00',userToken.site,'','0000-00-00',counter])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['tagid']}">${item['tagid']}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.post("/tagDetails", async (req, res) => {
    const { tag,product,counter,typeofjewel,subtype,lotno } = req.body;
    if(tag)
    {
        const tagDetail = await backendController.selectQuery(`SELECT * FROM tagged_jewels where deleteon=? and branch=? and tagid=? and solddate=?`,['0000-00-00',userToken.site,tag,'0000-00-00']);
        if(tagDetail[0])
        {
            const htmlContent = `<div class="tagged-jewel">
                                    <label class="tagged-jewel-title">Tagged Jewel</label>
                                    <div class='jewel-detail-div'>
                                        <div class="jwl-photo">
                                            <img src="${tagDetail[0].jewelphoto || '/images/stone.png'}" class="jewel-pic" />
                                        </div>
                                        <div class="details-jewels">
                                            <input type='hidden' id='remainingPcs' name='remainingPcs' value='${tagDetail[0].pcs}'>
                                            <input type='hidden' id='remainingWeight' name='remainingWeight' value='${tagDetail[0].weight}'>
                                            <label>${backendController.caps(tagDetail[0].counter)}</label><br>
                                            <label>${backendController.caps(tagDetail[0].category)}</label><br>
                                            <label>${backendController.caps(tagDetail[0].subtype)}</label><br>
                                            <label>${tagDetail[0].pcs} .Pcs</label><br>
                                            <label>${tagDetail[0].weight} .G</label>
                                        </div>
                                    </div>
                                    <div class='jwl-qty'>
                                        ${htmls.createInputElement({id:"weight", type:"number", placeholder:"Weight", othersForDiv:'pcswt', value:tagDetail[0].weight})}<br>
                                        ${htmls.createInputElement({id:"pcs", type:"number", placeholder:"Pcs", othersForDiv:'pcswt', value:tagDetail[0].pcs})}
                                    </div>
                                    ${htmls.selectBoxes({id:"joinlotno", options:'nd:Join Lot'})}
                                </div>`;
            return res.json({success:true, html: htmlContent});
        }
        else
            return res.json({success:false, msg_type:"error", msg:"No Lots Available in This Combination"});
    }
    else if(product!="nd" && counter!="nd" && typeofjewel!="nd" && subtype!="nd" && lotno!="nd")
    {
        // Declare variables at a higher scope level
        let sums = { weight: 0, pcs: 0 };
        let lots = [];
        const purchaseDet = await backendController.selectQuery(`SELECT * FROM dealer_purchase where deleteon=? and branch=? and jeweltype=? and subtype=? and counter=? and category=? and lotcode=? and dealercode!=?`, ['0000-00-00', userToken.site, typeofjewel, subtype, counter, product, lotno, "adjust"]);
        if(purchaseDet[0])
        {
            // Check if purchaseDet is an array
            if (Array.isArray(purchaseDet)) {
                sums = purchaseDet.reduce((acc, item) => {
                    acc.weight += item.weight || 0; // Add item weight (default to 0 if undefined)
                    acc.pcs += item.pcs || 0; // Add item pcs (default to 0 if undefined)
                    return acc;
                }, { weight: 0, pcs: 0 }); // Initialize accumulator with weight and pcs set to 0

                lots = purchaseDet.map(item => item.lotcode); // Extract lotcodes
            } else {
                console.error("purchaseDet is not an array:", purchaseDet);
            }

            // Now, use the lots and sums variables outside the if block
            const tagDetails = await backendController.selectQuery(`SELECT sum(weight), sum(pcs) FROM tagged_jewels where deleteon=? and branch=? and code=? and subtype=? and lotno in (?) and solddate=?`, ['0000-00-00', userToken.site, typeofjewel, subtype, lots, '0000-00-00']);

            const weight = sums.weight;
            const pcs = sums.pcs;

            const remainingWeight = backendController.valNum(weight) - backendController.valNum(tagDetails[0].weight);
            const remainingPcs = backendController.valNum(pcs) - backendController.valNum(tagDetails[0].pcs);
            if(backendController.valNum(remainingWeight)<0 || backendController.valNum(remainingPcs)<0)
                return res.json({success:false, msg_type:"error", msg:"Please Check the Stock pcs/weight it will Show Negative Value"});
            const htmlContent = `
                <div class="tagged-jewel">
                    <label class="tagged-jewel-title">Un-Tagged Jewel</label>
                    <div class='jewel-detail-div'>
                        <div class='details-jewels'>
                            <input type='hidden' id='remainingPcs' name='remainingPcs' value='${remainingPcs}'>
                            <input type='hidden' id='remainingWeight' name='remainingWeight' value='${remainingWeight}'>
                            <b><label>Lot <label class="lotcode">${lots}</label></label></b><br>
                            <label>${backendController.money(remainingWeight,3,1)} .G</label><br>
                            <label>${backendController.money(remainingPcs,0,1)} .Pcs</label>
                        </div>
                        <div class="details-jewels">
                            <div class='jwl-qty'>
                                ${htmls.createInputElement({id:"weight", type:"number",placeholder:"Weight", othersForDiv:'pcswt', value:tagDetails[0].weight})}<br>
                                ${htmls.createInputElement({id:"pcs", type:"number", placeholder:"Pcs", othersForDiv:'pcswt', value:tagDetails[0].pcs})}
                            </div>
                        </div>
                        ${htmls.selectBoxes({id:"joinlotno", options:'nd:Join Lot'})}    
                    </div>
                </div>`;

            return res.json({ success: true, html: htmlContent });
        }
        else
            return res.json({success:false, msg_type:"error", msg:"No Lots Available in This Combination"});
    }
    else
    {
        return res.json({success:false, msg_type:"error", msg:"Please Give more Details About The Ornament"});
    }
});

router.post("/select", async (req, res) => {
    try
    {
        const results = await backendController.selectQuery(`SELECT * FROM stock_adjustment where deleteon=? and branch=?`,['0000-00-00',userToken.site]);
        const totalRows = await backendController.selectQuery(`SELECT count(*) as total FROM stock_adjustment where deleteon=? and branch=?`,['0000-00-00',userToken.site]);
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
        for (let i = 0; i < results.length; i++) {
            let item = results[i];
            let edit_and_delete = `<div class='flex-with-space-edit-delete'>`;
            if (!userToken.rights_result || userToken.rights_result.delete_rights === 0) {
                edit_and_delete += `<img src="/images/delete.png" class="delete-icon" width="25" height="25" id="delete-user${item.uniqueid}" uniquekey="${item.tolotno}" tag="${item.tag}" datas='${JSON.stringify(item)}'/>`;
            }
            edit_and_delete += `</div>`;
            sno++;
            htmlContent += `<tr><td>${sno}</td><td>${backendController.caps(item.tag)}</td><td>${backendController.caps(item.jeweltype)}</td><td>${item.weight} .G (${item.pcs}.pcs)</td><td>${edit_and_delete}</td></tr>`;
        }        
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
    const { uniquekey,tag } = req.body;
    if (uniquekey) {
        try {
            // Call the `deleted()` function with the necessary arguments
            if(tag!='untag')
            await backendController.updateQry(`update tagged_jewels set deleteon=? where tagid=?`,['0000-00-00',tag]);
            const deleteid = await backendController.deleted({ body : {'tableName' :'stock_adjustment', 'whereCondition': `tolotno=?`,'values':[uniquekey]}});
            const deleteid2 = await backendController.deleted({ body : {'tableName' :'dealer_purchase', 'whereCondition': `lotcode=?`,'values':[uniquekey]}});
            if (deleteid.success && deleteid2.success)
                res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
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

router.get("/lot", async (req, res) => {
    const { counter, product, jeweltype, subtype } = JSON.parse(req.headers.data);
    backendController.selectQuery(`SELECT distinct lotcode FROM dealer_purchase where deleteon=? and branch=? and counter=? and category=? and jeweltype=? and subtype=?`,['0000-00-00',userToken.site,counter,product,jeweltype,subtype])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['lotcode']}">${item['lotcode']}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.get("/lotJoin", async (req, res) => {
    backendController.selectQuery(`SELECT distinct lotcode FROM dealer_purchase where deleteon=? and branch=? and dealercode=?`,['0000-00-00',userToken.site,'adjust'])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['lotcode']}">${item['lotcode']}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.get("/loadCate", async (req, res) => {
    const counter = req.headers.data;
    backendController.selectQuery(`SELECT distinct t1.product,t1.category FROM product_category as t1 join dealer_purchase as t2 on t1.category=t2.category where t1.deleteon=? and t1.branch=? and t2.deleteon=? and t2.branch=? and t2.counter=?`,['0000-00-00',userToken.site,'0000-00-00',userToken.site,counter])
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

router.get("/subType", async (req, res) => {
    const category = req.headers.data.split("[w~12]");
    backendController.selectQuery(`SELECT distinct subtype FROM jewel_master_control where deleteon=? and branch=? and category=? and code=?`,['0000-00-00',userToken.site,category[1],category[0]])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['subtype']}">${item['subtype']}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

// router.post("/tagDetails", async (req, res) => {
//     const { tag,product,counter,typeofjewel,subtype,lotno } = req.body;
//     if(tag)
//     {
//         const tagDetail = await backendController.selectQuery(`SELECT * FROM tagged_jewels where deleteon=? and branch=? and tagid=? and solddate=?`,['0000-00-00',userToken.site,tag,'0000-00-00']);
//         if(tagDetail[0])
//         {
//             const htmlContent = `<div class="tagged-jewel">
//                                     <label class="tagged-jewel-title">Tagged Jewel</label>
//                                     <div class='jewel-detail-div'>
//                                         <div class="jwl-photo">
//                                             <img src="${tagDetail[0].jewelphoto || '/images/stone.png'}" class="jewel-pic" />
//                                         </div>
//                                         <div class="details-jewels">
//                                             <label>${backendController.caps(tagDetail[0].counter)}</label><br>
//                                             <label>${backendController.caps(tagDetail[0].category)}</label><br>
//                                             <label>${backendController.caps(tagDetail[0].subtype)}</label><br>
//                                             <label>${tagDetail[0].pcs} .Pcs</label><br>
//                                             <label>${tagDetail[0].weight} .G</label>
//                                         </div>
//                                     </div>
//                                     <div class='jwl-qty'>
//                                         ${htmls.createInputElement({id:"missdate", type:"date", placeholder:"Date", othersForDiv:'date-time'})}<br>
//                                         ${htmls.createInputElement({id:"misstime", type:"time", placeholder:"Time", othersForDiv:'date-time', value:"00:00"})}
//                                     </div>
//                                     <center><button type="button" id="miss">Miss</button></center>
//                                 </div>`;
//             return res.json({success:true, html: htmlContent});
//         }
//         else
//             return res.json({success:false, msg_type:"error", msg:"No Lots Available in This Combination"});
//     }
//     else if(product!="nd" && counter!="nd" && typeofjewel!="nd" && subtype!="nd" && lotno!="nd")
//     {
//         // Declare variables at a higher scope level
//         let sums = { weight: 0, pcs: 0 };
//         let lots = [];
//         const purchaseDet = await backendController.selectQuery(`SELECT * FROM dealer_purchase where deleteon=? and branch=? and jeweltype=? and subtype=? and counter=? and category=? and lotcode=?`, ['0000-00-00', userToken.site, typeofjewel, subtype, counter, product, lotno]);
//         if(purchaseDet[0])
//         {
//             // Check if purchaseDet is an array
//             if (Array.isArray(purchaseDet)) {
//                 sums = purchaseDet.reduce((acc, item) => {
//                     acc.weight += item.weight || 0; // Add item weight (default to 0 if undefined)
//                     acc.pcs += item.pcs || 0; // Add item pcs (default to 0 if undefined)
//                     return acc;
//                 }, { weight: 0, pcs: 0 }); // Initialize accumulator with weight and pcs set to 0

//                 lots = purchaseDet.map(item => item.lotcode); // Extract lotcodes
//             } else {
//                 console.error("purchaseDet is not an array:", purchaseDet);
//             }

//             // Now, use the lots and sums variables outside the if block
//             const tagDetails = await backendController.selectQuery(`SELECT sum(weight), sum(pcs) FROM tagged_jewels where deleteon=? and branch=? and code=? and subtype=? and lotno in (?) and solddate=?`, ['0000-00-00', userToken.site, typeofjewel, subtype, lots, '0000-00-00']);

//             const weight = sums.weight;
//             const pcs = sums.pcs;

//             const remainingWeight = backendController.valNum(weight) - backendController.valNum(tagDetails[0].weight);
//             const remainingPcs = backendController.valNum(pcs) - backendController.valNum(tagDetails[0].pcs);
//             if(backendController.valNum(remainingWeight)<0 || backendController.valNum(remainingPcs)<0)
//                 return res.json({success:false, msg_type:"error", msg:"Please Check the Stock pcs/weight it will Show Negative Value"});
//             const htmlContent = `
//                 <div class="tagged-jewel">
//                     <label class="tagged-jewel-title">Un-Tagged Jewel</label>
//                     <div class='jewel-detail-div'>
//                         <div class='details-jewels'>
//                             <input type='hidden' id='remainingPcs' name='remainingPcs' value='${remainingPcs}'>
//                             <input type='hidden' id='remainingWeight' name='remainingWeight' value='${remainingWeight}'>
//                             <b><label>Lot <label class="lotcode">${lots}</label></label></b><br>
//                             <label>${backendController.money(remainingWeight,3,1)} .G</label><br>
//                             <label>${backendController.money(remainingPcs,0,1)} .Pcs</label>
//                         </div>
//                         <div class="details-jewels">
//                             <div class='jwl-qty'>
//                                 ${htmls.createInputElement({id:"weight", type:"number",placeholder:"Weight", othersForDiv:'pcswt'})}<br>
//                                 ${htmls.createInputElement({id:"pcs", type:"number", placeholder:"Pcs", othersForDiv:'pcswt'})}
//                             </div>
//                             <div class='jwl-qty'>
//                                 ${htmls.createInputElement({id:"missdate", type:"date", placeholder:"Date", othersForDiv:'date-time'})}<br>
//                                 ${htmls.createInputElement({id:"misstime", type:"time", placeholder:"Time", othersForDiv:'date-time', value:"00:00"})}
//                             </div>
//                         </div>
//                     </div>
//                     <center><button type="button" id="miss">Miss</button></center>
//                 </div>`;

//             return res.json({ success: true, html: htmlContent });
//         }
//         else
//             return res.json({success:false, msg_type:"error", msg:"No Lots Available in This Combination"});
//     }
//     else
//     {
//         return res.json({success:false, msg_type:"error", msg:"Please Give more Details About The Ornament"});
//     }
// });

module.exports = router;