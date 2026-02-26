import type { ReactElement } from "react";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { produceAppState } from "../../store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type PostProcessingDisabledTooltipProps = {
  disabled: boolean;
  children: ReactElement;
};

export const PostProcessingDisabledTooltip = ({
  disabled,
  children,
}: PostProcessingDisabledTooltipProps) => {
  const openPostProcessingSettings = useCallback(() => {
    produceAppState((draft) => {
      draft.settings.aiPostProcessingDialogOpen = true;
    });
  }, []);

  if (!disabled) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>{children}</span>
        </TooltipTrigger>
        <TooltipContent>
          <span>
            <FormattedMessage defaultMessage="Post-processing must be enabled to use writing styles." />{" "}
            <button
              className="underline underline-offset-2"
              onClick={openPostProcessingSettings}
            >
              <FormattedMessage defaultMessage="Fix issue" />
            </button>
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
