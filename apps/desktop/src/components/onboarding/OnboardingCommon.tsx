import { RiArrowLeftLine } from "@remixicon/react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router-dom";
import { goBackOnboardingPage } from "../../actions/onboarding.actions";
import { getAppState } from "../../store";
import { trackButtonClick } from "../../utils/analytics.utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const BackButton = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    trackButtonClick("onboarding_back");
    const state = getAppState();
    const stack = state.onboarding.history;
    if (stack.length === 0) {
      navigate(-1);
    } else {
      goBackOnboardingPage();
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      className="text-muted-foreground font-normal"
    >
      <RiArrowLeftLine className="size-4" />
      <FormattedMessage defaultMessage="Back" />
    </Button>
  );
};

export type OnboardingFormLayoutProps = {
  back?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
};

export const OnboardingFormLayout = ({
  back,
  children,
  actions,
}: OnboardingFormLayoutProps) => {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative z-10 shrink-0 after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-4 after:h-4 after:bg-gradient-to-b after:from-background after:to-transparent">
        {back}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-2 [scrollbar-gutter:stable]">
        <div className="my-auto">{children}</div>
      </div>
      <div className="relative z-10 flex shrink-0 justify-end before:pointer-events-none before:absolute before:inset-x-0 before:-top-4 before:h-4 before:bg-gradient-to-t before:from-background before:to-transparent">
        {actions}
      </div>
    </div>
  );
};

export type DualPaneLayoutProps = {
  left?: React.ReactNode;
  right?: React.ReactNode;
  rightClassName?: string;
  flex?: [number, number];
};

export const DualPaneLayout = ({
  left,
  right,
  rightClassName,
  flex = [1, 1],
}: DualPaneLayoutProps) => {
  const isTransparentBg = rightClassName?.includes("bg-transparent");

  return (
    <div className="flex h-full w-full flex-row items-stretch gap-5 p-5 pt-2">
      {left && (
        <div
          className="flex min-h-0 min-w-0 flex-col"
          style={{ flex: flex[0] }}
        >
          {left}
        </div>
      )}

      {right && (
        <div
          className={cn(
            "flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-2xl p-1",
            !isTransparentBg && "bg-muted",
            "[&_img]:max-h-full [&_img]:max-w-full [&_img]:object-contain [&_img]:dark:invert [&_img]:dark:hue-rotate-[185deg]",
            rightClassName,
          )}
          style={{ flex: flex[1] }}
        >
          {right}
        </div>
      )}
    </div>
  );
};
