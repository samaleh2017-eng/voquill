import { emitTo } from "@tauri-apps/api/event";
import { useCallback, useEffect, useState } from "react";
import { produceAppState, useAppStore } from "../../store";
import { ToastAction } from "../../types/toast.types";
import { ToastItem } from "../toast/ToastItem";

const TOAST_CONTENT_WIDTH = 350;
const ANIMATION_IN_MS = 350;
const ANIMATION_OUT_MS = 150;

export const ToastSection = () => {
  const currentToast = useAppStore((state) => state.currentToast);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [displayedToast, setDisplayedToast] = useState(currentToast);

  const handleClose = useCallback(() => {
    produceAppState((draft) => {
      draft.currentToast = null;
    });
  }, []);

  const handleAction = useCallback((action: ToastAction) => {
    produceAppState((draft) => {
      draft.currentToast = null;
    });

    emitTo("main", "toast-action", { action }).catch(console.error);
  }, []);

  useEffect(() => {
    if (currentToast) {
      setIsAnimatingOut(false);
      setDisplayedToast(currentToast);
    } else if (displayedToast && !isAnimatingOut) {
      setIsAnimatingOut(true);
    }
  }, [currentToast, displayedToast, isAnimatingOut]);

  useEffect(() => {
    if (!isAnimatingOut) return;

    const timer = setTimeout(() => {
      setDisplayedToast(null);
      setIsAnimatingOut(false);
    }, ANIMATION_OUT_MS);

    return () => clearTimeout(timer);
  }, [isAnimatingOut]);

  if (!displayedToast) {
    return null;
  }

  return (
    <div
      key={displayedToast.id}
      className="pointer-events-none absolute top-2 right-2 flex items-start justify-end"
    >
      <div
        data-overlay-interactive
        className="pointer-events-auto"
        style={{
          animation: `${isAnimatingOut ? "overlay-slide-out" : "overlay-slide-in"} ${isAnimatingOut ? ANIMATION_OUT_MS : ANIMATION_IN_MS}ms ease-out forwards`,
          width: TOAST_CONTENT_WIDTH - 16,
        }}
      >
        <ToastItem
          toast={displayedToast}
          onClose={handleClose}
          onAction={handleAction}
        />
      </div>
    </div>
  );
};
