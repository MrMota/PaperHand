import { isNative } from './native';

/**
 * Save a file the user asked for. In a browser: a normal download. In the Android/iOS app the WebView
 * ignores downloads, so the file is written to the app's cache and handed to the system share sheet
 * (Save to Files, Drive, Photos, send to another app...).
 */
export async function saveBlob(blob: Blob, name: string) {
  if (isNative()) return nativeSave(blob, name);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function saveDataURL(dataURL: string, name: string) {
  return saveBlob(await (await fetch(dataURL)).blob(), name);
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] ?? ''); r.onerror = rej; r.readAsDataURL(blob); });
}

async function nativeSave(blob: Blob, name: string) {
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
  const path = `exports/${Date.now()}-${name}`;
  const { uri } = await Filesystem.writeFile({ path, data: await blobToBase64(blob), directory: Directory.Cache, recursive: true });
  try {
    await Share.share({ title: name, files: [uri], dialogTitle: `Save or send ${name}` });
  } catch (e: any) {
    if (!/cancel/i.test(String(e?.message ?? e))) throw e; // closing the share sheet is not an error
  }
}
