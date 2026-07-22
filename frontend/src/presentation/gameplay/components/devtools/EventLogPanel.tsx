import { useEffect, useState } from "react";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";

interface LoggedEvent {
  readonly id: number;
  readonly name: string;
  readonly payload: string;
}

const MAX_LOGGED_EVENTS = 25;
let nextEventId = 0;

export function EventLogPanel() {
  const { eventBus } = useGameplay();
  const [events, setEvents] = useState<readonly LoggedEvent[]>([]);

  useEffect(
    () =>
      eventBus.onAny((name, payload) => {
        nextEventId += 1;
        const entry: LoggedEvent = {
          id: nextEventId,
          name: String(name),
          payload: JSON.stringify(payload),
        };
        setEvents((current) => [entry, ...current].slice(0, MAX_LOGGED_EVENTS));
      }),
    [eventBus]
  );

  return (
    <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-md border border-garden-700 bg-black/70 p-3 font-mono text-xs text-light-divine">
      <div className="font-semibold text-garden-300">Event Log</div>
      {events.length === 0 && <div className="text-garden-700">No events yet.</div>}
      {events.map((event) => (
        <div key={event.id} className="border-t border-garden-900 pt-1">
          <span className="text-garden-300">{event.name}</span>
          <span className="ml-2 text-garden-600">{event.payload}</span>
        </div>
      ))}
    </div>
  );
}
