import { useEffect, type JSX } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router";
import { HomePage } from "@/presentation/routes/HomePage";
import { GameRoot } from "@/presentation/game/GameRoot";
import { EnginePreviewPage } from "@/presentation/routes/EnginePreviewPage";
import { CharacterExperiencePage } from "@/presentation/routes/CharacterExperiencePage";
import { VerticalSlicePage } from "@/presentation/gameplay/routes/VerticalSlicePage";
import { GardenOfBeginningsPage } from "@/presentation/world/routes/GardenOfBeginningsPage";
import { WildernessPage } from "@/presentation/world/routes/WildernessPage";
import { CoopSplitScreenPage } from "@/presentation/world/routes/CoopSplitScreenPage";
import { HubGardenPage } from "@/presentation/hub/routes/HubGardenPage";
import { CommunicationLevelPage } from "@/presentation/levels/communication/routes/CommunicationLevelPage";
import { TrustLevelPage } from "@/presentation/levels/trust/routes/TrustLevelPage";
import { useSettingsStore } from "@/presentation/settings/settingsStore";
import { GlobalMusicController } from "@/presentation/audio/GlobalMusicController";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * SVG filters approximating each colorblind mode via a standard
 * daltonization color matrix — applied to the whole app root via
 * CSS `filter`, not a redesign of every color choice throughout the
 * UI (which would need real design review, out of scope here).
 */
const COLORBLIND_FILTER_SVG = (
  <svg aria-hidden="true" className="absolute h-0 w-0">
    <defs>
      <filter id="colorblind-deuteranopia">
        <feColorMatrix
          type="matrix"
          values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0"
        />
      </filter>
      <filter id="colorblind-protanopia">
        <feColorMatrix
          type="matrix"
          values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0"
        />
      </filter>
      <filter id="colorblind-tritanopia">
        <feColorMatrix
          type="matrix"
          values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0"
        />
      </filter>
    </defs>
  </svg>
);

function AccessibilityRoot({ children }: { readonly children: JSX.Element }): JSX.Element {
  const largeTextMode = useSettingsStore((state) => state.largeTextMode);
  const colorblindMode = useSettingsStore((state) => state.colorblindMode);

  useEffect(() => {
    // Tailwind's rem-based utility classes (the vast majority of text
    // sizing throughout this app, including the Journal) resolve
    // against the <html> element's font-size specifically — a
    // wrapping div's font-size has zero effect on them, which is why
    // this needs to touch document.documentElement directly rather
    // than styling this component's own root element.
    document.documentElement.style.fontSize = largeTextMode ? "125%" : "";
  }, [largeTextMode]);

  return (
    <div
      className="h-full w-full"
      style={{
        filter: colorblindMode !== "none" ? `url(#colorblind-${colorblindMode})` : undefined,
      }}
    >
      {COLORBLIND_FILTER_SVG}
      {children}
    </div>
  );
}

export function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalMusicController />
      <AccessibilityRoot>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<GameRoot />} />
            <Route path="/status" element={<HomePage />} />
            <Route path="/engine-preview" element={<EnginePreviewPage />} />
            <Route path="/play" element={<CharacterExperiencePage />} />
            <Route path="/gameplay-demo" element={<VerticalSlicePage />} />
            <Route path="/garden" element={<GardenOfBeginningsPage />} />
            <Route path="/wilderness" element={<WildernessPage />} />
            <Route path="/coop-test" element={<CoopSplitScreenPage />} />
            <Route path="/hub" element={<HubGardenPage />} />
            <Route path="/level/communication" element={<CommunicationLevelPage />} />
            <Route path="/level/trust" element={<TrustLevelPage />} />
          </Routes>
        </BrowserRouter>
      </AccessibilityRoot>
    </QueryClientProvider>
  );
}
