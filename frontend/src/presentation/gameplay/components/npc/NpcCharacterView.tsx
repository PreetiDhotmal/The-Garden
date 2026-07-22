import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AnimationRole } from "@/domain/character/animation/AnimationRole";
import type { CharacterAnimationConfig } from "@/domain/character/animation/CharacterAnimationConfig";
import type { NpcDefinition } from "@/domain/gameplay/npc/NpcDefinition";
import { CharacterAnimationController } from "@/infrastructure/character/CharacterAnimationController";
import { cloneCharacterScene } from "@/infrastructure/character/CharacterModelLoader";
import { useCharacterAssets } from "@/presentation/character/hooks/useCharacterAssets";
import { createGirlAnimationConfig } from "@/infrastructure/character/defaultAnimationConfigs";
import { CHARACTER_MODEL_ASSET_IDS } from "@/presentation/character/characterModelAssets";
import { InteractableObject } from "@/presentation/gameplay/components/InteractableObject";

export interface NpcCharacterViewProps {
  readonly definition: NpcDefinition;
  readonly isTalking: boolean;
  readonly onInteract: () => void;
}

/**
 * No dedicated NPC art exists — this reuses the "girl" model
 * (Milestone 3) for every NPC, distinct from the player's "boy"
 * model, rather than inventing a new asset pipeline this milestone
 * doesn't call for. Swapping in real per-NPC models later only
 * requires changing this one mapping.
 */
function resolveRoleAnimation(role: string): AnimationRole {
  return role in AnimationRole ? (role as AnimationRole) : AnimationRole.IDLE;
}

export function NpcCharacterView({ definition, isTalking, onInteract }: NpcCharacterViewProps) {
  const { data } = useCharacterAssets(CHARACTER_MODEL_ASSET_IDS.GIRL);
  const controllerRef = useRef<CharacterAnimationController | null>(null);

  const clonedScene = useMemo(() => (data ? cloneCharacterScene(data.gltf.scene) : null), [data]);

  const animationConfig: CharacterAnimationConfig | null = useMemo(() => {
    if (!data) {
      return null;
    }
    return createGirlAnimationConfig(data.clipRegistry);
  }, [data]);

  useEffect(() => {
    if (!clonedScene || !animationConfig || !data) {
      return;
    }
    const controller = new CharacterAnimationController(
      clonedScene,
      data.gltf.animations,
      animationConfig
    );
    controllerRef.current = controller;
    controller.playRole(resolveRoleAnimation(definition.idleAnimationRole));
    return () => {
      controller.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clonedScene, animationConfig, data]);

  useEffect(() => {
    controllerRef.current?.playRole(
      resolveRoleAnimation(isTalking ? definition.talkAnimationRole : definition.idleAnimationRole)
    );
  }, [isTalking, definition.talkAnimationRole, definition.idleAnimationRole]);

  useFrame((_, delta) => {
    controllerRef.current?.update(delta);
  });

  const position: readonly [number, number, number] = [
    definition.spawnPosition.x,
    definition.spawnPosition.y,
    definition.spawnPosition.z,
  ];

  return (
    <>
      {clonedScene && (
        <group position={position}>
          <primitive object={clonedScene} />
        </group>
      )}
      <InteractableObject
        id={definition.id}
        position={position}
        promptText={`Talk to ${definition.name}`}
        radius={definition.interactionRadius}
        color="#8a6fd8"
        onInteract={onInteract}
      />
    </>
  );
}
