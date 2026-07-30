import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { AnimationRole } from "@/domain/character/animation/AnimationRole";
import type { CharacterAnimationConfig } from "@/domain/character/animation/CharacterAnimationConfig";
import type { CharacterEntity } from "@/domain/character/CharacterEntity";
import type { NpcDefinition } from "@/domain/gameplay/npc/NpcDefinition";
import { CharacterAnimationController } from "@/infrastructure/character/CharacterAnimationController";
import { cloneCharacterScene } from "@/infrastructure/character/CharacterModelLoader";
import { useCharacterAssets } from "@/presentation/character/hooks/useCharacterAssets";
import { createGirlAnimationConfig } from "@/infrastructure/character/defaultAnimationConfigs";
import { CHARACTER_MODEL_ASSET_IDS } from "@/presentation/character/characterModelAssets";
import { InteractableObject } from "@/presentation/gameplay/components/InteractableObject";
import { useEngine } from "@/presentation/engine/hooks/useEngine";

export interface NpcCharacterViewProps {
  readonly definition: NpcDefinition;
  readonly isTalking: boolean;
  readonly onInteract: () => void;
  readonly playerEntity: CharacterEntity | null;
}

const LOOK_AT_RADIUS = 6;
const LOOK_AT_TURN_SPEED_RADIANS_PER_SECOND = 3;
const BREATHING_AMPLITUDE = 0.015;
const BREATHING_SPEED = 1.4;
const VOICE_SFX_ASSET_ID = "audio:voice:elder-greeting";

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

export function NpcCharacterView({
  definition,
  isTalking,
  onInteract,
  playerEntity,
}: NpcCharacterViewProps) {
  const { data } = useCharacterAssets(CHARACTER_MODEL_ASSET_IDS.GIRL);
  const { assetManager, sfxManager } = useEngine();
  const controllerRef = useRef<CharacterAnimationController | null>(null);
  const groupRef = useRef<Group>(null);
  const wasTalkingRef = useRef(false);

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

  // Voice placeholder — no voiced dialogue asset exists yet, same
  // honest "wired but silent" pattern as footsteps/landing/seed
  // collection. Fires once per dialogue opening, not continuously.
  useEffect(() => {
    if (isTalking && !wasTalkingRef.current) {
      const voiceBuffer = assetManager.isCached(VOICE_SFX_ASSET_ID)
        ? assetManager.getCached<AudioBuffer>(VOICE_SFX_ASSET_ID)
        : undefined;
      if (voiceBuffer) {
        sfxManager.play(voiceBuffer, { volume: 0.6 });
      }
    }
    wasTalkingRef.current = isTalking;
  }, [isTalking, assetManager, sfxManager]);

  useFrame((state, delta) => {
    controllerRef.current?.update(delta);

    if (!groupRef.current) {
      return;
    }

    // Idle breathing — a subtle vertical scale pulse, since no
    // dedicated breathing animation clip exists on this model. A
    // common, cheap technique when only a static idle pose is
    // available; not attempted as blend-shape-driven chest movement,
    // which this model doesn't expose.
    const breathingScale = 1 + Math.sin(state.clock.elapsedTime * BREATHING_SPEED) * BREATHING_AMPLITUDE;
    groupRef.current.scale.set(1, breathingScale, 1);

    // Look-at-player — only while the player is within a reasonable
    // conversational radius, so the NPC doesn't visibly snap to face
    // someone far across the Garden.
    if (playerEntity) {
      const playerPosition = playerEntity.getPosition();
      const dx = playerPosition.x - definition.spawnPosition.x;
      const dz = playerPosition.z - definition.spawnPosition.z;
      const distance = Math.hypot(dx, dz);
      if (distance <= LOOK_AT_RADIUS && distance > 0.01) {
        const targetYaw = Math.atan2(dx, dz);
        const currentYaw = groupRef.current.rotation.y;
        let yawDelta = targetYaw - currentYaw;
        yawDelta = Math.atan2(Math.sin(yawDelta), Math.cos(yawDelta));
        const maxStep = LOOK_AT_TURN_SPEED_RADIANS_PER_SECOND * delta;
        groupRef.current.rotation.y += Math.sign(yawDelta) * Math.min(Math.abs(yawDelta), maxStep);
      }
    }
  });

  const position: readonly [number, number, number] = [
    definition.spawnPosition.x,
    definition.spawnPosition.y,
    definition.spawnPosition.z,
  ];

  return (
    <>
      {clonedScene && (
        <group ref={groupRef} position={position}>
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
