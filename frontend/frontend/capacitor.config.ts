import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.preetidhotmal.thegarden",
  appName: "The Garden",
  // Points at Vite's actual production output directory (see
  // vite.config.ts's build.outDir) - Capacitor packages this folder's
  // contents into the Android app as local web assets served over the
  // capacitor:// scheme, not a live dev server, for release builds.
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  android: {
    // Real WebGL/Three.js content needs hardware-accelerated
    // rendering; Capacitor's default AndroidManifest template already
    // sets hardwareAccelerated="true" on the activity, verified after
    // `cap add android` below - not overridden here.
    allowMixedContent: false,
  },
};

export default config;
