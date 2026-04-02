import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIDisclaimer } from "./AIDisclaimer";

interface Props {
  title: string;
  children: React.ReactNode;
  disclaimerType?: "medical" | "general";
  remaining?: number | null;
}

export function AIResultCard({ title, children, disclaimerType = "general", remaining }: Props) {
  return (
    <Card className="border-primary/20 shadow-sm animate-fade-in">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
          {remaining !== null && remaining !== undefined && (
            <span className="text-xs text-muted-foreground">{remaining} restantes hoy</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {children}
        <AIDisclaimer type={disclaimerType} />
      </CardContent>
    </Card>
  );
}
