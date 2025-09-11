// controllers/backend-functions.js
const dbConn = require('../db-connection');
// const users = require('./users');
const { PDFDocument } = require('pdf-lib');
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { body } = require('express-validator');
const os = require('os');
// Get device (hostname)
const deviceName = os.hostname();

// Get operating system name
const osName = os.type();  // 'Linux', 'Darwin' (Mac), 'Windows_NT'

// Get OS version
const osVersion = os.release();

// Get OS platform
const osPlatform = os.platform(); // 'win32', 'linux', 'darwin'

dbConn.initializeDatabase(); // Call this in app.js for initialization
const db = dbConn.getDb(); // Safely get the connection

const dateTime = () => {
  const now = new Date();
const formatDate = now.toISOString().split('T')[0];
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
const seconds = String(now.getSeconds()).padStart(2, '0');
const formatTime = `${hours}:${minutes}:${seconds}`;
return { date: formatDate, time: formatTime };

};


// backendControllers

// Create PDF
async function createPDF() {
  const { PDFDocument } = require('pdf-lib'); // Ensure proper imports
  const pdfDoc = await PDFDocument.create();
  return pdfDoc;
}

// Function to get the selected font
async function createFont(pdfDoc, fontType = 'Helvetica') {
  // Available font options
  const { StandardFonts } = require('pdf-lib'); // Ens
  const fonts = {
    Helvetica: StandardFonts.Helvetica,
    'Helvetica-Bold': StandardFonts.HelveticaBold,
    'Helvetica-Italic': StandardFonts.HelveticaItalic,
    'Helvetica-BoldItalic': StandardFonts.HelveticaBoldItalic,
    'Times-Roman': StandardFonts.TimesRoman,
    'Times-Bold': StandardFonts.TimesBold,
    'Times-Italic': StandardFonts.TimesItalic,
    'Times-BoldItalic': StandardFonts.TimesBoldItalic,
    Courier: StandardFonts.Courier,
    'Courier-Bold': StandardFonts.CourierBold,
    'Courier-Italic': StandardFonts.CourierItalic,
    'Courier-BoldItalic': StandardFonts.CourierBoldItalic,
  };

  // Check if the font is valid, otherwise default to Helvetica
  if (!fonts[fontType]) {
    throw new Error(`Invalid font type: ${fontType}. Available fonts are: ${Object.keys(fonts).join(', ')}`);
  }

  // Embed the font and return it
  const font = await pdfDoc.embedFont(fonts[fontType]);
  return font;
}
  
// Generate PDF and return the bytes
async function generatePDF(content) {
  // Save the PDF and return the byte array (Uint8Array)
  const pdfBytes = await content.save();
  return pdfBytes;
}



const deleted = async (req, res) => {
  try {
    const { tableName, whereCondition, values } = req.body;

    // Validate input
    if (!tableName || typeof tableName !== 'string' || !whereCondition || !Array.isArray(values) || values.length === 0) {
      return res.json({ success: false, msg: 'Invalid input data.', msg_type: "error" });
    }

    // Prepare condition string for the SQL query
    const condition = whereCondition;  // Assuming `whereCondition` is like "role = ? AND pages = ?"

    const { date, time } = dateTime(); // Get current date and time

    // Create the SQL query using parameterized inputs
    const sqlUpdate = `
      UPDATE ${mysql.escapeId(tableName)} 
      SET deleteid=?, deletename=?, deleteon = ?, deleteat = ?
      WHERE ${condition} AND deleteon='0000-00-00'
    `;
    // Combine the parameters for the query
    const userToken = global.userToken || { userid: '', name: '' };
    const params = [userToken.userid, userToken.name, date, time, ...values];  // Add date and time to the parameters

    // Wrap the database query in a promise
    return new Promise((resolve, reject) => {
      db.query(sqlUpdate, params, (err, result) => {
        // console.log("Full SQL Query:", mysql.format(sqlUpdate, params));
        if (err) {
          reject({ success: false, msg: err.message, msg_type: "error" });
        } else {
          if (result.affectedRows === 0)
            resolve({ success: false, msg: 'No matching records found to update.', msg_type: "error" });
          else
            resolve({ success: true, msg: 'Data updated successfully.', msg_type: "success" });
        }
      });
    });
  } catch (err) {
    console.error('Error in deleted function:', err);
    return { success: false, msg: 'An error occurred in the deleted function', msg_type: "error" };
  }
};

// function exQry()
// {
//   console.log("Full SQL Query:", mysql.format(sqlUpdate, params));
// }

