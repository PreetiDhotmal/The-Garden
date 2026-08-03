import { useEffect, useMemo, useState } from "react";
import { Text } from "@react-three/drei";
import { formatReference } from "@/domain/gameplay/scripture/ScriptureFormatter";
import {
  createFlowerGeometry,
  createGrassBladeGeometry,
} from "@/infrastructure/world/vegetation/ProceduralVegetationGeometry";
import { mulberry32 } from "@/infrastructure/world/vegetation/VegetationScattering";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import type { ScriptureReference } from "@the-garden/shared-types";

export interface ScriptureWallProps {
  readonly chapterId: string;
  readonly chapterTitle: string;
  /** A short symbol shown at the wall's top center once completed - a plain glyph, not an image asset. */
  readonly chapterIcon?: string;
  readonly verseReference: ScriptureReference;
  /** Local fallback text, used if the YouVersion request fails or is still loading - never fabricated as if it came from the API. */
  readonly fallbackVerseText: string;
  readonly reflection: string;
  readonly isCompleted: boolean;
  readonly position: readonly [number, number, number];
  readonly rotationY: number;
  readonly scale?: number;
}

/**
 * A reusable environmental Scripture Wall - one component for every
 * chapter, not a bespoke wall per chapter. Two visual states driven
 * entirely by isCompleted: LOCKED (muted stone, a lock glyph, no
 * verse text, a "complete this chapter" message) and COMPLETED (warm
 * lit lanterns, vibrant vines/flowers, chapter icon, the real verse -
 * fetched live from the existing YouVersion-backed scriptureRepository
 * when available, falling back to fixed local text on failure without
 * ever blocking or crashing).
 */
