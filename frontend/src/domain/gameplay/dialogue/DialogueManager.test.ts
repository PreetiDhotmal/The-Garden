import { describe, expect, it, vi } from "vitest";
import { createGameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import type { DialogueConditionContext } from "./DialogueConditionEvaluator";
import { DialogueManager, NoActiveDialogueError } from "./DialogueManager";
import type { DialogueTree } from "./DialogueTree";
import { DialogueTreeRegistry } from "./DialogueTreeRegistry";

const SIMPLE_TREE: DialogueTree = {
  id: "dialogue:elder-greeting",
  startNodeId: "greeting",
  nodesById: {
    greeting: {
      id: "greeting",
      speakerName: "The Elder",
      portraitAssetId: null,
      pages: ["Welcome, traveler.", "The garden has much to teach you."],
      choices: [
        { id: "ask-quest", text: "What must I do?", targetNodeId: "quest-offer", condition: null },
        { id: "leave", text: "Farewell.", targetNodeId: "farewell", condition: null },
      ],
      condition: null,
      events: [],
      isTerminal: false,
    },
    "quest-offer": {
      id: "quest-offer",
      speakerName: "The Elder",
      portraitAssetId: null,
      pages: ["Find the three stones."],
      choices: [],
      condition: null,
      events: [{ kind: "OFFER_QUEST", questId: "quest:garden-of-beginnings-shrines" }],
      isTerminal: true,
    },
    farewell: {
      id: "farewell",
      speakerName: "The Elder",
      portraitAssetId: null,
      pages: ["Go in peace."],
      choices: [],
      condition: null,
      events: [],
      isTerminal: true,
    },
    "locked-node": {
      id: "locked-node",
      speakerName: "The Elder",
      portraitAssetId: null,
      pages: ["You have proven yourself."],
      choices: [],
      condition: "quest:garden-of-beginnings-shrines:completed",
      events: [],
      isTerminal: true,
    },
  },
};

function buildManager(overrides: Partial<DialogueConditionContext> = {}) {
  const eventBus = createGameplayEventBus();
  const registry = new DialogueTreeRegistry();
  registry.register(SIMPLE_TREE);
  const context: DialogueConditionContext = {
    getQuestStatus: () => null,
    isScriptureUnlocked: () => false,
    hasTalkedToNpc: () => false,
    ...overrides,
  };
  const manager = new DialogueManager(registry, eventBus, context, "npc:elder");
  return { manager, eventBus, registry };
}

describe("DialogueManager", () => {
  it("starts a session at the tree's start node", () => {
    const { manager } = buildManager();
    const snapshot = manager.start("dialogue:elder-greeting");
    expect(snapshot.node.id).toBe("greeting");
    expect(snapshot.currentPageText).toBe("Welcome, traveler.");
    expect(snapshot.isOnLastPage).toBe(false);
  });

  it("emits dialogue:started", () => {
    const { manager, eventBus } = buildManager();
    const started = vi.fn();
    eventBus.on("dialogue:started", started);

    manager.start("dialogue:elder-greeting");

    expect(started).toHaveBeenCalledWith({
      dialogueTreeId: "dialogue:elder-greeting",
      npcId: "npc:elder",
    });
  });

  it("advances through pages before exposing choices", () => {
    const { manager } = buildManager();
    manager.start("dialogue:elder-greeting");

    const afterAdvance = manager.advancePage();

    expect(afterAdvance.currentPageText).toBe("The garden has much to teach you.");
    expect(afterAdvance.isOnLastPage).toBe(true);
    expect(afterAdvance.availableChoices.map((c) => c.id)).toEqual(["ask-quest", "leave"]);
  });

  it("does not expose choices before the last page", () => {
    const { manager } = buildManager();
    const snapshot = manager.start("dialogue:elder-greeting");
    expect(snapshot.availableChoices).toEqual([]);
  });

  it("skipToLastPage jumps straight past intermediate pages", () => {
    const { manager } = buildManager();
    manager.start("dialogue:elder-greeting");
    const snapshot = manager.skipToLastPage();
    expect(snapshot.isOnLastPage).toBe(true);
  });

  it("choosing a choice moves to the target node and fires its events as request events", () => {
    const { manager, eventBus } = buildManager();
    manager.start("dialogue:elder-greeting");
    manager.skipToLastPage();

    const questOfferRequested = vi.fn();
    eventBus.on("dialogue:quest-offer-requested", questOfferRequested);

    const snapshot = manager.chooseChoice("ask-quest");

    expect(snapshot.node.id).toBe("quest-offer");
    expect(questOfferRequested).toHaveBeenCalledWith({
      questId: "quest:garden-of-beginnings-shrines",
    });
  });

  it("does NOT emit the real quest:started event — only the request event", () => {
    const { manager, eventBus } = buildManager();
    manager.start("dialogue:elder-greeting");
    manager.skipToLastPage();
    const questStarted = vi.fn();
    eventBus.on("quest:started", questStarted);

    manager.chooseChoice("ask-quest");

    expect(questStarted).not.toHaveBeenCalled();
  });

  it("ends the session automatically when a terminal node is reached", () => {
    const { manager, eventBus } = buildManager();
    manager.start("dialogue:elder-greeting");
    manager.skipToLastPage();
    const finished = vi.fn();
    eventBus.on("dialogue:finished", finished);

    manager.chooseChoice("leave");

    expect(manager.isActive()).toBe(false);
    expect(finished).toHaveBeenCalledWith({
      dialogueTreeId: "dialogue:elder-greeting",
      npcId: "npc:elder",
    });
  });

  it("excludes choices whose condition is not met", () => {
    const conditionalTree: DialogueTree = {
      id: "dialogue:conditional",
      startNodeId: "start",
      nodesById: {
        start: {
          id: "start",
          speakerName: "NPC",
          portraitAssetId: null,
          pages: ["Hello."],
          choices: [
            {
              id: "only-if-completed",
              text: "I finished it!",
              targetNodeId: "end",
              condition: "quest:garden-of-beginnings-shrines:completed",
            },
          ],
          condition: null,
          events: [],
          isTerminal: false,
        },
        end: {
          id: "end",
          speakerName: "NPC",
          portraitAssetId: null,
          pages: ["Well done."],
          choices: [],
          condition: null,
          events: [],
          isTerminal: true,
        },
      },
    };
    const eventBus = createGameplayEventBus();
    const registry = new DialogueTreeRegistry();
    registry.register(conditionalTree);
    const conditionalManager = new DialogueManager(registry, eventBus, {
      getQuestStatus: () => "ACTIVE",
      isScriptureUnlocked: () => false,
      hasTalkedToNpc: () => false,
    });

    const snapshot = conditionalManager.start("dialogue:conditional");
    expect(snapshot.availableChoices).toEqual([]);
  });

  it("throws when querying a snapshot with no active dialogue", () => {
    const { manager } = buildManager();
    expect(() => {
      manager.getSnapshot();
    }).toThrow(NoActiveDialogueError);
  });

  it("rejects a tree that references a non-existent node", () => {
    const registry = new DialogueTreeRegistry();
    expect(() => {
      registry.register({
        id: "dialogue:broken",
        startNodeId: "missing",
        nodesById: {},
      });
    }).toThrow();
  });
});