const insert = async (req, res) => {
  const { tableName, data, column, id } = req.body; // Include column in the request body
  if (!tableName || typeof tableName !== 'string' || Object.keys(data).length === 0) {
    return { success: false, msg: 'Invalid input data.', msg_type: "error" };
  }

  const cleanedData = {};
  Object.keys(data).forEach(key => {
      cleanedData[key] = data[key] === null ? "" : data[key];
  });

  const { date, time } = dateTime(); // Get current date and time
  const userToken = global.userToken || { userid: '', name: '' };

  // Prepare the SQL query for the insert
  const sqlInsert = `INSERT INTO ${mysql.escapeId(tableName)} SET ?`;
  const completeData = {
    ...cleanedData,
    entrydate: date,
    entrytime: time,
    enteredbyid: userToken.userid,
    enteredbyname: userToken.name,
    branch: userToken.site || '',
    system_info: `${deviceName}|${osName}|${osVersion}|${osPlatform}`
  };

  return new Promise((resolve, reject) => {
    // Execute the SQL insert query
    db.query(sqlInsert, completeData, (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        reject({ success: false, msg: err.message, msg_type: "error" });
      } else {
        // After insert, retrieve the last inserted ID
        const lastInsertId = result.insertId;
        // Check if a column name is provided to update
        if (column && typeof column === 'string') {
          // Prepare the SQL query to update the specified column with the lastInsertId
          const sqlUpdate = `UPDATE ${mysql.escapeId(tableName)} SET ${mysql.escapeId(column)} = ? WHERE uniqueid = ?`;
          let newId = lastInsertId;
          if(id)
            newId = id;
          // Execute the update query
          db.query(sqlUpdate, [newId, lastInsertId], (updateErr, updateResult) => {
            if (updateErr) {
              console.error('Error updating data:', updateErr);
              reject({ success: false, msg: updateErr.message, msg_type: "error" });
            } else {
              resolve({
                success: true,
                msg_type: "success",
                msg: 'Data inserted and column updated successfully.',
                lastInsertId: lastInsertId,
                newId: newId,
              });
            }
          });
        } else {
          resolve({
            success: true,
            msg_type: "success",
            msg: 'Data inserted successfully.',
            lastInsertId: lastInsertId,
          });
        }
      }
    });
  });
};

const insert_app = async (req, res) => {
  const { tableName, data, column, id } = req.body; // Include column in the request body
  if (!tableName || typeof tableName !== 'string' || Object.keys(data).length === 0) {
    return { success: false, msg: 'Invalid input data.', msg_type: "error" };
  }

  const cleanedData = {};
  Object.keys(data).forEach(key => {
      cleanedData[key] = data[key] === null ? "" : data[key];
  });

  const { date, time } = dateTime(); // Get current date and time
  const userToken = global.userToken || { userid: '', name: '' };

  // Prepare the SQL query for the insert
  const sqlInsert = `INSERT INTO ${mysql.escapeId(tableName)} SET ?`;
  const completeData = {
    ...cleanedData,
    entrydate: date,
    entrytime: time,
    system_info: `${deviceName}|${osName}|${osVersion}|${osPlatform}`
  };

  return new Promise((resolve, reject) => {
    // Execute the SQL insert query
    db.query(sqlInsert, completeData, (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        reject({ success: false, msg: err.message, msg_type: "error" });
      } else {
        // After insert, retrieve the last inserted ID
        const lastInsertId = result.insertId;
        // Check if a column name is provided to update
        if (column && typeof column === 'string') {
          // Prepare the SQL query to update the specified column with the lastInsertId
          const sqlUpdate = `UPDATE ${mysql.escapeId(tableName)} SET ${mysql.escapeId(column)} = ? WHERE uniqueid = ?`;
          let newId = lastInsertId;
          if(id)
            newId = id;
          // Execute the update query
          db.query(sqlUpdate, [newId, lastInsertId], (updateErr, updateResult) => {
            if (updateErr) {
              console.error('Error updating data:', updateErr);
              reject({ success: false, msg: updateErr.message, msg_type: "error" });
            } else {
              resolve({
                success: true,
                msg_type: "success",
                msg: 'Data inserted and column updated successfully.',
                lastInsertId: lastInsertId,
                newId: newId,
              });
            }
          });
        } else {
          resolve({
            success: true,
            msg_type: "success",
            msg: 'Data inserted successfully.',
            lastInsertId: lastInsertId,
          });
        }
      }
    });
  });
};


