import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionUrl?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionUrl, onAction, children }: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-primary/60" />
      </div>
      <p className="font-medium text-sm mb-1">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground max-w-[260px] mb-4">{description}</p>
      )}
      {actionLabel && (actionUrl || onAction) && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAction ? onAction() : actionUrl && navigate(actionUrl)}
        >
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
