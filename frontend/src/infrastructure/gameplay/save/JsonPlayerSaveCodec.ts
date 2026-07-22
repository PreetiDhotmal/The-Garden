import type { PlayerSave } from "@/domain/gameplay/save/PlayerSave";
import type {
  PlayerSaveDeserializer,
  PlayerSaveSerializer,
} from "@/domain/gameplay/save/SaveContracts";

export class InvalidSaveDataError extends Error {
  constructor(cause: unknown) {
    super("Save data could not be parsed — it may be corrupted or from an incompatible version.");
    this.name = "InvalidSaveDataError";
    this.cause = cause;
  }
}

export class JsonPlayerSaveCodec implements PlayerSaveSerializer, PlayerSaveDeserializer {
  serialize(value: PlayerSave): string {
    return JSON.stringify(value);
  }

  deserialize(data: string): PlayerSave {
    try {
      return JSON.parse(data) as PlayerSave;
    } catch (error) {
      throw new InvalidSaveDataError(error);
    }
  }
}