const updateQuery = async (table, data, where, params = [], order="order by uniqueid desc", columni="", idi="") => {
  try {
    // Step 1: Fetch the records to be deleted and updated
    let condition = '';
    if (where) condition = `AND ${where}`;
    const insertionResults = [];
      // Perform the SELECT query to fetch data before deletion
      const results = await selectQuery(`SELECT * FROM ${table} WHERE deleteon='0000-00-00' ${condition} ${order}`, params);
      if(!results[0])
      {
        // If no records found for the condition, insert new data
        const newInsert = await insert({ body: { tableName: table, data, column:columni, id:idi } }); // Insert the new data
        const insertionResults = [];
        insertionResults.push(newInsert);
        return { success: true, msg: 'No records found, new data inserted successfully', msg_type: 'success', result: insertionResults };
      }
      // Store the fetched data in a variable
      const filteredData = results.map(row => {
        const keys = Object.keys(row);
        const uniqueidIndex = keys.indexOf('uniqueid');

        // Extract data before 'uniqueid' to prevent overwriting the uniqueid field
        return keys.slice(0, uniqueidIndex).reduce((obj, key) => {
          if (data.hasOwnProperty(key)) {
            obj[key] = data[key]; // Apply the value from the data object
          } else {
            obj[key] = row[key]; // Keep original value for columns not in the data object
          }
          return obj;
        }, {});
      });
      // Step 2: Perform deletion
      const deleteResponse = await deleted({ body: { tableName: table, whereCondition: where, values: params } });
      if (!deleteResponse.success) {
        return deleteResponse; // Return the error from the deleted function
      }
      // Step 3: Insert the filtered/modified data after deletion
      for (const item of filteredData) {
        const results = await insert({ body: { tableName: table, data: item, column: columni, id: idi } }); // Insert modified data
        insertionResults.push(results);
      }
      return { success: true, msg: 'Records updated and deleted successfully', msg_type: 'success', result:insertionResults };
  } catch (err) {
    // Catch any errors during the process and log them
    console.error('Error in the update process:', err);
    return { success: false, msg: 'An unexpected error occurred', msg_type: 'error' };
  }
};

// Function to execute a SELECT query with parameters and return the result as a Promise
const selectQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    // Check if query is provided and is a string
    if (!query || typeof query !== 'string') {
      return reject('Invalid query format');
    }

    // List of restricted SQL keywords
    const restrictedKeywords = ['insert ', 'delete ', 'drop ', 'update '];

    // Convert query to lowercase to make it case-insensitive
    const lowerQuery = query.toLowerCase();

    // Check if query contains any restricted keyword
    const containsRestrictedKeyword = restrictedKeywords.some(keyword => lowerQuery.includes(keyword));

    // If the query contains a restricted keyword, reject it
    if (containsRestrictedKeyword) {
      return reject('Query contains restricted SQL keywords');
    }
    // const formattedQuery = mysql.format(query, params);
    // console.log('Full SQL Query:', formattedQuery);
    // Execute the SELECT query with parameters
    db.query(query, params, (err, results) => {
      // console.log("Full SQL Query sins :", mysql.format(query, params));
      if (err) {
        console.error('Error executing query:', err);
        return reject('Error executing the query');
      }
      // Resolve the Promise with the query results
      resolve(results);
    });
  });
};


// Function to execute a SELECT query with parameters and return the result as a Promise
const updateQry = (query, params = []) => {
  return new Promise((resolve, reject) => {
    // Check if query is provided and is a string
    if (!query || typeof query !== 'string') {
      return reject('Invalid query format');
    }

    // List of restricted SQL keywords
    const restrictedKeywords = ['insert ', 'delete ', 'drop ', 'select '];

    // Convert query to lowercase to make it case-insensitive
    const lowerQuery = query.toLowerCase();

    // Check if query contains any restricted keyword
    const containsRestrictedKeyword = restrictedKeywords.some(keyword => lowerQuery.includes(keyword));

    // If the query contains a restricted keyword, reject it
    if (containsRestrictedKeyword) {
      return reject('Query contains restricted SQL keywords');
    }

    // Execute the SELECT query with parameters
    db.query(query, params, (err, results) => {
      // console.log("Full SQL Query sins :", mysql.format(query, params));
      if (err) {
        console.error('Error executing query:', err);
        return reject('Error executing the query');
      }
      // Resolve the Promise with the query results
      resolve(results);
    });
  });
};


function getCurrentTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

function getCurrentDate() {
  const currentDate = new Date();

  // Get the year, month, and day
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based, so add 1
  const day = String(currentDate.getDate()).padStart(2, '0'); // Ensure two digits

  // Return the formatted date
  return `${year}-${month}-${day}`;
}

function rtrim(str, splitter) {
  // 1. Input Validation
  if (typeof str !== 'string') {
    throw new Error('First parameter must be a string');
  }
  
  if (typeof splitter !== 'string' || splitter === '') {
    throw new Error('Second parameter must be a non-empty string');
  }

  // 2. Split and Process
  try {
    const real_arr = str.split(splitter);
    const emptyIndices = [];
    
    for (let i = 0; i < real_arr.length; i++) {
      if (real_arr[i]) {
        emptyIndices.push(real_arr[i]);
      }
    }
    
    // 3. Return Result
    return emptyIndices.length > 0 
      ? emptyIndices.join(splitter) 
      : '';
      
  } catch (error) {
    throw new Error(`Processing failed: ${error.message}`);
  }
}

