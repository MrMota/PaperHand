// Tells the web app it is running inside the desktop shell. Exposes nothing else.
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('paperhandDesktop', { platform: process.platform });
