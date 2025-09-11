const express = require("express");
const backendController = require('../../controllers/backend-functions');
const htmls = require('../../helpers');
const { body } = require("express-validator");
const router = express.Router();
const { jsPDF } = require("jspdf");
const mysql = require('mysql2/promise');    
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require("jspdf-autotable");

router.post('/copyTable', async (req, res) => {
    const dbName = 'powerbase'; // Change to your source DB
    const backupDbName = `${dbName}_backup`; // You can also add timestamps if needed

    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '', // Replace with your actual password
            multipleStatements: true
        });

        // Step 1: Create the backup database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${backupDbName}\`;`);

        // Step 2: Get the list of tables from the original database
        const [tables] = await connection.query(`SHOW TABLES FROM \`${dbName}\`;`);
        const tableKey = `Tables_in_${dbName}`;

        // Step 3: Copy each table with structure and data
        for (const row of tables) {
            const tableName = row[tableKey];
            // Drop the table in backup if it exists (optional)
            // await connection.query(`DROP TABLE IF EXISTS \`${backupDbName}\`.\`${tableName}\`;`);
            // Recreate the table with data
            await connection.query(`
                CREATE TABLE \`${backupDbName}\`.\`${tableName}\`
                SELECT * FROM \`${dbName}\`.\`${tableName}\`;
            `);
        }

        // Success response
        return res.json({
            success: true,
            msg_type: "success",
            msg: "Database copied successfully."
        });

    } catch (error) {
        console.error(error);
        // Error response
        return res.json({
            success: false,
            msg_type: "error",
            msg: error.message || "An error occurred while copying the database."
        });
    }
});

// Absolute path to the dump folder
const dumpFolder = path.join(__dirname, 'dump');
console.log(dumpFolder)
router.get('/showDb', async (req, res) => {
    try {
        // Read all files in the folder
        fs.readdir(dumpFolder, (err, files) => {
            if (err) {
                console.error('Error reading folder:', err);
                return res.status(500).json({
                    success: false,
                    msg_type: 'error',
                    msg: 'Unable to read dump folder'
                });
            }
            // Return file names as JSON
            // res.json({
            //     success: true,
            //     files: files
            // });
            // console.log(files[1]);
            // res.download(files[1], files[1]);
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({
            success: false,
            msg_type: 'error',
            msg: error.message
        });
    }
});

// Route to download a specific file
router.get('/dump/:filename', (req, res) => {
    const fileName = req.params.filename;
    const filePath = path.join(dumpFolder, fileName);

    if (!fileName.endsWith('.sql')) {
        return res.status(400).json({
            success: false,
            msg: 'Invalid file type'
        });
    }

    if (fs.existsSync(filePath)) {
        res.download(filePath, fileName);
    } else {
        res.status(404).json({
            success: false,
            msg: 'File not found'
        });
    }
});

router.get('/downloadTable', async (req, res) => {
    const dbName = 'powerbase';
    const dumpFile = path.join(__dirname, `\\dump\\${dbName}_backup.sql`);
    console.log(dumpFile);
    // 🔧 Use full path to mysqldump
    const dumpCommand = `"C:\\xampp\\mysql\\bin\\mysqldump.exe" -u root --password= ${dbName} > "${dumpFile}"`;

    try {
        exec(dumpCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Dump error: ${error.message}`);
                return res.json({
                    success: false,
                    msg_type: "error",
                    msg: "Database dump failed: " + error.message
                });
            }
            return res.json({
                success: true,
                msg_type: "success",
                msg: "Click below to Download the Table"
            });
            // Delay to ensure the dump file is written before sending
            // setTimeout(() => {
            //     res.download(dumpFile, `${dbName}_backup.sql`, (err) => {
            //         if (err) {
            //             console.error(`Download error: ${err.message}`);
            //             return res.json({
            //                 success: false,
            //                 msg_type: "error",
            //                 msg: "Download failed: " + err.message
            //             });
            //         }

                    // Cleanup after download
                    // fs.unlink(dumpFile, (unlinkErr) => {
                    //     if (unlinkErr) console.error('Cleanup error:', unlinkErr);
                    // });
            //     });
            // }, 1000); // Small delay to avoid race condition
        });
    } catch (error) {
        console.error(error);
        return res.json({
            success: false,
            msg_type: "error",
            msg: error.message || "An unexpected error occurred."
        });
    }
});

module.exports = router;