/** True inside the Android/iOS app shell (Capacitor), false in a browser. */
export const isNative = () => !!(window as any).Capacitor?.isNativePlatform?.();
