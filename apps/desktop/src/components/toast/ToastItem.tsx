import { RiCloseLine, RiErrorWarningLine, RiInformation2Line } from "@remixicon/react";
import { useIntl } from "react-intl";
import { Toast, ToastAction } from "../../types/toast.types";
import { Button } from "../ui/button";

const DEFAULT_DURATION_MS = 3000;

type ToastItemProps = {
  toast: Toast;
  onClose?: () => void;
  onAction?: (action: ToastAction) => void;
};

export const ToastItem = ({ toast, onClose, onAction }: ToastItemProps) => {
  const intl = useIntl();
  const isError = toast.toastType === "error";
  const duration = toast.duration ?? DEFAULT_DURATION_MS;

  const getActionLabel = (action: ToastAction): string => {
    switch (action) {
      case "upgrade":
        return intl.formatMessage({ defaultMessage: "Upgrade" });
      case "open_agent_settings":
        return intl.formatMessage({ defaultMessage: "Fix" });
      case "surface_window":
        return intl.formatMessage({ defaultMessage: "Open" });
    }
  };

  const actionLabel = toast.action ? getActionLabel(toast.action) : null;

  return (
    <div className="relative flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[0_10px_40px_rgba(0,0,0,0.15),0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4),0_4px_12px_rgba(0,0,0,0.25)]">
      <button
        onClick={onClose}
        className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
      >
        <RiCloseLine className="size-4" />
      </button>
      {/* Content */}
      <div className="flex items-start gap-3 p-4">
        <div className="shrink-0 pt-0.5">
          {isError ? (
            <RiErrorWarningLine className="size-6 text-destructive" />
          ) : (
            <RiInformation2Line className="size-6 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`mb-1 truncate text-sm font-semibold ${isError ? "text-destructive" : "text-foreground"}`}
          >
            {toast.title}
          </p>
          <p className="line-clamp-3 break-words text-sm text-muted-foreground">
            {toast.message}
          </p>
        </div>
        {actionLabel && toast.action && (
          <div className="ml-2 shrink-0 self-center">
            <Button
              size="xs"
              onClick={() => onAction?.(toast.action!)}
            >
              {actionLabel}
            </Button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          key={toast.id}
          className="h-full bg-primary"
          style={{
            animation: `toast-progress-shrink ${duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
};
