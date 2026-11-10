/** True inside the Android/iOS app shell (Capacitor), false in a browser. */
export const isNative = () => !!(window as any).Capacitor?.isNativePlatform?.();

/** True inside the desktop app (Electron); the preload script sets this. */
export const isDesktop = () => !!(window as any).paperhandDesktop;
