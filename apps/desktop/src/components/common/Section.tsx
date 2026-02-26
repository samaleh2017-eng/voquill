import { isDefined } from "@repo/utilities";
import { RiCheckboxFill, RiCheckboxBlankLine } from "@remixicon/react";
import { FormattedMessage } from "react-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SectionProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  enabled?: boolean;
  onToggleEnable?: () => void;
  blocked?: boolean;
  blockedReason?: React.ReactNode;
};

export const Section = ({
  title,
  description,
  children,
  enabled,
  onToggleEnable,
  blocked,
  blockedReason,
}: SectionProps) => {
  const fieldEnabled = !blocked && (enabled ?? true);
  const headerEnabled = !blocked;

  const content = (
    <div className="mb-6">
      <div
        className="flex items-center"
        style={{ opacity: headerEnabled ? 1 : 0.3 }}
      >
        <h3 className="text-lg font-bold">{title}</h3>
        {isDefined(enabled) && (
          <button
            className="ml-2 cursor-pointer pt-0.5"
            onClick={onToggleEnable}
          >
            {enabled ? (
              <RiCheckboxFill className="size-5" />
            ) : (
              <RiCheckboxBlankLine className="size-5" />
            )}
          </button>
        )}
      </div>
      <div style={{ opacity: fieldEnabled ? 1 : 0.3 }}>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
        <div className="mt-3 rounded-xl bg-muted overflow-hidden divide-y divide-border">{children}</div>
      </div>
    </div>
  );

  if (blocked) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="relative inline-block cursor-not-allowed pointer-events-none">
              {content}
              <div className="absolute inset-0 cursor-not-allowed pointer-events-auto" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {blockedReason || (
              <FormattedMessage defaultMessage="This setting is not available." />
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};
