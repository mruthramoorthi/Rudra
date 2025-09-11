const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const router = express.Router();
const { jsPDF } = require("jspdf");
const { all } = require("./order-report");
const autoTable = require("jspdf-autotable").default;

router.get("/customer", async (req, res) => {
    backendController.selectQuery(`SELECT distinct name,userid,primaryphonenumber FROM users where deleteon=? and branch=? and typeofpeople=?`,['0000-00-00',userToken.site,'customer'])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['userid']}[r~12]${item['name']}">${backendController.caps(item['name'])} - ${item['primaryphonenumber']}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
});

router.post("/avlStock", async (req, res) => {
    const {category, metal, counter, jewels, sub, pcs, weight} = req.body;
    try{
        const results = await backendController.selectQuery(
            `SELECT DISTINCT counter, metal, category, jeweltype, sum(weight) as weight, sum(pcs) as pcs FROM dealer_purchase where deleteon=? and branch=? and counter=? and category=? and jeweltype=? and subtype=? group by counter, jeweltype, metal, category ORDER BY uniqueid DESC`,
            ['0000-00-00', userToken.site, counter, category, jewels, sub]
        );
        const tagger = await backendController.selectQuery(`SELECT DISTINCT subtype, sum(weight) as weight, sum(pcs) as pcs FROM tagged_jewels where deleteon=? and branch=? and counter=? and category=? and jeweltype=? and subtype=? group by counter, jeweltype, category ORDER BY uniqueid DESC`, ['0000-00-00', userToken.site, counter, category, jewels, sub]);
        const missing = await backendController.selectQuery(`SELECT DISTINCT subtype, sum(weight) as weight, sum(pcs) as pcs FROM stock_missing where deleteon=? and branch=? and counter=? and category=? and jeweltype=? and subtype=? group by counter, jeweltype, category ORDER BY uniqueid DESC`, ['0000-00-00', userToken.site, counter, category, jewels, sub]);
        const weights = backendController.valNum(results?.[0]?.weight) - backendController.valNum(tagger?.[0]?.weight) - backendController.valNum(missing?.[0]?.weight);
        const pcss = backendController.valNum(results?.[0]?.pcs) - backendController.valNum(tagger?.[0]?.pcs) - backendController.valNum(missing?.[0]?.pcs);
        res.json({ success: true, response: {weight: weights, pcs: pcss} });
    }
    catch(e)
    {
        console.error('Error:', e);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    }
});
 
