import { useFrame, useThree } from "@react-three/fiber";
import type { PerspectiveCamera } from "three";

export interface SplitScreenRendererProps {
  readonly cameraOne: PerspectiveCamera;
  readonly cameraTwo: PerspectiveCamera;
  /** "vertical" = side-by-side (left/right), "horizontal" = stacked (top/bottom). Vertical matches most co-op games' convention. */
  readonly orientation?: "vertical" | "horizontal";
}

/**
 * Takes over R3F's automatic per-frame render (useFrame's priority
 * argument > 0 disables it) and renders the shared scene twice —
 * once per player's camera, each scissored to its own half of the
 * canvas. Both cameras see the SAME scene graph and the SAME Physics
 * world, which is the whole point: co-op puzzles need both players'
 * state to be mutually visible and physically real to each other,
 * not two independent copies of the world.
 */
export function SplitScreenRenderer({
  cameraOne,
  cameraTwo,
  orientation = "vertical",
}: SplitScreenRendererProps) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const size = useThree((state) => state.size);

  useFrame(() => {
    const { width, height } = size;
    const pixelRatio = gl.getPixelRatio();
    const pixelWidth = width * pixelRatio;
    const pixelHeight = height * pixelRatio;

    gl.setScissorTest(true);

    if (orientation === "vertical") {
      const halfWidth = width / 2;
      cameraOne.aspect = halfWidth / height;
      cameraOne.updateProjectionMatrix();
      cameraTwo.aspect = halfWidth / height;
      cameraTwo.updateProjectionMatrix();

      const halfPixelWidth = pixelWidth / 2;
      gl.setViewport(0, 0, halfPixelWidth, pixelHeight);
      gl.setScissor(0, 0, halfPixelWidth, pixelHeight);
      gl.render(scene, cameraOne);

      gl.setViewport(halfPixelWidth, 0, halfPixelWidth, pixelHeight);
      gl.setScissor(halfPixelWidth, 0, halfPixelWidth, pixelHeight);
      gl.render(scene, cameraTwo);
    } else {
      const halfHeight = height / 2;
      cameraOne.aspect = width / halfHeight;
      cameraOne.updateProjectionMatrix();
      cameraTwo.aspect = width / halfHeight;
      cameraTwo.updateProjectionMatrix();

      const halfPixelHeight = pixelHeight / 2;
      gl.setViewport(0, halfPixelHeight, pixelWidth, halfPixelHeight);
      gl.setScissor(0, halfPixelHeight, pixelWidth, halfPixelHeight);
      gl.render(scene, cameraOne);

      gl.setViewport(0, 0, pixelWidth, halfPixelHeight);
      gl.setScissor(0, 0, pixelWidth, halfPixelHeight);
      gl.render(scene, cameraTwo);
    }

    gl.setScissorTest(false);
  }, 1);

  return null;
}
