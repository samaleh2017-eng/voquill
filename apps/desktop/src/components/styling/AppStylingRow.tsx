import { RiCheckLine, RiMoreLine } from "@remixicon/react";
import { getRec } from "@repo/utilities";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  setAppTargetPasteKeybind,
  setAppTargetTone,
} from "../../actions/app-target.actions";
import { useAppStore } from "../../store";
import { isMacOS } from "../../utils/env.utils";
import { getGenerativePrefs } from "../../utils/user.utils";
import { StorageImageInline } from "@/components/ui/storage-image";
import { ToneSelect } from "../tones/ToneSelect";
import { PostProcessingDisabledTooltip } from "./PostProcessingDisabledTooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type AppStylingRowProps = {
  id: string;
};

export const AppStylingRow = ({ id }: AppStylingRowProps) => {
  const intl = useIntl();
  const target = useAppStore((state) => getRec(state.appTargetById, id));
  const isPostProcessingDisabled = useAppStore(
    (state) => getGenerativePrefs(state).mode === "none",
  );

  const handleToneChange = useCallback(
    (toneId: string | null) => {
      if (!target) return;
      void setAppTargetTone(target.id, toneId);
    },
    [target],
  );

  const handlePasteKeybindChange = useCallback(
    (value: string) => {
      if (!target) return;
      void setAppTargetPasteKeybind(
        target.id,
        value === "ctrl+v" ? null : value,
      );
    },
    [target],
  );

  const toneValue = target?.toneId ?? null;
  const pasteKeybindValue = target?.pasteKeybind ?? "ctrl+v";

  return (
    <div className="mb-2 flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
      <div className="flex size-9 items-center justify-center overflow-hidden rounded-md bg-muted">
        {target?.iconPath && (
          <StorageImageInline
            path={target.iconPath}
            alt={
              target?.name ?? intl.formatMessage({ defaultMessage: "App icon" })
            }
            size={36}
          />
        )}
      </div>

      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
        {target?.name}
      </span>

      <div className="flex items-center gap-2">
        <PostProcessingDisabledTooltip disabled={isPostProcessingDisabled}>
          <ToneSelect
            value={toneValue}
            onToneChange={handleToneChange}
            addToneTargetId={target?.id ?? null}
            disabled={!target || isPostProcessingDisabled}
            formControlSx={{ minWidth: 140 }}
          />
        </PostProcessingDisabledTooltip>

        {!isMacOS() && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={!target}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
              >
                <RiMoreLine className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">
                  <FormattedMessage defaultMessage="Paste Keybind" />
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  <FormattedMessage defaultMessage="Different applications use different keyboard shortcuts for pasting. Select the keybind that works best for this app." />
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handlePasteKeybindChange("ctrl+v")}
              >
                <FormattedMessage defaultMessage="Default (Ctrl+V)" />
                {pasteKeybindValue === "ctrl+v" && (
                  <RiCheckLine className="ml-auto size-4" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handlePasteKeybindChange("ctrl+shift+v")}
              >
                <FormattedMessage defaultMessage="Terminal (Ctrl+Shift+V)" />
                {pasteKeybindValue === "ctrl+shift+v" && (
                  <RiCheckLine className="ml-auto size-4" />
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};