router.post("/taggedJewel", async (req, res) => {
    const {tag, all_tags} = req.body;
    try{
        const addid = backendController.generateUniqueId();
        const tagged = await backendController.selectQuery(`SELECT * FROM tagged_jewels where deleteon=? and branch=? and tagid=? and solddate=? group by counter, jeweltype, category ORDER BY uniqueid DESC`, ['0000-00-00', userToken.site, tag, '0000-00-00']);
        const control = await backendController.selectQuery(`SELECT * FROM jewel_master_control where deleteon=? and branch=? and category=? and code=? and subtype=? and minweight<=? and maxweight>=?`,['0000-00-00',userToken.site,tagged[0].category,tagged[0].code,tagged[0].subtype,tagged[0].weight,tagged[0].weight]);
        const rate_master = await backendController.selectQuery(`SELECT price FROM rate_master WHERE deleteon = ? and branch = ? and category=?`,['0000-00-00',userToken.site,tagged[0].category])
        // Just split the tag string
        const tagArray = all_tags.split(",");
        if(all_tags.includes(tag))
        {
            return res.json({success:false, msg_type:"error", msg:"Tag id Already Exist", response: ""});
        }
        let rate = 0;
        let jewel_rate = 0;
        const totalweight = tagged[0].totalstoneweight;
        const weight = tagged[0].weight - tagged[0].totalstoneweight - tagged[0].totaladdonweight;
        if(control[0].spltype!='nd' && control[0].spltype)
        {
            rate = control[0].splprice;
            if(control[0].spltype=="gram")
            jewel_rate = parseFloat(backendController.valNum(rate)) * parseFloat(backendController.valNum(weight));
            else
            jewel_rate = parseFloat(backendController.valNum(rate));
        }
        else
        {
            rate = rate_master[0].price;
            jewel_rate = parseFloat(backendController.valNum(rate)) * parseFloat(backendController.valNum(weight));
        }
        const jewel_raw_Amount = parseFloat(backendController.valNum(jewel_rate));
        let min_w_gram = 0;
        let min_w_amount = 0;
        let min_w_perc = 0;
        if (control[0].wastetype == "perc")
        {
            min_w_perc = control[0].minwaste;
            min_w_gram = parseFloat(backendController.valNum(control[0].minwaste / 100)) * parseFloat(backendController.valNum(weight));
            min_w_amount = parseFloat(backendController.valNum(min_w_gram)) * parseFloat(backendController.valNum(rate));
        }
        else if (control[0].wastetype == "amt")
        {
            min_w_amount = parseFloat(backendController.valNum(control[0].minwaste)) * parseFloat(backendController.valNum(weight));
        }
        let max_w_gram = 0;
        let max_w_amount = 0;
        let max_w_perc = 0;
        let w_read_only = "";
        if (control[0].wastetype == "perc")
        {
            max_w_perc = control[0].maxwaste;
            max_w_gram = parseFloat(backendController.valNum(control[0].maxwaste / 100)) * parseFloat(backendController.valNum(weight));
            max_w_amount = parseFloat(backendController.valNum(max_w_gram)) * parseFloat(backendController.valNum(rate));
        }
        else if (control[0].wastetype == "amt")
        {
            w_read_only = "readonly";
            max_w_amount = parseFloat(backendController.valNum(control[0].maxwaste)) * parseFloat(backendController.valNum(weight));
        }
        let min_mc_gram = 0;
        let min_mc_amount = 0;
        let min_mc_perc = 0;
        if (control[0].mctype == "perc")
        {
            min_mc_perc = control[0].minmc;
            min_mc_gram = parseFloat(backendController.valNum(control[0].minmc / 100)) * parseFloat(backendController.valNum(weight));
            min_mc_amount = parseFloat(backendController.valNum(min_mc_gram)) * parseFloat(backendController.valNum(rate));
        }
        else if (control[0].mctype == "amt")
        {
            min_mc_amount = parseFloat(backendController.valNum(control[0].minmc)) * parseFloat(backendController.valNum(weight));
        }
        let max_mc_gram = 0;
        let max_mc_amount = 0;
        let max_mc_perc = 0;
        let mc_read_only = "readonly";
        if (control[0].mctype == "perc")
        {
            max_mc_perc = control[0].maxmc;
            max_mc_gram = parseFloat(backendController.valNum(control[0].maxmc / 100)) * parseFloat(backendController.valNum(weight));
            max_mc_amount= parseFloat(backendController.valNum(max_mc_gram)) * parseFloat(backendController.valNum(rate));
        }
        else if (control[0].mctype == "amt")
        {
            mc_read_only = "readonly";
            max_mc_amount= parseFloat(backendController.valNum(control[0].maxmc)) * parseFloat(backendController.valNum(weight));
        }    
        const stone_total_price = 0;
        const total_jewel_amount = parseFloat(stone_total_price) + parseFloat(max_w_amount) + parseFloat(max_mc_amount) + parseFloat(jewel_raw_Amount);
    
        const html =`<tr id="tag-jewel-tr${addid}" class='click-action jewel-cart-details' alt='${addid}' tabindex='0'><td class="jewel_snos"></td>
                    <td>${backendController.caps(tagged[0].category)} - ${backendController.caps(tagged[0].subtype)} (${tagged[0].pcs})
                    <div class='jewels-permenent' id='jwlper_${addid}'><div class="display-f adj"><label><b>W</b></label>
                    <input type="hidden" name="minwastep_${addid}" id="minwastep_${addid}" value="${min_w_perc}"/>
                    <input type="hidden" name="minwasteg_${addid}" id="minwasteg_${addid}" value="${min_w_gram}"/>
                    <input type="hidden" name="minwastea_${addid}" id="minwastea_${addid}" value="${min_w_amount}"/>
                    <input type="hidden" name="maxwastep_${addid}" id="maxwastep_${addid}" value="${max_w_perc}"/>
                    <input type="hidden" name="maxwasteg_${addid}" id="maxwasteg_${addid}" value="${max_w_gram}"/>
                    <input type="hidden" name="maxwastea_${addid}" id="maxwastea_${addid}" value="${max_w_amount}"/>
                    <div><input type="number" name="wastep_${addid}" id="wastep_${addid}" class='adj-box jwl_range_adjusters ${w_read_only}' value="${backendController.money(max_w_perc,3,0)}"/><label>.%</label></div>
                    <div><input type="number" name="wasteg_${addid}" id="wasteg_${addid}" class='adj-box jwl_range_adjusters ${w_read_only}' value="${backendController.money(max_w_gram,3,0)}"/><label>.G</label></div>
                    <div><input type="number" name="wastea_${addid}" id="wastea_${addid}" class='adj-box jwl_range_adjusters' value="${backendController.money(max_w_amount,3,0)}"/><label>./-</label></div></div>
                    <input type='range' id="waste_${addid}" name="waste_${addid}" class='jwl_range_adjusters' step='1' ctype='${control[0].wastetype}' minwaste='${control[0].minwaste}' maxwaste='${control[0].maxwaste}' min='${min_w_amount}' max='${max_w_amount}' value='${max_w_amount}'>
                    
                    <div class="display-f adj"><label><b>MC</b></label>
                    <input type="hidden" name="minmcp_${addid}" id="minmcp_${addid}" value="${min_mc_perc}"/>
                    <input type="hidden" name="minmcg_${addid}" id="minmcg_${addid}" value="${min_mc_gram}"/>
                    <input type="hidden" name="minmca_${addid}" id="minmca_${addid}" value="${min_mc_amount}"/>
                    <input type="hidden" name="maxmcp_${addid}" id="maxmcp_${addid}" value="${max_mc_perc}"/>
                    <input type="hidden" name="maxmcg_${addid}" id="maxmcg_${addid}" value="${max_mc_gram}"/>
                    <input type="hidden" name="maxmca_${addid}" id="maxmca_${addid}" value="${max_mc_amount}"/>
                    <div><input type="number" name="mcp_${addid}" id="mcp_${addid}" class='adj-box jwl_range_adjusters ${mc_read_only}' value="${backendController.money(max_mc_perc,3,0)}"/><label>.%</label></div>
                    <div><input type="number" name="mcg_${addid}" id="mcg_${addid}" class='adj-box jwl_range_adjusters ${mc_read_only}' value="${backendController.money(max_mc_gram,3,0)}"/><label>.G</label></div>
                    <div><input type="number" name="mca_${addid}" id="mca_${addid}" class='adj-box jwl_range_adjusters' value="${backendController.money(max_mc_amount,3,0)}"/><label>./-</label></div></div>
                    <input type='range' id="mc_${addid}" name="mc_${addid}" class='jwl_range_adjusters' step='1' ctype='${control[0].mctype}' minmc='${control[0].minmc}' maxmc='${control[0].maxmc}' min='${min_mc_amount}' max='${max_mc_amount}' value='${max_mc_amount}'>
                    <input type="hidden" name="splprice_${addid}" id="splprice_${addid}" ctype='${control[0].spltype}' value="${control[0].splprice}"/></div>
                    </td>
                    <td>${0}</td>
                    <td class='right-align'>${backendController.money(tagged[0].weight, 3, 1)}.G</td>
                    <td class='right-align'>${backendController.money(total_jewel_amount,3,1)}</td>
                    <td><img src='/images/delete.png' class='delete-jewel-cart-button' id='delete${addid}' lot='${addid}'></td>
                    <input type='hidden' id='tag-id${addid}' name='tag-id${addid}' class='all_tags' value='${tagged[0].tagid}'>
                    <input type='hidden' id='individual-jwl${addid}' name='individual-jwl${addid}' class='all_jewel_amount' value='${total_jewel_amount}'>
                    <input type='hidden' id='individual-jwl-wt${addid}' name='individual-jwl-wt${addid}' class='all_jewel_weight' value='${totalweight}'>
                    <input type='hidden' id='stone_type_${addid}' name='stone_type_${addid}' class='' value=''>
                    <input type='hidden' id='jewelphoto_${addid}' name='jewelphoto_${addid}' class='' value='${tagged[0].jewelphoto}'>
                    <input type='hidden' id='pcs_${addid}' name='pcs_${addid}' class='' value='${tagged[0].pcs}'>
                    <input type='hidden' id='code_${addid}' name='code_${addid}' class='' value='${control[0].code}'>
                    <input type='hidden' id='product_${addid}' name='product_${addid}' class='' value='${control[0].category}'>
                    <input type='hidden' id='jewel_type_${addid}' name='jewel_type_${addid}' class='' value='${control[0].jeweltype}'>
                    <input type='hidden' id='sub_type_${addid}' name='sub_type_${addid}' class='' value='${control[0].subtype}'>
                    <input type='hidden' id='jewel_rate_${addid}' name='jewel_rate_${addid}' class='' value='${rate}'>
                    <input type='hidden' id='spltype_${addid}' name='spltype_${addid}' class='' value='${control[0].spltype}'>
                    <input type='hidden' id='mctype_${addid}' name='mctype_${addid}' class='' value='${control[0].mctype}'>
                    <input type='hidden' id='wastetype_${addid}' name='wastetype_${addid}' class='' value='${control[0].wastetype}'>
                    <input type='hidden' id='stone_count_${addid}' name='stone_count_${addid}' class='' value=''>
                    <input type='hidden' id='stone_weight_${addid}' name='stone_weight_${addid}' class='' value=''>
                    <input type='hidden' id='stone_price_${addid}' name='stone_price_${addid}' class='' value=''>
                    <input type='hidden' id='stone_carat_size_${addid}' name='stone_carat_size_${addid}' class='' value=''>
                    <input type='hidden' id='stone_carat_price_${addid}' name='stone_carat_price_${addid}' class='' value=''>
                    <input type='hidden' id='stone_total_price_${addid}' name='stone_total_price_${addid}' class='totalstoneprices' value=''>
                    <input type='hidden' id='stone_total_weight_${addid}' name='stone_total_weight_${addid}' class='totalstoneweights' value=''></tr>`;
        return res.json({success:true, response: html});
    }
    catch(e)
    {
        return res.json({success:false, msg_type:"error", msg:"Tag id Not Exist "+e, response: ""});
    }
});

