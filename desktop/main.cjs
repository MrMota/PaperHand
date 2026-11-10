// Paperhand desktop: the same web app, packaged with Electron. No server, no Node access in the page.
const { app, BrowserWindow, Menu, net, protocol, session, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const WEB_ROOT = path.join(__dirname, 'web');
const ORIGIN = 'app://paperhand';

// A private, secure scheme so storage (IndexedDB), workers and WebAssembly behave exactly as on the web.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true, codeCache: true } },
]);

if (!app.requestSingleInstanceLock()) app.quit();

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'Paperhand',
    backgroundColor: '#F3F2EF',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false, // Electron's spellchecker downloads dictionaries from Google; Paperhand makes no such requests
    },
  });
  win.once('ready-to-show', () => win.show());

  // Links to websites open in the user's browser; the app window only ever shows the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith(`${ORIGIN}/`)) return;
    event.preventDefault();
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
  });

  win.loadURL(`${ORIGIN}/index.html`);
}

function buildMenu() {
  const template = [
    { label: 'File', submenu: [{ role: 'quit' }] },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'View', submenu: [{ role: 'reload' }, { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }, { role: 'toggleDevTools' }] },
    { label: 'Help', submenu: [{ label: 'Report a problem', click: () => shell.openExternal('https://github.com/MrMota/PaperHand/issues') }] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on('second-instance', () => {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.focus();
});

app.whenReady().then(() => {
  session.defaultSession.setSpellCheckerEnabled(false);
  // Automated tests only: save downloads to a folder instead of showing the Save dialog.
  const testDownloads = process.env.PAPERHAND_TEST_DOWNLOAD_DIR;
  if (testDownloads) session.defaultSession.on('will-download', (_e, item) => item.setSavePath(path.join(testDownloads, item.getFilename())));
  protocol.handle('app', (request) => {
    const { host, pathname } = new URL(request.url);
    if (host !== 'paperhand') return new Response('Not found', { status: 404 });
    const rel = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.normalize(path.join(WEB_ROOT, rel));
    if (file !== WEB_ROOT && !file.startsWith(WEB_ROOT + path.sep)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
  buildMenu();
  createWindow();
});

app.on('window-all-closed', () => app.quit());
