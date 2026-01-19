import { app, BrowserWindow, protocol, session, net } from 'electron';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

// Basic safety for squirrel
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

// Register protocol as privileged
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true } }
]);

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Try multiple paths to find splash.html
  const possiblePaths = [
    path.join(__dirname, 'splash.html'),
    path.join(app.getAppPath(), 'src/splash.html'),
    path.join(app.getAppPath(), '.webpack/renderer/main_window/splash.html'), // Forge specific
  ];

  let splashFound = false;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      splashWindow.loadFile(p);
      splashFound = true;
      break;
    }
  }

  if (!splashFound) {
    console.warn('Splash screen not found in expected locations, loading simple placeholder');
    splashWindow.loadURL('data:text/html;charset=utf-8,' + encodeURI(`
      <body style="background:#000;color:#fff;display:flex;justify:center;align-items:center;height:100vh;margin:0;font-family:sans-serif;">
        <div style="text-align:center;">
          <h2 style="margin:0;color:#3b82f6;">QuantumFlow</h2>
          <p style="opacity:0.5;font-size:12px;">Initializing Simulator...</p>
        </div>
      </body>
    `));
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false, // Don't show until ready
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Icon handling
  const iconPaths = [
    path.join(app.getAppPath(), 'icon.ico'),
    path.join(app.getAppPath(), 'icon.png'),
    path.join(process.resourcesPath, 'icon.ico'),
    path.join(__dirname, '../icon.ico'),
  ];

  for (const ip of iconPaths) {
    if (fs.existsSync(ip)) {
      mainWindow.setIcon(ip);
      break;
    }
  }

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL('app://quantumflow/index.html');

  // When main window is ready to show
  mainWindow.once('ready-to-show', () => {
    // Artificial minimum delay for splash if needed, but video provides natural delay
    setTimeout(() => {
      if (splashWindow) {
        splashWindow.close();
        splashWindow = null;
      }
      mainWindow?.show();
      mainWindow?.maximize();
    }, 500);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Protocol handler: translates app://quantum/file to a local path
  session.defaultSession.protocol.handle('app', (request) => {
    const url = new URL(request.url);
    let relativePath = url.pathname;

    // Normalize path
    if (relativePath.startsWith('/')) relativePath = relativePath.slice(1);
    if (!relativePath || relativePath === '') relativePath = 'index.html';

    // Potential locations for the 'out' folder
    const baseDirs = [
      path.join(process.resourcesPath, 'out'),
      path.join(app.getAppPath(), 'out'),
      path.join(__dirname, '../../out'), // Dev mode
      path.join(__dirname, '../../../out'), // Alternative dev
    ];

    for (const base of baseDirs) {
      const fullPath = path.join(base, relativePath);

      // 1. Try exact path
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        return net.fetch(pathToFileURL(fullPath).toString());
      }

      // 2. Try appending .html (Next.js clean URLs)
      const htmlPath = fullPath + '.html';
      if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
        return net.fetch(pathToFileURL(htmlPath).toString());
      }

      // 3. Try /index.html
      const indexPath = path.join(fullPath, 'index.html');
      if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
        return net.fetch(pathToFileURL(indexPath).toString());
      }
    }

    return new Response('Not Found', { status: 404 });
  });

  createSplashWindow();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