const createTable = (req, res) => {
    const { table_Name } = req.body;
  
    // Validate the table name to prevent SQL injection and errors
    if (!table_Name || typeof table_Name !== 'string' || table_Name.trim().length === 0) {
      return res.status(400).json({ success: false, msg: 'Invalid table name.', msg_type: "error" });
    }
  
    // Use `mysql.escapeId` to safely escape table names
    const escapedtable_Name = mysql.escapeId(table_Name);
  
    // SQL query to create the table with predefined columns
    const createTableQuery = `
      CREATE TABLE ${escapedtable_Name} (
        uniqueid INT AUTO_INCREMENT PRIMARY KEY,
        branch VARCHAR(50) not null,
        system_info VARCHAR(128) not null,
        deleteon DATE not null,
        deleteat TIME not null,
        deleteid VARCHAR(100) not null,
        deletename VARCHAR(50) not null,
        entrydate DATE not null not null,
        entrytime TIME not null not null,
        enteredbyid VARCHAR(100) not null,
        enteredbyname VARCHAR(50) not null
      );
    `;
    // Execute the query to create the table
    db.query(createTableQuery, (err, result) => {
      if (err) {
        console.error('Error creating table: ', err);
        // Return detailed error messages only in development mode for debugging purposes
        return res.status(500).json({ success: false, msg: 'Failed to create table.', error: err.message, msg_type: "error" });
      }
  
      res.status(200).json({ success: true, msg: `Table '${table_Name}' created successfully.`, msg_type: "success" });
    });
  };

  const fetchDataForTable = (request, response, table, columns, serialNeeded, act, customQueries = null, customActions = null, whereConditions = []) => {
    try {
      const { draw, start, length, order, search } = request.query;
  
      const column_index = (order && order[0]?.column) || 0;
      const column_sort_order = (order && order[0]?.dir) || 'desc';
      const column_name = (columns && columns[column_index]?.name) || 'uniqueid';
      const search_value = search?.value || '';
      const offset = parseInt(start) || 0;
      const limit = parseInt(length) || 10;
  
      // Dynamically construct WHERE clause safely using placeholders
      const searchQuery = search_value
        ? `WHERE ${columns.map(col => `${col.name} LIKE ?`).join(' OR ')}`
        : '';
  
      const fullWhereConditions = whereConditions.join(' AND ');
      const combinedWhereClause = fullWhereConditions
        ? `${searchQuery} ${searchQuery ? 'AND' : ''} ${fullWhereConditions}`
        : searchQuery;
  
      const queryParams = search_value
        ? [...columns.map(() => `%${search_value}%`), limit, offset]
        : [limit, offset];
  
      const columnList = columns.map(col => col.name).join(', ');
  
      let query1 = '';
      let query2 = '';
      let query3 = '';
      let query4 = '';
  
      if (customQueries) {
        query1 = customQueries.query1;
        query2 = customQueries.query2;
        query3 = customQueries.query3;
      } else {
        query1 = `
          SELECT 
            ${serialNeeded ? 'ROW_NUMBER() OVER (ORDER BY uniqueid desc) AS serial_number,' : ''}${columnList}, uniqueid
          FROM ${table} where
          ${combinedWhereClause}
          ORDER BY uniqueid ${column_sort_order}
        `;
  
        query2 = `SELECT COUNT(*) AS Total FROM ${table} where ${fullWhereConditions}`;
        query3 = `SELECT COUNT(*) AS Total FROM ${table} where ${combinedWhereClause}`;
        query4 = `SELECT * FROM ${table} WHERE uniqueid = ?`;
      }
  
      db.query(query1, queryParams, (dataError, dataResult) => {
        if (dataError) {
          console.error('Error fetching data:', dataError);
          return response.status(500).write('Error fetching data.');
        }
  
        const dataWithActionsPromises = dataResult.map(async (row) => {
          try {
            const detailedRecord = await new Promise((resolve, reject) => {
              db.query(query4, [row.uniqueid], (err, result) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(result[0]);
                }
              });
            });
  
            const editFunction = customActions?.edit || 'editRow';
            const deleteFunction = customActions?.delete || 'deleteRow';
  
            row.actions = `
              <div class='flex-with-space-edit-delete'>
                <img src="/images/edit.png" width="25" height="25" class="edit-icon" title="" id="${editFunction}${row.uniqueid}" uniquekey="${row.uniqueid}" datas='${JSON.stringify(detailedRecord)}'>
                <img src="/images/delete.png" class="delete-icon" title="" width="25" height="25" id="${deleteFunction}${row.uniqueid}" uniquekey="${row.uniqueid}" datas='${JSON.stringify(detailedRecord)}'>
              </div>
            `;
          } catch (err) {
            console.error('Error fetching detailed record for uniqueid:', row.uniqueid, err);
          }
          return row;
        });
  
        Promise.all(dataWithActionsPromises).then((dataWithActions) => {
          db.query(query2, (totalDataError, totalDataResult) => {
            if (totalDataError) {
              console.error('Error fetching total records:', totalDataError);
              return response.status(500).write('Error fetching total record count.');
            }
  
            db.query(query3, queryParams.slice(0, 2), (totalFilterDataError, totalFilterDataResult) => {
              if (totalFilterDataError) {
                console.error('Error fetching filtered records:', totalFilterDataError);
                return response.status(500).write('Error fetching filtered record count.');
              }
  
              const columns_arr = [];
              if (serialNeeded) {
                columns_arr.push({ title: 'S.No', data: 'serial_number' });
              }
  
              columns_arr.push(...columns.map(col => ({ title: col.title, data: col.name })));
  
              if (act) {
                columns_arr.push({ title: 'Actions', data: 'actions' });
              }
  
              const responseData = {
                draw: parseInt(draw) || 0,
                recordsTotal: totalDataResult[0]?.Total || 0,
                recordsFiltered: totalFilterDataResult[0]?.Total || 0,
                data: dataWithActions || [],
                columns: columns_arr
              };
              response.write(JSON.stringify(responseData));
              response.end();
            });
          });
        }).catch(err => {
          console.error('Error processing data with actions:', err);
          response.status(500).write('Error processing data.');
          response.end();
        });
      });
    } catch (error) {
      console.error('Unexpected server error:', error);
      response.status(500).write('Unexpected server error occurred.');
      response.end();
    }
  };
  


  
  // image uploader

  // Upload endpoint to handle image upload
