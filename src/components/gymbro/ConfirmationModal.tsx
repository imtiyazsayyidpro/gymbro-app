"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ConfirmationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmationModal({ open, onOpenChange, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", isLoading = false, onConfirm }: ConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#111112] text-[#f0f0ee] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] text-2xl tracking-wider">{title}</DialogTitle>
          <DialogDescription className="text-white/45">{description}</DialogDescription>
        </DialogHeader>

        <div className="-mx-4 -mb-4 mt-3 flex items-center rounded-b-xl justify-end gap-3 border-t border-white/7 bg-[#181819] px-4 py-4">
          <Button type="button" variant="ghost" disabled={isLoading} onClick={() => onOpenChange(false)} className="h-11 rounded-xl px-5 text-white/50 hover:bg-white/5 hover:text-white/80">
            {cancelLabel}
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="h-11 rounded-xl bg-[#c8f135] px-6 font-[family-name:var(--font-display)] text-base tracking-widest text-[#0e0e0f] shadow-[0_0_16px_rgba(200,241,53,0.2)] hover:bg-[#d4f54d]"
          >
            {isLoading ? "WORKING..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
