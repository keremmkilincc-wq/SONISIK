const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow(){
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'SON IŞIK',
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });
  win.setMenu(null);
  win.loadFile(path.join(__dirname, '../index.html'));
  // win.webContents.openDevTools();
}
app.whenReady().then(createWindow);
app.on('window-all-closed', ()=> { if(process.platform!=='darwin') app.quit(); });