const upload = (req, res) => {
  // Folder where images will be saved
  const uploadDir = path.join(__dirname, 'uploads');

  // Ensure the uploads folder exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }
  const imageData = req.body.image;
  
  if (!imageData) {
    return res.status(400).json({ success: false, msg: 'No image data provided', msg_type: "error" });
  }

  // Generate a unique filename
  const filename = `image_${Date.now()}.jpg`;
  const filePath = path.join(uploadDir, filename);

  // Convert base64 to binary and write to file
  const base64Data = imageData.replace(/^data:image\/jpeg;base64,/, '');
  fs.writeFile(filePath, base64Data, 'base64', (err) => {
    if (err) {
      return res.status(500).json({ success: false, msg: 'Failed to save image', msg_type: "error" });
    }

    res.json({ success: true, msg: 'Image uploaded successfully', filename, msg_type: "error" });
  });
}

function DateAfterOneMonth(date) {
 // Parse the date string into a Date object
 const inputDate = new Date(date);

 // Add one month to the date
 inputDate.setMonth(inputDate.getMonth() + 1);

 // Format the new date back to YYYY-MM-DD format
 const year = inputDate.getFullYear();
 const month = String(inputDate.getMonth() + 1).padStart(2, '0'); // Ensure two digits
 const day = String(inputDate.getDate()).padStart(2, '0'); // Ensure two digits

 return `${year}-${month}-${day}`;
}

// Convert the function to async, returning a Promise
function generateUniqueId() {
  const timestamp = Date.now();
  const uuid = uuidv4();
  const uniqueId = `${timestamp}-${uuid}`;
  return uniqueId; // Resolve the promise with the generated unique ID
}
// Create an array of all defined functions for dynamic exporting

function isAtLeast18YearsOld(dob) {

  const dobDate = new Date(dob);
  if (isNaN(dobDate))
      return false;

  const today = new Date();
  let age = today.getFullYear() - dobDate.getFullYear();
  const monthDifference = today.getMonth() - dobDate.getMonth();
  const dayDifference = today.getDate() - dobDate.getDate();

  // Adjust age if the birthday hasn't occurred yet this year
  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0))
      age--;

  if (age < 18)
    return true;
  else
    return false;
}

// Define the rawDateFormat function
function rawDateFormat(dateString, format='ymd',split='/') {
  // Ensure the date string is valid
  const date = new Date(dateString);
  if (isNaN(date)) {
    console.error("Invalid date:", dateString);
    return undefined; // Return undefined if the date is invalid
  }

  // Extract the day, month, and year
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() is 0-indexed
  const year = date.getFullYear();
    // Return the formatted date
if(format==="ymd")
  return `${year}${split}${month}${split}${day}`;
else if(format==="dmy")
  return `${day}${split}${month}${split}${year}`;
}

