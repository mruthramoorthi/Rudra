const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const { body } = require("express-validator");
const router = express.Router();
const { jsPDF } = require("jspdf");
const { Table } = require("jspdf-autotable");
const autoTable = require("jspdf-autotable").default;

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
    backendController.selectQuery(`SELECT distinct lotid FROM stock_opening where deleteon=? and branch=? and counter=? and category=? and jeweltype=? and subtype=?`,['0000-00-00',userToken.site,counter,product,jeweltype,subtype])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['lotid']}">${item['lotid']}</option>`);
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

router.post("/insert", async (req, res) => {
    const { counter,purity,product,typeofjewel,subtype,lotno,tag,weight,pcs,stone,scount,sweight,sprice,caratsize,caratprice,imgpath_photo } = req.body;
    const jewelType = await backendController.selectQuery(`select jeweltype from jewel_master_control where deleteon=? and branch=? and code=?`, ['0000-00-00', userToken.site, typeofjewel]);
    const opening_weight = await backendController.selectQuery(`select sum(weight), sum(pcs) from stock_opening where deleteon=? and branch=? and lotid=?`, ['0000-00-00', userToken.site, lotno]);
    const opening_tag = await backendController.selectQuery(`select sum(weight), sum(pcs) from tagged_jewels where deleteon=? and branch=? and lotno=?`, ['0000-00-00', userToken.site, lotno]);
    const real_weight = parseFloat(opening_weight[0].weight) - parseFloat(opening_tag[0].weight) - weight;
    const real_pcs = parseInt(opening_weight[0].weight) - parseInt(opening_tag[0].pcs) - pcs;
    if((real_pcs<0 || real_weight<0) && weight>0 && pcs>0)
        return res.json({msg: "Weight/Pcs Not Vaid", msg_type : 'error', success: false});
    if(lotno=="nd")
        return res.json({msg: "Please Provide Opening Stock Details for Generate Opening Tag", msg_type : 'error', success: false});
    const data = { tagid:tag,lotno,category:product,purity,counter,pcs,code:typeofjewel,jeweltype:jewelType[0].jeweltype,subtype,weight,stoneweight:sweight,stoneprice:sprice,stonetype:stone,stonecount:scount,caratsize,caratprice,jewelphoto:imgpath_photo,totalstoneweight:sweight,ob:1 };
    try{
        const insert = await backendController.insert({body:{tableName:"tagged_jewels", data:data}});
        if (insert.success)
            return res.json({msg: "Tagged successfully", msg_type : 'success', success: true});
        else {
            console.log('Insert failed');
            return res.json({success: false,msg: 'Error occurred while Opening tag',msg_type: 'error',error: insertResponse.message || 'Unknown error'});
        }
    }
    catch(e)
    {
        console.error('Error during insert operation:', error);
        return res.json({success: false,msg: 'Error occurred while inserting data',msg_type: 'error',error: error.message || 'Unknown error'});
    }
});

router.post("/select", async (req, res) => {
   const totalRecode = await backendController.selectQuery(`SELECT count(*) as total FROM tagged_jewels where deleteon=? and branch=? and ob=?`,['0000-00-00',userToken.site,1]);
   try {
        const results = await backendController.selectQuery(
            `SELECT * FROM tagged_jewels WHERE deleteon = ? AND branch = ? AND ob = ?`,
            ['0000-00-00', userToken.site, 1]
        );

        const html = await generateHTMLData(results);

        res.json({
            success: true,
            response: html,
            total: totalRecode[0].total,
            msg: "ok"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            msg: "Server Error"
        });
    }

});

let sno = 0;
async function generateHTMLData(results) {
   let htmlContent = '';
   for (let i = 0; i < results.length; i++) {
        const item = results[i];
        sno++;
        const entryDate = backendController.rawDateFormat(item.entrydate, 'dmy');
        let edit_and_delete = `<div class='flex-with-space-edit-delete'>`;
        // if (!userToken.rights_result || userToken.rights_result.edit_rights === 0) {
        //     edit_and_delete += `<img src="/images/edit.png" width="25" height="25" class="edit-icon" title="" id="edit-user${item.tagid}" uniquekey="${item.tagid}" datas='${JSON.stringify(item)}'/>`;
        // }
        if (!userToken.rights_result || userToken.rights_result.delete_rights === 0) {
            edit_and_delete += `<img src="/images/delete.png" tabindex='0' role="button" class="delete-icon" title="" width="25" height="25" id="delete-user${item.tagid}" uniquekey="${item.tagid}" datas='${JSON.stringify(item)}'/>`;
        }
        edit_and_delete += `</div>`;
        htmlContent += `<tr><td>${sno}</td><td>${backendController.caps(item.tagid)}</td><td>${item.jeweltype}</td><td>${backendController.caps(item.subtype)}</td><td>${item.counter}</td><td>${item.weight}</td><td>${item.pcs}</td><td>${item.category}</td><td>${entryDate}</td><td>${edit_and_delete}</td></tr>`;
    }
   sno = 0;
   return htmlContent;
}

router.post("/tagDetails", async (req, res) => {
    const { lotno } = req.body;
    if(lotno!='nd')
    {
        const opening_weight = await backendController.selectQuery(`select sum(weight) as weight, sum(pcs) as pcs from stock_opening where deleteon=? and branch=? and lotid=?`, ['0000-00-00', userToken.site, lotno]);
        const opening_tag = await backendController.selectQuery(`select sum(weight) as weight, sum(pcs) as pcs from tagged_jewels where deleteon=? and branch=? and lotno=?`, ['0000-00-00', userToken.site, lotno]);
        const real_weight = backendController.valNum(opening_weight[0].weight) - backendController.valNum(opening_tag[0].weight);
        const real_pcs = backendController.valNum(opening_weight[0].pcs) - backendController.valNum(opening_tag[0].pcs);
        return res.json({ success: true, weight: real_weight, pcs: real_pcs });
    }
    else
    {
        return res.json({success:false, msg_type:"error", msg:"Please Give more Details About The Ornament"});
    }
});

// POST route to handle form submission
router.post('/delete',async (req, res) => {
    const { uniquekey } = req.body;
    if (uniquekey) {
        try {
          // Call the `deleted()` function with the necessary arguments
          const deleteid1 = await backendController.deleted({ body : {'tableName' :'tagged_jewels', 'whereCondition': `tagid=? and ob=?`,'values':[uniquekey, 1]}});
          if (deleteid1.success)
            res.json({msg: "Data Deletes successfully", msg_type : 'success', success: true});
        } catch (error) {
          console.error('Error in deleting:', error.message);
        }
    }
    else
        return res.json({msg:"Delete Id is Not Valid", msg_type : 'error', success: false });
});

module.exports = router;