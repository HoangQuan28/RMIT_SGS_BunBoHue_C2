const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;
const PORT = 3000;

function waitForServer(callback, maxRetries = 40) {
  let retries = 0;
  const check = () => {
    http.get(`http://localhost:${PORT}`, (res) => {
      callback();
    }).on('error', () => {
      retries++;
      if (retries < maxRetries) {
        setTimeout(check, 500);
      } else {
        // If server hasn't answered yet, proceed to load
        callback();
      }
    });
  };
  check();
}

function startBackendServer() {
  // Check if standalone server.js exists
  const standaloneServer = path.join(__dirname, '..', '.next', 'standalone', 'server.js');
  const normalServer = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next');

  try {
    const fs = require('fs');
    if (fs.existsSync(standaloneServer)) {
      serverProcess = spawn(process.execPath, [standaloneServer], {
        env: { ...process.env, PORT: `${PORT}`, NODE_ENV: 'production' },
        cwd: path.join(__dirname, '..', '.next', 'standalone'),
      });
    } else {
      serverProcess = spawn(process.execPath, [normalServer, 'start', '-p', `${PORT}`], {
        env: { ...process.env, PORT: `${PORT}`, NODE_ENV: 'production' },
        cwd: path.join(__dirname, '..'),
      });
    }

    serverProcess.stdout.on('data', (d) => console.log(`[Next.js] ${d}`));
    serverProcess.stderr.on('data', (d) => console.error(`[Next.js ERR] ${d}`));
  } catch (err) {
    console.error('Failed to spawn Next.js process:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 980,
    minHeight: 640,
    title: 'UniSign Forum',
    backgroundColor: '#faf8f5',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  waitForServer(() => {
    mainWindow.loadURL(`http://localhost:${PORT}`);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://localhost') || url.startsWith('https://')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // First check if port 3000 is already running
  http.get(`http://localhost:${PORT}`, () => {
    // Port 3000 is already live, launch UI directly
    createWindow();
  }).on('error', () => {
    // Port 3000 not responding, spawn Next.js
    startBackendServer();
    createWindow();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