function generateImageTag(path, id, className, style) {
  const imagePathParts = path.split("[pics~pics]").filter(item => item.trim() !== "");
  // If the array is empty, return "No"
  if (imagePathParts.length === 0)
    return "No";
  // Create an array to store the generated <img> tags
  let imgTags = [];

  // Loop through the path parts and generate the <img> tags
  imagePathParts.forEach(item => {
    const imgTag = `<img src="${item}" id="${id}" class="${className}" style="${style}" alt="Image">`;
    imgTags.push(imgTag);
  });

  // Return the array of generated <img> tags, or join them as a single string
  return imgTags.join(""); // If you want to return them as a single string, you can join them with an empty string
}


function loadOptions(fullarray, optionDisplayColumns, optionValueColumns) 
{
    const displayColumns = optionDisplayColumns;
    const valueColumns = optionValueColumns;
    let options_arr = [];
    
    fullarray.forEach(item => {
        let optionTag = `<option value="${item[valueColumns]}">${item[displayColumns]}</option>`;
        options_arr.push(optionTag);
    });
    return options_arr.join('');
}

function capitalizeFirstLetters(inputString) {
  if (!inputString || typeof inputString !== 'string') {
    return ''; // Return an empty string if input is invalid
  }

  return inputString
    .split(' ') // Split the string into words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
    .join(' '); // Join the words back into a single string
}

function caps(inputString) {
  if (!inputString || typeof inputString !== 'string') {
    return ''; // Return an empty string if input is invalid
  }

  return inputString
    .split(' ') // Split the string into words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
    .join(' '); // Join the words back into a single string
}

function allCaps(inputString) {
  if (!inputString || typeof inputString !== 'string') {
    return ''; // Return an empty string if input is invalid
  }

  return inputString.toUpperCase(); // Convert the entire string to uppercase
}


function numberToWords(num) {
  if (num === 0) return "zero";

  const belowTwenty = [
      "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
      "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"
  ];
  const tens = [
      "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"
  ];
  const scales = ["", "thousand", "million", "billion"];

  function toWords(num) {
      if (num === 0) return "";
      else if (num < 20) return belowTwenty[num];
      else if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + belowTwenty[num % 10] : "");
      else if (num < 1000) {
          return (
              belowTwenty[Math.floor(num / 100)] +
              " hundred" +
              (num % 100 ? " and " + toWords(num % 100) : "")
          );
      }
      for (let i = 0, unit = 1; i < scales.length; i++, unit *= 1000) {
          if (num < unit * 1000) {
              return (
                  toWords(Math.floor(num / unit)) +
                  " " +
                  scales[i] +
                  (num % unit ? " " + toWords(num % unit) : "")
              );
          }
      }
  }

  // Handle decimal numbers
  const parts = num.toString().split(".");
  const integerPart = parseInt(parts[0], 10);
  const decimalPart = parts[1] ? parts[1] : "";

  let words = toWords(integerPart);

  if (decimalPart) {
      const decimalWords = decimalPart
          .split("")
          .map(digit => belowTwenty[parseInt(digit, 10)])
          .join(" ");
      words += " point " + decimalWords;
  }

  return words.trim();
}

function money(number, decimals = 0, comma = 1) {
  try {
      // Ensure the input is a valid number
      if (isNaN(number)) {
          number = 0;
      }

      // Convert the input to a number and apply the decimal formatting
      let formattedNumber = Number(number).toFixed(decimals);

      // If comma is set to 1, add comma as a thousands separator
      if (comma === 1) {
          formattedNumber = Number(formattedNumber).toLocaleString();
      }

      // Ensure there are always 'decimals' number of digits after the decimal point
      if (decimals > 0) {
          let parts = formattedNumber.split('.');
          // If there's no decimal part or it's less than the desired decimals, pad with zeros
          if (parts.length === 1) {
              formattedNumber += '.' + '0'.repeat(decimals);
          } else if (parts[1].length < decimals) {
              formattedNumber = parts[0] + '.' + parts[1] + '0'.repeat(decimals - parts[1].length);
          }
      }

      return formattedNumber;
  } catch (error) {
      console.error(error.message);
      return '0'; // Return '0' in case of an error
  }
}


function formatNumberWithCommas(number) {
  try {
      // Ensure the input is a valid number
      if (isNaN(number)) {
          throw new Error("Invalid input: Input must be a valid number.");
      }

      // Convert the input to a number and then to a string
      return Number(number).toLocaleString();
  } catch (error) {
      console.error(error.message);
      return null; // Return null or a fallback value in case of an error
  }
}

function valNum(value)
{
  return isNaN(value) || value === undefined || value === null || value === '' || value === 0 ? 0 : parseFloat(value);
}

function generateOTP(length = 6) {
  const digits = '0123456789';
  let otp = '';

  for (let i = 0; i < length; i++) {
    otp += digits.charAt(Math.floor(Math.random() * digits.length));
  }

  return otp;
}

