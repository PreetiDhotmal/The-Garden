import type { JSX } from "react";

import { motion } from "framer-motion";
import { useBackendConnectionStatus } from "@/application/player/useBackendConnectionStatus";

export function HomePage(): JSX.Element {
  const { data, isLoading, isError } = useBackendConnectionStatus();

  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="font-[var(--font-display)] text-5xl tracking-wide text-garden-100"
      >
        The Garden
      </motion.h1>
      <p className="max-w-md text-garden-300">
        A peaceful third-person adventure through seven symbolic worlds of faith.
      </p>
      <ConnectionBadge isLoading={isLoading} isError={isError} status={data?.status} />
    </main>
  );
}

interface ConnectionBadgeProps {
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly status: "UP" | "DOWN" | undefined;
}

function ConnectionBadge({ isLoading, isError, status }: ConnectionBadgeProps): JSX.Element {
  const label = isLoading ? "Connecting…" : isError ? "Backend unreachable" : `Backend: ${status ?? "UNKNOWN"}`;
  const dotColor = isLoading ? "bg-yellow-400" : isError ? "bg-red-500" : "bg-garden-500";

  return (
    <div className="flex items-center gap-2 rounded-full border border-garden-700 px-4 py-2 text-sm">
      <span className={`h-2 w-2 rounded-full ${dotColor}`} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
