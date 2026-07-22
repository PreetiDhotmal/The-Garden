import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { PlayerSave } from "@/domain/gameplay/save/PlayerSave";
import type { SaveRepository } from "@/domain/gameplay/save/SaveContracts";
import { JsonPlayerSaveCodec } from "./JsonPlayerSaveCodec";

const DB_NAME = "the-garden-save";
const DB_VERSION = 1;
const SAVE_SLOT_KEY = "primary";

interface SaveDbSchema extends DBSchema {
  saves: { key: string; value: { slot: string; json: string; savedAtIso: string } };
}

let dbPromise: Promise<IDBPDatabase<SaveDbSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<SaveDbSchema>> {
  dbPromise ??= openDB<SaveDbSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("saves")) {
        db.createObjectStore("saves", { keyPath: "slot" });
      }
    },
  });
  return dbPromise;
}

/**
 * A single save slot for now ("primary") — multiple save slots are a
 * straightforward future extension (this store is already keyed by
 * slot name), not built here since nothing in this milestone's scope
 * calls for it yet.
 */
export class IndexedDbSaveRepository implements SaveRepository {
  private readonly codec = new JsonPlayerSaveCodec();

  async save(playerSave: PlayerSave): Promise<void> {
    const db = await getDb();
    await db.put("saves", {
      slot: SAVE_SLOT_KEY,
      json: this.codec.serialize(playerSave),
      savedAtIso: playerSave.savedAtIso,
    });
  }

  async load(): Promise<PlayerSave | null> {
    const db = await getDb();
    const record = await db.get("saves", SAVE_SLOT_KEY);
    if (!record) {
      return null;
    }
    return this.codec.deserialize(record.json);
  }

  async clear(): Promise<void> {
    const db = await getDb();
    await db.delete("saves", SAVE_SLOT_KEY);
  }
}
