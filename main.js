// main.js

const { app, BrowserWindow } = require('electron');
const path = require('path');
const { exec } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load your frontend here (localhost OR local file)
  win.loadURL('http://localhost:5000'); // Or use win.loadFile('index.html');
}

// Start your Node backend before the window opens
app.whenReady().then(() => {
  // Start Node backend (e.g. Express or your server.js)
  exec('node app.js', (err, stdout, stderr) => {
    if (err) {
      console.error('Failed to start backend:', err);
      return;
    }
    console.log('Backend started:\n', stdout);
  });

  createWindow();
});
