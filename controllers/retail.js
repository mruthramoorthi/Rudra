const bcrypt =require("bcryptjs");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const bcFun = require('./backend-functions');
const htmls = require('../helpers');
const { getDb, initializeDatabase } = require('../db-connection');
const { table } = require("console");

initializeDatabase(); // Call this in app.js for initialization
const db = getDb(); // Safely get the connection

exports.price = async (req, res) => {
    let html = "<div class='rates-price'>";
    let lastProduct = ""; // Variable to track the last product added
    let sno = 0;
    try {
        const results = await bcFun.selectQuery(`SELECT * FROM product_category WHERE deleteon=? AND branch=? group by product,category order by category asc`, ['0000-00-00', userToken.site]);
        const rates = await bcFun.selectQuery(`SELECT * FROM rate_master WHERE deleteon=? AND branch=?`, ['0000-00-00', userToken.site]);
        results.forEach(item => {
            sno++;
            // Check if the product is different from the last one added
            if (item.product !== lastProduct) {
                // Add the product as a heading
                if(sno!==1)
                    html += `</div>`;
                html += `<div class="snowdiv"><h3>${bcFun.capitalizeFirstLetters(item.product)}</h3>`;
                lastProduct = item.product; // Update the last product added
            }
            const itemi = rates.find(itemi => itemi.category === item.category);
            let pricing = 0 ;
            if(itemi)
                pricing = itemi.price; // Return the price if the category is found
            // Add the category input element
            html += htmls.createInputElement({ type: "number", id: `${item.category.replaceAll(" ","_")}`, placeholder: bcFun.capitalizeFirstLetters(item.category), value: pricing });
        });
        lastProduct='';
        html += `</div>`;
        html += `<div class="snowdiv"><h3>Add-on Products</h3>`;
        const add_on = await bcFun.selectQuery(`SELECT * FROM add_on_products WHERE deleteon=? AND branch=? and status=?`, ['0000-00-00', userToken.site,"0"]);
        add_on.forEach(item => {
            sno++;
            const itemi = rates.find(itemi => itemi.category === item.name);
            let pricing = 0 ;
            if(itemi)
                pricing = itemi.price; // Return the price if the category is found
            // Add the category input element
            html += htmls.createInputElement({ type: "number", id: `${item.name.replaceAll(" ","_")}`, placeholder: bcFun.capitalizeFirstLetters(item.name), value: pricing });
        });
        lastProduct='';
        html += `</div><div class="snowdiv"><h3>Stone Products</h3>`;
        const stone = await bcFun.selectQuery(`SELECT * FROM stone_products WHERE deleteon=? AND branch=? and status=?`, ['0000-00-00', userToken.site,"0"]);
        stone.forEach(item => {
            sno++;
            const itemi = rates.find(itemi => itemi.category === item.name);
            let pricing = 0 ;
            if(itemi)
                pricing = itemi.price; // Return the price if the category is found
            // Add the category input element
            html += htmls.createInputElement({ type: "number", id: `${item.name.replaceAll(" ","_")}`, placeholder: bcFun.capitalizeFirstLetters(item.name), value: pricing });
        });
        res.json({ success: true, response: html+`</div></div>` });
    } catch (error) {
        console.error('Error:', error);  // Handle rejection properly here
        res.status(500).json({ success: false, msg: "Server Error" });
    }
}

exports.bank = async (req, res) => {
    bcFun.selectQuery(`SELECT distinct displayname FROM banks where deleteon=? and branch=?`,['0000-00-00',userToken.site])
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
}

exports.transactionType = async (req, res) => {
    bcFun.selectQuery(`SELECT distinct types FROM transaction_types where deleteon=?`,['0000-00-00'])
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
}

exports.modes = async (req, res) => {
    let options_arr = [];
    options_arr.push(`<option value="old">Old</option>`);
    options_arr.push(`<option value="coin">Coin</option>`);
    options_arr.push(`<option value="exchange">Exchange</option>`);
    options_arr.push(`<option value="pure">Pure</option>`);
    const html = options_arr.join('');
    res.json({ success: true, response: html });
}