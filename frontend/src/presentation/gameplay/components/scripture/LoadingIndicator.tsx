export function LoadingIndicator({ label = "Loading…" }: { readonly label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-garden-300">
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-garden-500 border-t-transparent" />
      {label}
    </div>
  );
}
