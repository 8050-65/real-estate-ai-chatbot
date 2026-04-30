import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export function LoadingSpinner({ message, className }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-12', className)}>
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
