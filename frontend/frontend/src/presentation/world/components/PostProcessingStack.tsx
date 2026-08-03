import type { JSX } from "react";
import {
  Bloom,
  EffectComposer,
  HueSaturation,
  N8AO,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

export interface PostProcessingStackProps {
  readonly enableBloom?: boolean;
  readonly enableAO?: boolean;
  readonly enableVignette?: boolean;
}

/**
 * Mount once per Canvas. `N8AO` provides modern, performant ambient
 * occlusion (the SSAO requirement) — chosen over the library's older
 * `SSAO` effect for better quality-per-cost. Tone mapping here is
 * ACES Filmic to match the renderer-level setting already configured
 * in GameCanvas (Milestone 2), keeping the two consistent rather than
 * fighting each other. HueSaturation stands in for "color grading" —
 * a full LUT-based grade needs an actual authored LUT texture, which
 * wasn't provided; this is documented as a known limitation.
 */
export function PostProcessingStack({
  enableBloom = true,
  enableAO = true,
  enableVignette = true,
}: PostProcessingStackProps) {
  const effects: (JSX.Element | false)[] = [
    enableAO && <N8AO key="ao" aoRadius={2} intensity={1.2} distanceFalloff={1} />,
    enableBloom && (
      <Bloom
        key="bloom"
        mipmapBlur
        luminanceThreshold={0.92}
        luminanceSmoothing={0.2}
        intensity={0.35}
      />
    ),
    <ToneMapping key="tonemap" mode={ToneMappingMode.ACES_FILMIC} />,
    <HueSaturation key="grade" saturation={0.08} />,
    enableVignette && <Vignette key="vignette" eskil={false} offset={0.15} darkness={0.6} />,
  ];
  const activeEffects = effects.filter((effect): effect is JSX.Element => effect !== false);

  return (
    <EffectComposer enableNormalPass multisampling={4}>
      {activeEffects}
    </EffectComposer>
  );
}
