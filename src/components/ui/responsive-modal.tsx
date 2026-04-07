import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Ancho máximo en desktop. Default: max-w-lg */
  maxWidth?: string;
}

/**
 * Modal responsive: bottom sheet (Drawer) en mobile, centered Dialog en desktop.
 *
 * Reemplaza `<Dialog>` cuando quieras feel nativo en mobile.
 *
 * Uso:
 *   <ResponsiveModal
 *     open={open}
 *     onOpenChange={setOpen}
 *     title="Solicitar consulta"
 *     description="Cuéntale al veterinario qué necesitas"
 *   >
 *     <form>...</form>
 *   </ResponsiveModal>
 */
export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = "max-w-lg",
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          {(title || description) && (
            <DrawerHeader className="text-left">
              {title && <DrawerTitle>{title}</DrawerTitle>}
              {description && <DrawerDescription>{description}</DrawerDescription>}
            </DrawerHeader>
          )}
          <div
            className="px-4 pb-6 overflow-y-auto"
            style={{ paddingBottom: "calc(1.5rem + var(--safe-area-bottom))" }}
          >
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={maxWidth}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}
