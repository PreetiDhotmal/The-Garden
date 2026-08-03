import { useEffect, useState } from "react";
import { EngineProvider } from "@/presentation/engine/providers/EngineProvider";
import { GameplayProvider } from "@/presentation/gameplay/providers/GameplayProvider";
import { GameFrameworkProvider } from "@/presentation/game/GameFrameworkProvider";
import { useGameFramework } from "@/presentation/game/hooks/useGameFramework";
import { useRegisterCoreAssets } from "@/presentation/engine/assetBootstrap/useRegisterCoreAssets";
import { logAssetValidationReport } from "@/presentation/engine/assetBootstrap/assetValidationReport";
import { useEngine } from "@/presentation/engine/hooks/useEngine";
import { useGameState } from "@/presentation/game/hooks/useGameState";
import { useGameFlowTransition } from "@/presentation/game/hooks/useGameFlowTransition";
import { TransitionFadeOverlay } from "@/presentation/game/components/TransitionFadeOverlay";
import { GameState } from "@/domain/game/GameState";
import { useCharacterSelectionStore } from "@/presentation/character/stores/characterSelectionStore";
import { CharacterSelectionScreen } from "@/presentation/character/components/CharacterSelectionScreen";
import { TimedScreen } from "@/presentation/gameFlow/screens/TimedScreen";
import { MainMenuScreen } from "@/presentation/gameFlow/screens/MainMenuScreen";
import { SettingsScreen } from "@/presentation/gameFlow/screens/SettingsScreen";
import { CreditsScreen } from "@/presentation/gameFlow/screens/CreditsScreen";
import { CoopSetupScreen } from "@/presentation/hub/components/CoopSetupScreen";
import { HubGardenContent } from "@/presentation/hub/routes/HubGardenPage";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { useAndroidBackButton } from "@/presentation/native/useAndroidBackButton";
import { useNativeStatusBar } from "@/presentation/native/useNativeStatusBar";

type PreBootScreen = "SPLASH" | "STUDIO_LOGO" | "GARDEN_LOGO" | "DONE";

/**
 * Splash/studio/logo beats happen before GameStateMachine starts
 * driving anything — GameState's locked Milestone 1 enum has no
 * concept of a splash screen, and it shouldn't: these are a one-time
 * flourish on launch, not a meaningful game mode. Once they finish,
 * this component hands off entirely to the state machine.
 */
function PreBootSequence({ onComplete }: { readonly onComplete: () => void }) {
  const [screen, setScreen] = useState<PreBootScreen>("SPLASH");

  if (screen === "SPLASH") {
    return (
      <TimedScreen
        title="Loading…"
        onAdvance={() => {
          setScreen("STUDIO_LOGO");
        }}
      />
    );
  }
  if (screen === "STUDIO_LOGO") {
    return (
      <TimedScreen
        title="Anthropic Interactive"
        subtitle="presents"
        onAdvance={() => {
          setScreen("GARDEN_LOGO");
        }}
      />
    );
  }
  return (
    <TimedScreen
      title="The Garden"
      subtitle="A local co-op adventure about growing together."
      onAdvance={onComplete}
    />
  );
}

function GameRootContent() {
  useRegisterCoreAssets();
  const gameplayServices = useGameplay();
  const { assetRegistry } = useEngine();
  useEffect(() => {
    logAssetValidationReport(assetRegistry);
  }, [assetRegistry]);
  const { gameStateMachine } = useGameFramework();
  const gameState = useGameState();
  const { opacity, phase, transitionToState } = useGameFlowTransition();
  useAndroidBackButton({ gameState, transitionToState });
  useNativeStatusBar();
  const [isPreBootComplete, setIsPreBootComplete] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isContinueFlow, setIsContinueFlow] = useState(false);
  const selectCharacter = useCharacterSelectionStore((state) => state.selectCharacter);
  const selectedCharacterId = useCharacterSelectionStore((state) => state.selectedCharacterId);

  if (!isPreBootComplete) {
    return (
      <PreBootSequence
        onComplete={() => {
          gameStateMachine.transitionTo(GameState.LOADING);
          gameStateMachine.transitionTo(GameState.MAIN_MENU);
          setIsPreBootComplete(true);
        }}
      />
    );
  }

  if (isSettingsOpen) {
    return (
      <SettingsScreen
        onBack={() => {
          setIsSettingsOpen(false);
        }}
      />
    );
  }

  return (
    <>
      {renderScreen()}
      <TransitionFadeOverlay opacity={opacity} phase={phase} />
    </>
  );

  function renderScreen() {
    switch (gameState) {
      case GameState.MAIN_MENU:
        return (
          <MainMenuScreen
            onNewGame={() => {
              gameplayServices.saveManager.clearSave().catch((error: unknown) => {
                console.error("[GameRoot] Failed to clear save data for New Game:", error);
              });
              setIsContinueFlow(false);
              transitionToState(GameState.CHARACTER_SELECTION);
            }}
            onContinue={() => {
              setIsContinueFlow(true);
              // A save with no character ever chosen has nothing to
              // continue into — Character Selection is the correct
              // fallback rather than spawning into the Hub with no
              // avatar. Once a character exists, Continue skips
              // re-selecting it (already persisted) but still confirms
              // Local Co-op Setup, since that's about which two people
              // are at the keyboard THIS session, not saved state.
              transitionToState(
                selectedCharacterId ? GameState.LOBBY : GameState.CHARACTER_SELECTION
              );
            }}
            onSettings={() => {
              setIsSettingsOpen(true);
            }}
            onCredits={() => {
              transitionToState(GameState.CREDITS);
            }}
          />
        );

      case GameState.CREDITS:
        return (
          <CreditsScreen
            onBack={() => {
              transitionToState(GameState.MAIN_MENU);
            }}
          />
        );

      case GameState.CHARACTER_SELECTION:
        return (
          <CharacterSelectionScreen
            onConfirm={(characterId) => {
              selectCharacter(characterId);
              transitionToState(GameState.LOBBY);
            }}
          />
        );

      case GameState.LOBBY:
        return (
          <CoopSetupScreen
            selectedCharacterId={selectedCharacterId ?? "boy"}
            onBothReady={() => {
              transitionToState(GameState.HUB_WORLD);
            }}
          />
        );

      case GameState.HUB_WORLD:
        return <HubGardenContent shouldLoadSave={isContinueFlow} />;

      default:
        // States beyond HUB_WORLD (ENTERING_LEVEL, PLAYING, PAUSED,
        // LEVEL_COMPLETE, REFLECTION, GARDEN_RESTORATION, SAVING) belong
        // to actual chapter gameplay, which this milestone explicitly
        // does not build — HubGardenContent itself never currently
        // transitions past HUB_WORLD, so this branch is unreachable
        // today but is deliberately not a thrown error, since a future
        // milestone driving those states shouldn't have to touch this
        // switch to avoid one.
        return <HubGardenContent shouldLoadSave={isContinueFlow} />;
    }
  }
}

export function GameRoot() {
  return (
    <EngineProvider>
      <GameplayProvider>
        <GameFrameworkProvider>
          <GameRootContent />
        </GameFrameworkProvider>
      </GameplayProvider>
    </EngineProvider>
  );
}