async function generateUniqueNumbers(table, columnName, length, prefix = '') {
  let uniqueNumbers = new Set(); // To keep track of unique random numbers

  // Helper function to generate a random number with a specific length
  function generateRandomNumber() {
      // Generate a random number and ensure it has the correct length by padding with leading zeros
      let randomNumber = Math.floor(Math.random() * Math.pow(10, length)); // This generates a number up to 10^length-1
      return randomNumber.toString().padStart(length, '0'); // Ensure the number has the correct length (e.g., '0078' for length 4)
  }

  // Query the table to get the existing numbers from the column
  const query_result = await selectQuery(`SELECT DISTINCT ${columnName} FROM ${table}`);
  
  // Get all existing numbers from the column in the table
  const existingNumbers = query_result.map(row => row[columnName].toString().padStart(length, '0'));

  while (uniqueNumbers.size < length) {
      const randomNumber = generateRandomNumber();

      // Check if the number already exists in the table column or in the unique set
      if (!existingNumbers.includes(randomNumber) && !uniqueNumbers.has(randomNumber)) {
          uniqueNumbers.add(randomNumber);
      }
  }

  // Add prefix if needed and return the final array of unique random numbers
  const result = Array.from(uniqueNumbers).map(num => prefix + num);
  return result;
}

// // Example usage
// const table = [
//   { id: 1, number: 12345 },
//   { id: 2, number: 67890 },
//   { id: 3, number: 54321 }
// ];

// const columnName = 'number';
// const length = 5;
// const prefix = 'N-';

// const randomNumbers = generateUniqueNumbers(table, columnName, length, prefix);
// console.log(randomNumbers);


