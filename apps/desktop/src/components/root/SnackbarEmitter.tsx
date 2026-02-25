import { useEffect } from "react";
import { toast } from "sonner";
import { useAppStore } from "../../store";

export const SnackbarEmitter = () => {
  const snackbarCounter = useAppStore((state) => state.snackbarCounter);
  const snackbarMessage = useAppStore((state) => state.snackbarMessage);
  const snackbarDuration = useAppStore((state) => state.snackbarDuration);
  const snackbarMode = useAppStore((state) => state.snackbarMode);

  useEffect(() => {
    if (snackbarCounter > 0 && snackbarMessage) {
      const options = {
        duration: snackbarDuration ?? 4000,
      };

      if (snackbarMode === "error") {
        toast.error(snackbarMessage, options);
      } else if (snackbarMode === "success") {
        toast.success(snackbarMessage, options);
      } else {
        toast.info(snackbarMessage, options);
      }
    }
  }, [snackbarCounter]);

  return null;
};