export function ScriptureWall({
  chapterTitle,
  chapterIcon = "✦",
  verseReference,
  fallbackVerseText,
  reflection,
  isCompleted,
  position,
  rotationY,
  scale = 1,
}: ScriptureWallProps) {
  const { scriptureRepository } = useGameplay();
  const [fetchedVerseText, setFetchedVerseText] = useState<string | null>(null);

  useEffect(() => {
    if (!isCompleted) {
      return;
    }
    let cancelled = false;
    scriptureRepository
      .getVerse(verseReference)
      .then((verse) => {
        if (!cancelled) {
          setFetchedVerseText(verse.text);
        }
      })
      .catch((error: unknown) => {
        // Graceful fallback, per requirement: never crash, never block
        // the wall from displaying, log a warning (not a blocking
        // error) and fall back to the fixed local verse text below.
        console.warn(
          `[ScriptureWall] Live verse fetch failed for ${formatReference(verseReference)} - using local fallback text.`,
          error
        );
      });
    return () => {
      cancelled = true;
    };
  }, [isCompleted, scriptureRepository, verseReference]);

  const leafGeometry = useMemo(() => createFlowerGeometry(), []);
  const grassGeometry = useMemo(() => createGrassBladeGeometry(), []);

  const leafPositions = useMemo(() => {
    const random = mulberry32(17);
    return Array.from({ length: 14 }, () => ({
      x: (random() - 0.5) * 2.6,
      y: 0.3 + random() * 2.2,
      z: 0.16 + random() * 0.1,
      rotationZ: random() * Math.PI * 2,
      scale: 0.6 + random() * 0.8,
    }));
  }, []);

  const basePlantPositions = useMemo(() => {
    const random = mulberry32(31);
    return Array.from({ length: 10 }, () => ({
      x: (random() - 0.5) * 3.4,
      z: 0.3 + random() * 0.5,
      rotationY: random() * Math.PI * 2,
      scale: 0.5 + random() * 0.6,
      isFlower: random() > 0.55,
    }));
  }, []);

  const referenceLabel = formatReference(verseReference);
  const verseText = fetchedVerseText ?? fallbackVerseText;

  // Locked: muted stone, no growth, no light, no verse - just enough
  // to signal "there is something here, not yet earned."
  const stoneColor = isCompleted ? "#8a7f6c" : "#4a463f";
  const vineColor = isCompleted ? "#4f9a45" : "#3a3f34";
  const lanternGlow = isCompleted ? "#f0c96a" : "#000000";
  const lanternIntensity = isCompleted ? 1.4 : 0;

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {/* Wall body - aged stone/plaster panel */}
      <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 2.3, 0.28]} />
        <meshStandardMaterial color={stoneColor} roughness={0.92} />
      </mesh>

      {/* Plaque */}
      <mesh position={[0, 1.35, 0.16]}>
        <boxGeometry args={[2.5, 1.7, 0.05]} />
        <meshStandardMaterial
          color={isCompleted ? "#efe6d0" : "#3a3730"}
          roughness={0.7}
          emissive={isCompleted ? "#efe6d0" : "#000000"}
          emissiveIntensity={isCompleted ? 0.08 : 0}
        />
      </mesh>

      {isCompleted ? (
        <>
          <Text position={[0, 2.05, 0.2]} fontSize={0.22} color="#e8c840" anchorX="center" anchorY="middle">
            {chapterIcon}
          </Text>
          <Text
            position={[0, 1.72, 0.2]}
            fontSize={0.15}
            color="#3a3327"
            anchorX="center"
            anchorY="middle"
          >
            {chapterTitle}
          </Text>
          <Text
            position={[0, 1.4, 0.2]}
            fontSize={0.115}
            maxWidth={2.1}
            textAlign="center"
            color="#2a251c"
            anchorX="center"
            anchorY="middle"
          >
            {verseText}
          </Text>
          <Text
            position={[0, 0.95, 0.2]}
            fontSize={0.1}
            color="#8a6a2a"
            anchorX="center"
            anchorY="middle"
          >
            {referenceLabel}
          </Text>
          <Text
            position={[0, 0.68, 0.2]}
            fontSize={0.09}
            maxWidth={2.1}
            textAlign="center"
            color="#4f4638"
            anchorX="center"
            anchorY="middle"
          >
            {reflection}
          </Text>
        </>
      ) : (
        <>
          <Text position={[0, 1.72, 0.2]} fontSize={0.28} color="#6a6458" anchorX="center" anchorY="middle">
            🔒
          </Text>
          <Text
            position={[0, 1.3, 0.2]}
            fontSize={0.13}
            maxWidth={2.1}
            textAlign="center"
            color="#7a7468"
            anchorX="center"
            anchorY="middle"
          >
            {`Complete the ${chapterTitle} chapter to reveal this Scripture.`}
          </Text>
        </>
      )}

      {/* Lanterns, one each side */}
      {[-1.7, 1.7].map((lanternX) => (
        <group key={lanternX.toString()} position={[lanternX, 1.6, 0.25]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.22, 6]} />
            <meshStandardMaterial
              color="#3a3428"
              emissive={lanternGlow}
              emissiveIntensity={isCompleted ? 0.6 : 0}
              roughness={0.6}
            />
          </mesh>
          <pointLight color={lanternGlow} intensity={lanternIntensity} distance={4} />
        </group>
      ))}

      {/* Vines / leaves growing across the face - vibrant when completed, dark and sparse when locked */}
      {leafPositions.map((leaf, index) => (
        <mesh
          key={index.toString()}
          geometry={leafGeometry}
          position={[leaf.x, leaf.y, leaf.z]}
          rotation={[Math.PI / 2, 0, leaf.rotationZ]}
          scale={isCompleted ? leaf.scale : leaf.scale * 0.6}
          visible={isCompleted || index % 3 === 0}
        >
          <meshStandardMaterial color={vineColor} roughness={0.85} />
        </mesh>
      ))}

      {/* Moss / small plants at the base */}
      {isCompleted &&
        basePlantPositions.map((plant, index) => (
          <mesh
            key={`base-${index.toString()}`}
            geometry={plant.isFlower ? leafGeometry : grassGeometry}
            position={[plant.x, 0, plant.z]}
            rotation={[0, plant.rotationY, 0]}
            scale={plant.scale}
            castShadow={false}
          >
            <meshStandardMaterial
              color={plant.isFlower ? "#d888c0" : "#4f7a45"}
              roughness={0.85}
            />
          </mesh>
        ))}
    </group>
  );
}
