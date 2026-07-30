import { useState } from "react";
import { useNavigate } from "react-router";
import type { GameFlowScreen } from "@/domain/gameFlow/GameFlowScreen";
import { useCharacterSelectionStore } from "@/presentation/character/stores/characterSelectionStore";
import { CharacterSelectionScreen } from "@/presentation/character/components/CharacterSelectionScreen";
import { TimedScreen } from "./screens/TimedScreen";
import { MainMenuScreen } from "./screens/MainMenuScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { CreditsScreen } from "./screens/CreditsScreen";
import { DifficultyScreen } from "./screens/DifficultyScreen";
import { IntroCutsceneScreen } from "./components/IntroCutsceneScreen";

export function GameFlow() {
  const [screen, setScreen] = useState<GameFlowScreen>("SPLASH");
  const navigate = useNavigate();
  const selectCharacter = useCharacterSelectionStore((state) => state.selectCharacter);

  const enterWorld = (options: { readonly shouldContinue: boolean }) => {
    setScreen("ENTERING_WORLD");
    void navigate(options.shouldContinue ? "/garden?continue=1" : "/garden");
  };

  switch (screen) {
    case "SPLASH":
      return (
        <TimedScreen
          title="Loading…"
          onAdvance={() => {
            setScreen("STUDIO_LOGO");
          }}
        />
      );

    case "STUDIO_LOGO":
      return (
        <TimedScreen
          title="Anthropic Interactive"
          subtitle="presents"
          onAdvance={() => {
            setScreen("GARDEN_LOGO");
          }}
        />
      );

    case "GARDEN_LOGO":
      return (
        <TimedScreen
          title="The Garden"
          subtitle="A peaceful third-person adventure through seven symbolic worlds of faith."
          onAdvance={() => {
            setScreen("MAIN_MENU");
          }}
        />
      );

    case "MAIN_MENU":
      return (
        <MainMenuScreen
          onNewGame={() => {
            setScreen("INTRO_CUTSCENE");
          }}
          onContinue={() => {
            enterWorld({ shouldContinue: true });
          }}
          onSettings={() => {
            setScreen("SETTINGS");
          }}
          onCredits={() => {
            setScreen("CREDITS");
          }}
        />
      );

    case "CREDITS":
      return (
        <CreditsScreen
          onBack={() => {
            setScreen("MAIN_MENU");
          }}
        />
      );

    case "SETTINGS":
      return (
        <SettingsScreen
          onBack={() => {
            setScreen("MAIN_MENU");
          }}
        />
      );

    case "INTRO_CUTSCENE":
      return (
        <IntroCutsceneScreen
          onFinished={() => {
            setScreen("CHARACTER_SELECT");
          }}
        />
      );

    case "CHARACTER_SELECT":
      return (
        <CharacterSelectionScreen
          onConfirm={(characterId) => {
            selectCharacter(characterId);
            setScreen("DIFFICULTY_SELECT");
          }}
        />
      );

    case "DIFFICULTY_SELECT":
      return (
        <DifficultyScreen
          onConfirm={() => {
            enterWorld({ shouldContinue: false });
          }}
        />
      );

    case "ENTERING_WORLD":
      return (
        <div className="flex h-full w-full items-center justify-center bg-shadow-valley text-light-divine">
          Entering the Garden…
        </div>
      );

    default: {
      const exhaustiveCheck: never = screen;
      throw new Error(`Unhandled game flow screen: ${String(exhaustiveCheck)}`);
    }
  }
}
