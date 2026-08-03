import { useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";

/**
 * Immersive fullscreen for gameplay - hides the Android status bar so
 * the WebGL canvas can use the full screen height, matching
 * "immersive fullscreen where practical." No-ops entirely on
 * web/desktop.
 */
export function useNativeStatusBar(): void {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {
      // Some Android versions/OEM skins reject style changes - not
      // fatal, the app still functions with the default style.
    });
    StatusBar.hide().catch(() => {
      // Same as above - non-fatal if unsupported.
    });
  }, []);
}
