export interface ErrorMessageProps {
  readonly message: string;
  readonly onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col gap-2 rounded border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300">
      <span>{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="self-start rounded border border-red-800 px-2 py-1 text-xs text-red-200 hover:bg-red-900/40"
        >
          Retry
        </button>
      )}
    </div>
  );
}
