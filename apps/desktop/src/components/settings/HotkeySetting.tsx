import {
  RiAddLine,
  RiCloseLine,
  RiCloseCircleLine,
  RiRestartLine,
} from "@remixicon/react";
import type { Hotkey } from "@repo/types";
import type { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { showErrorSnackbar } from "../../actions/app.actions";
import { getHotkeyRepo } from "../../repos";
import { produceAppState, useAppStore } from "../../store";
import { registerHotkeys } from "../../utils/app.utils";
import { createId } from "../../utils/id.utils";
import {
  getDefaultHotkeyCombosForAction,
  getHotkeyCombosForAction,
  syncHotkeyCombosToNative,
} from "../../utils/keyboard.utils";
import { HotKey } from "../common/HotKey";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export type HotkeySettingProps = {
  title: ReactNode;
  description: ReactNode;
  actionName: string;
  buttonSize?: "small" | "medium";
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
};

const areCombosEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((key, index) => key === b[index]);

const isSubsetOrEqualCombo = (a: string[], b: string[]) => {
  if (a.length === 0 || a.length > b.length) return false;
  const bSet = new Set(b.map((k) => k.toLowerCase()));
  return a.every((k) => bSet.has(k.toLowerCase()));
};

export const HotkeySetting = ({
  title,
  description,
  actionName,
  enabled,
  onEnabledChange,
}: HotkeySettingProps) => {
  const hasEnabledToggle = enabled !== undefined;
  const isEnabled = enabled ?? true;
  const hotkeys = useAppStore((state) =>
    state.settings.hotkeyIds
      .map((id) => state.hotkeyById[id])
      .filter(
        (hotkey): hotkey is Hotkey =>
          Boolean(hotkey) && hotkey.actionName === actionName,
      ),
  );
  const defaultCombos = getDefaultHotkeyCombosForAction(actionName);

  const hasConflict = useAppStore((state) => {
    const myCombos = getHotkeyCombosForAction(state, actionName);
    if (myCombos.length === 0) return false;

    const otherActions = new Set(
      Object.values(state.hotkeyById)
        .filter((h) => h.actionName !== actionName && h.keys.length > 0)
        .map((h) => h.actionName),
    );

    for (const otherAction of otherActions) {
      const otherCombos = getHotkeyCombosForAction(state, otherAction);
      for (const mine of myCombos) {
        for (const other of otherCombos) {
          if (
            isSubsetOrEqualCombo(mine, other) ||
            isSubsetOrEqualCombo(other, mine)
          ) {
            return true;
          }
        }
      }
    }
    return false;
  });

  const saveKey = async (id?: string, keys?: string[]) => {
    const newValue: Hotkey = {
      id: id ?? createId(),
      actionName,
      keys: keys ?? [],
    };

    try {
      produceAppState((draft) => {
        registerHotkeys(draft, [newValue]);
        if (!draft.settings.hotkeyIds.includes(newValue.id)) {
          draft.settings.hotkeyIds.push(newValue.id);
        }
        draft.settings.hotkeysStatus = "success";
      });
      await getHotkeyRepo().saveHotkey(newValue);
      await syncHotkeyCombosToNative();
    } catch (error) {
      console.error("Failed to save hotkey", error);
      showErrorSnackbar("Failed to save hotkey. Please try again.");
    }
  };

  const handleDeleteHotkey = async (id: string) => {
    try {
      produceAppState((draft) => {
        delete draft.hotkeyById[id];
        draft.settings.hotkeyIds = draft.settings.hotkeyIds.filter(
          (hid) => hid !== id,
        );
      });
      await getHotkeyRepo().deleteHotkey(id);
      await syncHotkeyCombosToNative();
    } catch (error) {
      console.error("Failed to delete hotkey", error);
      showErrorSnackbar("Failed to delete hotkey. Please try again.");
    }
  };

  const [primaryHotkey, ...additionalHotkeys] = hotkeys;
  const showDefaultAsPrimary = !primaryHotkey && defaultCombos.length > 0;
  const primaryValue =
    primaryHotkey?.keys ?? (showDefaultAsPrimary ? defaultCombos[0] : []);
  const isPrimaryUsingDefault =
    primaryHotkey != null &&
    defaultCombos.some((combo) => areCombosEqual(combo, primaryHotkey.keys));

  const handlePrimaryChange = (keys: string[]) => {
    if (primaryHotkey) {
      void saveKey(primaryHotkey.id, keys);
      return;
    }
    void saveKey(undefined, keys);
  };

  const handleRevertPrimary = () => {
    if (!primaryHotkey || defaultCombos.length === 0) return;
    void saveKey(primaryHotkey.id, defaultCombos[0]);
  };

  const buttonLabel =
    hotkeys.length === 0 && defaultCombos.length === 0 ? (
      <FormattedMessage defaultMessage="Set hotkey" />
    ) : (
      <FormattedMessage defaultMessage="Add another" />
    );

  const handleToggle = (checked: boolean) => {
    onEnabledChange?.(checked);
    if (checked && !primaryHotkey && defaultCombos.length > 0) {
      void saveKey(undefined, defaultCombos[0]);
    }
  };

  const handleDisable = () => {
    onEnabledChange?.(false);
  };

  return (
    <div className="flex gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{title}</span>
          {hasEnabledToggle && (
            <Switch
              size="sm"
              checked={isEnabled}
              onCheckedChange={handleToggle}
              aria-label="Enable hotkey"
            />
          )}
        </div>
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
      {isEnabled && (
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            <HotKey value={primaryValue} onChange={handlePrimaryChange} />
            {hasEnabledToggle ? (
              <button
                onClick={handleDisable}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent"
                aria-label="Disable hotkey"
              >
                <RiCloseCircleLine className="size-4" />
              </button>
            ) : (
              <>
                {primaryHotkey && defaultCombos.length === 0 && (
                  <button
                    onClick={() => handleDeleteHotkey(primaryHotkey.id)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-accent"
                  >
                    <RiCloseLine className="size-4" />
                  </button>
                )}
                {primaryHotkey &&
                  defaultCombos.length > 0 &&
                  !isPrimaryUsingDefault && (
                    <button
                      onClick={handleRevertPrimary}
                      className="rounded-md p-1 text-muted-foreground hover:bg-accent"
                      aria-label="Revert to default hotkey"
                    >
                      <RiRestartLine className="size-4" />
                    </button>
                  )}
              </>
            )}
          </div>
          {!hasEnabledToggle &&
            additionalHotkeys.map((hotkey) => (
              <div key={hotkey.id} className="flex items-center gap-1.5">
                <HotKey
                  value={hotkey.keys}
                  onChange={(keys) => saveKey(hotkey.id, keys)}
                />
                <button
                  onClick={() => handleDeleteHotkey(hotkey.id)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent"
                >
                  <RiCloseLine className="size-4" />
                </button>
              </div>
            ))}
          {hasConflict && (
            <span className="max-w-[220px] text-right text-xs text-yellow-500">
              <FormattedMessage defaultMessage="This shortcut overlaps with another. One may trigger both actions." />
            </span>
          )}
          {!hasEnabledToggle &&
            (hotkeys.length > 0 || defaultCombos.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                className="py-1"
                onClick={() => saveKey()}
              >
                <RiAddLine className="mr-1 size-3.5" />
                <span className="text-sm font-medium">{buttonLabel}</span>
              </Button>
            )}
        </div>
      )}
    </div>
  );
};
