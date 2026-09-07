"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ResetChatDialogProps {
  onReset: () => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ResetChatDialog({
  onReset,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: ResetChatDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      setControlledOpen?.(nextOpen);
    },
    [isControlled, setControlledOpen]
  );

  const handleConfirm = React.useCallback(() => {
    onReset();
    handleOpenChange(false);
  }, [onReset, handleOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive sm:size-11">
            <RotateCcw className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-base font-semibold sm:text-lg">
              Mulai Percakapan Baru?
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Riwayat percakapan saat ini akan dibersihkan dan Anda akan kembali ke tampilan awal Kak Duta.
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2">
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Batal
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            type="button"
            onClick={handleConfirm}
          >
            <RotateCcw data-icon="inline-start" />
            Ya, Mulai Baru
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
