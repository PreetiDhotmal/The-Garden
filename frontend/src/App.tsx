import type { JSX } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router";
import { HomePage } from "@/presentation/routes/HomePage";
import { EnginePreviewPage } from "@/presentation/routes/EnginePreviewPage";
import { CharacterExperiencePage } from "@/presentation/routes/CharacterExperiencePage";
import { VerticalSlicePage } from "@/presentation/gameplay/routes/VerticalSlicePage";
import { GardenOfBeginningsPage } from "@/presentation/world/routes/GardenOfBeginningsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/engine-preview" element={<EnginePreviewPage />} />
          <Route path="/play" element={<CharacterExperiencePage />} />
          <Route path="/gameplay-demo" element={<VerticalSlicePage />} />
          <Route path="/garden" element={<GardenOfBeginningsPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
