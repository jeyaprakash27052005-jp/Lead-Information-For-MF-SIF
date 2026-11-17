// Desktop app (Windows laptop and Mac) for the Investment Business game.
const { app, BrowserWindow, shell, Menu, screen } = require("electron");
const path = require("path");

if (!app.requestSingleInstanceLock()) app.quit();

// Same address as LIVE in www/shared/mcube.js
const LIVE_HOST = "mf-nps-game.vercel.app";
const LOCAL = path.join(__dirname, "..", "www", "index.html");

function createWindow() {
  // Opens at a size that suits the screen; the game layout adapts to any window size.
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  const win = new BrowserWindow({
    width: Math.min(1360, Math.round(sw * 0.9)),
    height: Math.min(900, Math.round(sh * 0.9)),
    minWidth: 360,
    minHeight: 520,
    center: true,
    title: "Mcube Academy FinFun",
    backgroundColor: "#ffffff",
    icon: path.join(__dirname, "..", "resources", "icon.png"),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.loadFile(LOCAL);

  // Website links (mcubeacademy.com) open in the normal browser, not inside the game.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  // The games website (LIVE) opens inside the app, so the app always shows the latest version of the games.
  // Other website links (mcubeacademy.com) open in the normal browser.
  win.webContents.on("will-navigate", (e, url) => {
    if (/^https?:/.test(url) && new URL(url).host !== LIVE_HOST) { e.preventDefault(); shell.openExternal(url); }
  });
  // No internet while on the website: go back to the copy built into the app.
  win.webContents.on("did-fail-load", (_e, code, _desc, url, isMainFrame) => {
    if (isMainFrame && code !== -3 && /^https?:/.test(url)) win.loadFile(LOCAL, { query: { offline: "1" } });
  });
}

app.on("second-instance", () => {
  const w = BrowserWindow.getAllWindows()[0];
  if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
});
app.whenReady().then(() => {
  if (process.platform !== "darwin") Menu.setApplicationMenu(null);
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
