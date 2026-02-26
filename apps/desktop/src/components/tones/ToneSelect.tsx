import { RiAddLine, RiEditLine, RiGlobalLine } from "@remixicon/react";
import type { Tone } from "@repo/types";
import { getRec } from "@repo/utilities";
import { useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { setLocalStorageValue } from "../../actions/local-storage.actions";
import { openToneEditorDialog } from "../../actions/tone.actions";
import { useAppStore } from "../../store";
import { getSortedToneIds } from "../../utils/tone.utils";
import { getMyUserPreferences } from "../../utils/user.utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const ADD_TONE_MENU_VALUE = "__add_tone_option__";

type ToneSelectProps = {
  value: string | null | undefined;
  onToneChange: (toneId: string | null) => void;
  addToneTargetId?: string | null;
  disabled?: boolean;
  className?: string;
  formControlSx?: Record<string, unknown>;
  selectSize?: "small" | "medium";
  label?: string;
  trueDefault?: boolean;
};

export const ToneSelect = ({
  value,
  onToneChange,
  addToneTargetId = null,
  disabled = false,
  className,
  formControlSx,
  selectSize: _selectSize = "small",
  label,
  trueDefault,
}: ToneSelectProps) => {
  const intl = useIntl();
  const toneById = useAppStore((state) => state.toneById);
  const defaultTone = useAppStore((state) => {
    const userPreferences = getMyUserPreferences(state);
    return getRec(state.toneById, userPreferences?.activeToneId);
  });

  const sortedToneIds = useAppStore((state) => getSortedToneIds(state));
  const tones = useMemo(
    () => sortedToneIds.map((id) => toneById[id]).filter(Boolean) as Tone[],
    [sortedToneIds, toneById],
  );

  const resolvedValue = getRec(toneById, value)?.id ?? "default";

  const handleValueChange = useCallback(
    (val: string) => {
      if (val === ADD_TONE_MENU_VALUE) {
        openToneEditorDialog({ mode: "create", targetId: addToneTargetId });
        return;
      }

      const toneId = val === "default" ? null : val;
      setLocalStorageValue("voquill:checklist-writing-style", true);
      onToneChange(toneId);
    },
    [addToneTargetId, onToneChange],
  );

  const displayValue = useMemo(() => {
    if (resolvedValue === "default") {
      return defaultTone && !trueDefault
        ? intl.formatMessage(
            { defaultMessage: "Default ({toneName})" },
            { toneName: defaultTone.name },
          )
        : intl.formatMessage({ defaultMessage: "Default" });
    }
    return toneById[resolvedValue]?.name ?? resolvedValue;
  }, [resolvedValue, defaultTone, trueDefault, toneById, intl]);

  const style = formControlSx
    ? Object.fromEntries(
        Object.entries(formControlSx as Record<string, unknown>).filter(
          ([, v]) => typeof v === "number" || typeof v === "string",
        ),
      )
    : undefined;

  return (
    <div className={className} style={style}>
      {label && <Label className="mb-1.5">{label}</Label>}
      <Select
        value={resolvedValue}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue>{displayValue}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ADD_TONE_MENU_VALUE}>
            <div className="flex items-center gap-2">
              <RiAddLine className="h-4 w-4" />
              <FormattedMessage defaultMessage="New style" />
            </div>
          </SelectItem>
          <SelectItem value="default">
            {defaultTone && !trueDefault ? (
              <FormattedMessage
                defaultMessage="Default ({toneName})"
                values={{ toneName: defaultTone.name }}
              />
            ) : (
              <FormattedMessage defaultMessage="Default" />
            )}
          </SelectItem>
          {tones.map((tone) => (
            <SelectItem key={tone.id} value={tone.id}>
              <div className="flex items-center justify-between w-full gap-2">
                <span>{tone.name}</span>
                {tone.isGlobal ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <RiGlobalLine className="h-4 w-4 text-muted-foreground shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <FormattedMessage defaultMessage="This is a global style and cannot be edited" />
                    </TooltipContent>
                  </Tooltip>
                ) : !tone.isSystem ? (
                  <button
                    className="p-0.5 rounded hover:bg-accent shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      openToneEditorDialog({ mode: "edit", toneId: tone.id });
                    }}
                  >
                    <RiEditLine className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
