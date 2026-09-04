import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow(){
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'SON IŞIK',
    webPreferences: { nodeIntegration: false, contextIsolation: true, webSecurity: false }
  });
  win.setMenu(null);
  win.loadFile(path.join(__dirname, '../index.html'));
}
app.whenReady().then(createWindow);
app.on('window-all-closed', ()=> { if(process.platform!=='darwin') app.quit(); });
app.on('render-process-gone', ()=> app.quit());
