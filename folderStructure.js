const fs = require('fs');
const path = require('path');
const backendCntrollers = require('./controllers/backend-functions');
  
// Function to recursively read directories and files
const getFolderStructure = (dirPath) => {
  let result = [];
  try {
    const filesAndFolders = fs.readdirSync(dirPath, { withFileTypes: true });
    filesAndFolders.forEach((entry) => {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        result.push({
          type: 'folder',
          name: entry.name,
          children: getFolderStructure(fullPath),
        });
      } else {
        result.push({
          type: 'file',
          name: entry.name,
          path: fullPath,
        });
        // backendCntrollers.insert({body : {tableName:"all_pages", data : {route : entry.name}}});
      }
    });
  } catch (error) {
    console.error(`Error reading directory: ${dirPath}`, error);
  }
  return result;
};

module.exports = { getFolderStructure };
