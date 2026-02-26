import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, type ButtonProps } from "@/components/ui/button";

export type ConfirmDialogProps = {
  isOpen: boolean;
  title: ReactNode;
  content: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  confirmButtonProps?: Partial<ButtonProps>;
  cancelButtonProps?: Partial<ButtonProps>;
};

export const ConfirmDialog = ({
  isOpen,
  title,
  content,
  onCancel,
  onConfirm,
  confirmLabel,
  cancelLabel,
  confirmButtonProps,
  cancelButtonProps,
}: ConfirmDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{content}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} {...cancelButtonProps}>
            {cancelLabel ?? <FormattedMessage defaultMessage="Cancel" />}
          </Button>
          <Button onClick={onConfirm} {...confirmButtonProps}>
            {confirmLabel ?? <FormattedMessage defaultMessage="Confirm" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