// Function to generate random numbers of a specific length
function generateRandomNumber(length) {
  let result = '';
  const characters = '0123456789'; // For numeric account codes
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// Function to get unique random numbers that don't exist in the table
async function getUniqueRandomNumbers(query, length, numOfRandoms) {
  try {
    // Fetch existing values from the database
    const result = await selectQuery(query);
    const existingAccountCodes = result.map(row => row.account_code); // Modify this if you're using a different column

    const randomNumbers = [];

    // Function to find a unique random number
    async function generateUniqueRandom() {
      let isUnique = false;
      let randomCode = '';

      while (!isUnique) {
        randomCode = generateRandomNumber(length); // Generate random number with specified length

        // Check if the random number already exists in the table or in the random numbers array
        if (!existingAccountCodes.includes(randomCode) && !randomNumbers.includes(randomCode)) {
          isUnique = true;
          randomNumbers.push(randomCode); // Add the unique random number
        }
      }
    }

    // Generate the required number of unique random numbers
    while (randomNumbers.length < numOfRandoms) {
      await generateUniqueRandom();
    }

    if(numOfRandoms==1)
    return randomNumbers[0];
    else
    return randomNumbers;
  } catch (error) {
    console.error("Error fetching account codes:", error);
    throw error;
  }
}

async function accountsDelete(from, id) {
  try {

    // Delete from transactions table using both from and id
    await deleted({ body: {'tableName': 'transactions','whereCondition': 'fromm=? and id=?','values': [from, id]}});

    // Delete from ledger table using both from and id
    await deleted({ body: {'tableName': 'ledger','whereCondition': 'fromm=? and id=?','values': [from, id]}});

    return { success: true, message: 'Records deleted successfully' };
  } catch (error) {
    console.error('Error in accountsDelete:', error);
    return { success: false, message: 'Failed to delete records', error: error.message };
  }
}

async function cdAccounts(header, footer, way, date, accountName, amount, source, from, id, suspense = 0, ref = "", description, destination, credit, cash=0, bank=0, bankname="nd", transactiontype="nd") {
  // Validation
  if (amount <= 0 || isNaN(amount)) {
    throw new Error("Amount must be a positive number.");
  }

  if (isNaN(Date.parse(date))) {
    throw new Error("Date must be a valid date format.");
  }

  if (header == null || way == null || accountName == null || source == null || from == null || id == null) {
    throw new Error("header, way, accountName, source, from, and id cannot be null or undefined.");
  }

  if (suspense !== 0 && suspense !== 1) {
    throw new Error("Suspense must be either 0 or 1.");
  }

  const transactionid = await insert({body: {tableName: 'transactions',data: {type: way,date,fromm: from,id,description,amount,reference: ref,entity_id:accountName,suspense, credit, cash, bank, bankname, transactiontype}, column:"transactionid"}});

  switch (way.toLowerCase()) {
    case "payment":
      await insert({body: {tableName: 'ledger',data: {type: way,date,account_id: header,fromm: from,id,transaction_id:transactionid.lastInsertId,debit: amount,bookkeeping:destination,entity_id:accountName,suspense}}});
      await insert({body: {tableName: 'ledger',data: {type: way,date,account_id: footer,fromm: from,id,transaction_id:transactionid.lastInsertId,credit: amount,bookkeeping:source,entity_id:accountName,suspense}}});
      break;

    case "receipt":
      await insert({body: {tableName: 'ledger',data: {type: way,date,account_id: footer,fromm: from,id,transaction_id:transactionid.lastInsertId,debit: amount,bookkeeping:source,entity_id:accountName,suspense}}});
      await insert({body: {tableName: 'ledger',data: {type: way,date,account_id: header,fromm: from,id,transaction_id:transactionid.lastInsertId,credit: amount,bookkeeping:destination,entity_id:accountName,suspense}}});
      break;

    case "payable":
      await insert({body: {tableName: 'ledger',data: {type: way,date,account_id: footer,fromm: from,id,transaction_id:transactionid.lastInsertId,debit: amount,bookkeeping:source,entity_id:accountName,suspense}}});
      await insert({body: {tableName: 'ledger',data: {type: way,date,account_id: header,fromm: from,id,transaction_id:transactionid.lastInsertId,credit: amount,bookkeeping:destination,entity_id:accountName,suspense}}});
      break;

    case "receivable":
      await insert({body: {tableName: 'ledger',data: {type: way,date,account_id: header,fromm: from,id,transaction_id:transactionid.lastInsertId,debit: amount,bookkeeping:destination,entity_id:accountName,suspense}}});
      await insert({body: {tableName: 'ledger',data: {type: way,date,account_id: footer,fromm: from,id,transaction_id:transactionid.lastInsertId,credit: amount,bookkeeping:source,entity_id:accountName,suspense}}});
      break;

    default:
      throw new Error("Invalid transaction type");
  }
}


function FutureDate(startDate, daysToAdd) {
  // Convert the input date to a JavaScript Date object
  const date = new Date(startDate);

  // Check if the date is invalid
  if (isNaN(date.getTime())) {
    // If invalid, use today's date
    console.warn("Invalid start date provided, using today's date.");
    date.setTime(new Date().getTime());
  }

  // Add the specified number of days
  date.setDate(date.getDate() + daysToAdd);

  // Return the calculated future date in YYYY-MM-DD format
  return date.toISOString().split('T')[0];
}

function roundOff10(number) {
  // Get the last digit of the number
  const lastDigit = number % 10;

  // If the last digit is 5 or greater, round up to the next multiple of 10
  if (lastDigit >= 5) {
    return number + (10 - lastDigit);
  } else {
    // Otherwise, round down to the previous multiple of 10
    return number - lastDigit;
  }
}

async function newAccount(account, id) {
  try{
    let accounts = await selectQuery(`select * from entities where deleteon=? and branch=? and (ph1=? or ph2=?) limit 1`,['0000-00-00',userToken.site,id,id]);
    let account_entity = await selectQuery(`select * from entities where deleteon=? and branch=? and account_id=? and (ph1=? or ph2=?) limit 1`,['0000-00-00',userToken.site,account,id,id]);
    if(!account_entity[0] && accounts[0])
    {
      const update = await insert({body: {tableName:"entities", data: {userid:accounts[0].userid, account_id:account, name:accounts[0].name, alias:accounts[0].alias, entity_type:accounts[0].entity_type, doj:accounts[0].doj, ph1:accounts[0].ph1, ph2:accounts[0].ph2, address:accounts[0].address, gstin:accounts[0].gstin, pan:accounts[0].pan, profile:accounts[0].profile, proof:accounts[0].proof, state:accounts[0].state, district:accounts[0].district, pin:accounts[0].pin, cr:accounts[0].cr, dr:accounts[0].dr}, column:"id"}});
      account_entity = await selectQuery(`select * from entities where deleteon=? and branch=? and id=? limit 1`,['0000-00-00',userToken.site,update.lastInsertId]);
    }
    return account_entity;
  }
  catch(e)
  {
    console.log("error create new account : "+e);
  }
}

const methods = { FutureDate, roundOff10, generateOTP, dateTime, insert, insert_app, createTable, upload, fetchDataForTable, deleted, generateUniqueId, isAtLeast18YearsOld, selectQuery, getCurrentTime, rawDateFormat, generateImageTag, loadOptions, updateQuery, createPDF, createFont, generatePDF, capitalizeFirstLetters, caps, allCaps, numberToWords, formatNumberWithCommas, generateRandomNumber, getUniqueRandomNumbers, updateQry, cdAccounts, accountsDelete, valNum, DateAfterOneMonth, getCurrentDate, money, generateUniqueNumbers, rtrim, newAccount};

// Dynamically export all methods in the `methods` object
module.exports = methods;
