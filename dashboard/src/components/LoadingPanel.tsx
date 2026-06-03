interface LoadingPanelProps {
  message: string;
  submessage?: string;
}

export function LoadingPanel({ message, submessage }: LoadingPanelProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-background min-h-[320px]">
      <div className="w-9 h-9 border-[3px] border-surface-border border-t-primary rounded-full animate-spin" />
      <p className="text-[13px] text-secondary font-medium">{message}</p>
      {submessage ? <p className="text-[11px] text-secondary/80">{submessage}</p> : null}
    </div>
  );
}

export function LoadingOverlay({ message = "Updating pivot…" }: { message?: string }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-surface-bright/85 backdrop-blur-[1px]">
      <div className="w-7 h-7 border-[3px] border-surface-border border-t-primary rounded-full animate-spin" />
      <p className="text-[12px] text-secondary font-medium">{message}</p>
    </div>
  );
}