router.get("/counter", async (req, res) => {
    backendController.selectQuery(`SELECT distinct counter FROM counter where deleteon=? and branch=?`,['0000-00-00',userToken.site])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['counter']}">${backendController.caps(item['counter'])}</option>`);
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
    const data = JSON.parse(req.headers.data);
    const {category, counter} = data;
    backendController.selectQuery(`SELECT distinct t1.jeweltype as code,t2.jeweltype FROM dealer_purchase as t1 join jewel_master_control as t2 on t1.jeweltype = t2.code where t1.deleteon=? and t1.branch=? and t1.category=? and t1.counter=?`,['0000-00-00',userToken.site,category, counter])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['code']}[s~1]${item['jeweltype']}">${backendController.caps(item['jeweltype'])}</option>`);
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
    const data = JSON.parse(req.headers.data);
    const {category, counter, jewels} = data;
    backendController.selectQuery(`SELECT distinct subtype FROM dealer_purchase where deleteon=? and branch=? and category=? and counter=? and jeweltype=?`,['0000-00-00',userToken.site,category,counter,jewels])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['subtype']}">${backendController.caps(item['subtype'])}</option>`);
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
    backendController.selectQuery(`SELECT distinct category FROM dealer_purchase where deleteon=? and branch=? and counter=?`,['0000-00-00',userToken.site,counter])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['category']}">${backendController.caps(item['category'])}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
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

  router.get("/staffs", async (req, res) => {
    
    backendController.selectQuery(`SELECT distinct name,userid FROM users where deleteon=? and branch=? and typeofpeople!=?`,['0000-00-00',userToken.site,'customer'])
    .then(results => {
        let options_arr = [];
        results.forEach(item => {
            options_arr.push(`<option value="${item['userid']}}">${backendController.caps(item['name'])}</option>`);
        });
        const html = options_arr.join('');
        res.json({ success: true, response: html });
    })
    .catch(error => {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg_type:"error", msg: "Server Error" });
    });
 });

 router.post("/fetchDetails", async (req, res) => {
    const {customer} = req.body;
    const real_customer = customer.split("[r~12]");
    try{
            const customer_details = await backendController.selectQuery(`select * from users where deleteon=? and branch=? and userid=?`,['0000-00-00',userToken.site,real_customer[0]]);
            res.json({success:true, response: customer_details});
    } catch (error) {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg: "Server Error" });
    }
});

module.exports = router;