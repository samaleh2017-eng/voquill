import { RiAddLine, RiCloseLine } from "@remixicon/react";
import type { Hotkey } from "@repo/types";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import { showErrorSnackbar } from "../../actions/app.actions";
import { loadTones } from "../../actions/tone.actions";
import { setPreferredLanguage } from "../../actions/user.actions";
import { getHotkeyRepo } from "../../repos";
import { produceAppState, useAppStore } from "../../store";
import { registerHotkeys } from "../../utils/app.utils";
import { createId } from "../../utils/id.utils";
import {
  ADDITIONAL_LANGUAGE_HOTKEY_PREFIX,
  DICTATE_HOTKEY,
  getAdditionalLanguageActionName,
  getAdditionalLanguageEntries,
  getHotkeyCombosForAction,
  syncHotkeyCombosToNative,
} from "../../utils/keyboard.utils";
import {
  DICTATION_LANGUAGE_OPTIONS,
  KEYBOARD_LAYOUT_LANGUAGE,
} from "../../utils/language.utils";
import { getDetectedSystemLocale, getMyUser } from "../../utils/user.utils";
import { HotKey } from "../common/HotKey";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RiAlertLine } from "@remixicon/react";

type DictationLanguageRowProps = {
  language: string;
  hotkeyKeys: string[];
  onLanguageChange: (language: string) => void;
  onHotkeyChange: (keys: string[]) => void;
  onDelete?: () => void;
  canDelete: boolean;
};

const DictationLanguageRow = ({
  language,
  hotkeyKeys,
  onLanguageChange,
  onHotkeyChange,
  onDelete,
  canDelete,
}: DictationLanguageRowProps) => {
  return (
    <div className="flex w-full items-center gap-2">
      <HotKey value={hotkeyKeys} onChange={onHotkeyChange} />
      <div className="min-w-0 flex-1">
        <Select value={language} onValueChange={onLanguageChange}>
          <SelectTrigger className="w-full" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {DICTATION_LANGUAGE_OPTIONS.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {canDelete && (
        <button
          onClick={onDelete}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent"
        >
          <RiCloseLine className="size-4" />
        </button>
      )}
    </div>
  );
};

type LanguageRow = {
  rowId: string;
  language: string;
  hotkeyKeys: string[];
};

export const DictationLanguageDialog = () => {
  const open = useAppStore(
    (state) => state.settings.dictationLanguageDialogOpen,
  );

  const storePrimaryLanguage = useAppStore((state) => {
    const user = getMyUser(state);
    return user?.preferredLanguage ?? getDetectedSystemLocale();
  });

  const storePrimaryHotkeyKeys = useAppStore((state) => {
    const combos = getHotkeyCombosForAction(state, DICTATE_HOTKEY);
    return combos[0] ?? [];
  });

  const storeAdditionalEntries = useAppStore(getAdditionalLanguageEntries);

  const [rows, setRows] = useState<LanguageRow[]>([]);

  useEffect(() => {
    if (!open) return;
    setRows([
      {
        rowId: createId(),
        language: storePrimaryLanguage,
        hotkeyKeys: storePrimaryHotkeyKeys,
      },
      ...storeAdditionalEntries.map((entry) => ({
        rowId: createId(),
        language: entry.language,
        hotkeyKeys: entry.hotkeyCombos[0] ?? [],
      })),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    produceAppState((draft) => {
      draft.settings.dictationLanguageDialogOpen = false;
    });
  };

  const handleLanguageChange = (rowId: string, language: string) => {
    setRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, language } : r)),
    );
  };

  const handleHotkeyChange = (rowId: string, keys: string[]) => {
    setRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, hotkeyKeys: keys } : r)),
    );
  };

  const handleDelete = (rowId: string) => {
    setRows((prev) => prev.filter((r) => r.rowId !== rowId));
  };

  const handleAddLanguage = () => {
    const usedLanguages = new Set(rows.map((r) => r.language));
    const available = DICTATION_LANGUAGE_OPTIONS.find(
      ([value]) =>
        value !== KEYBOARD_LAYOUT_LANGUAGE && !usedLanguages.has(value),
    );
    const language = available
      ? available[0]
      : DICTATION_LANGUAGE_OPTIONS[1][0];
    setRows((prev) => [
      ...prev,
      { rowId: createId(), language, hotkeyKeys: [] },
    ]);
  };

  const handleSave = async () => {
    try {
      const [primaryRow, ...additionalRows] = rows;

      if (primaryRow.language !== storePrimaryLanguage) {
        await setPreferredLanguage(primaryRow.language);
        await loadTones();
      }

      const state = useAppStore.getState();
      const existingPrimaryHotkey = Object.values(state.hotkeyById).find(
        (h) => h.actionName === DICTATE_HOTKEY,
      );
      const primaryHotkey: Hotkey = {
        id: existingPrimaryHotkey?.id ?? createId(),
        actionName: DICTATE_HOTKEY,
        keys: primaryRow.hotkeyKeys,
      };

      const existingAdditionalIds = Object.values(state.hotkeyById)
        .filter((h) =>
          h.actionName.startsWith(ADDITIONAL_LANGUAGE_HOTKEY_PREFIX),
        )
        .map((h) => h.id);

      const newAdditionalHotkeys: Hotkey[] = additionalRows.map((row) => ({
        id: createId(),
        actionName: getAdditionalLanguageActionName(row.language),
        keys: row.hotkeyKeys,
      }));

      produceAppState((draft) => {
        for (const id of existingAdditionalIds) {
          delete draft.hotkeyById[id];
          draft.settings.hotkeyIds = draft.settings.hotkeyIds.filter(
            (hid) => hid !== id,
          );
        }

        registerHotkeys(draft, [primaryHotkey, ...newAdditionalHotkeys]);
        for (const hotkey of [primaryHotkey, ...newAdditionalHotkeys]) {
          if (!draft.settings.hotkeyIds.includes(hotkey.id)) {
            draft.settings.hotkeyIds.push(hotkey.id);
          }
        }
      });

      const repo = getHotkeyRepo();
      for (const id of existingAdditionalIds) {
        await repo.deleteHotkey(id);
      }
      await repo.saveHotkey(primaryHotkey);
      for (const hotkey of newAdditionalHotkeys) {
        await repo.saveHotkey(hotkey);
      }
      await syncHotkeyCombosToNative();
    } catch (error) {
      showErrorSnackbar(error);
    }

    handleClose();
  };

  const hasHotkeyConflict = useMemo(() => {
    const filled = rows.filter((r) => r.hotkeyKeys.length > 0);
    for (let i = 0; i < filled.length; i++) {
      for (let j = i + 1; j < filled.length; j++) {
        const a = new Set(filled[i].hotkeyKeys);
        const b = new Set(filled[j].hotkeyKeys);
        const aSubsetOfB = [...a].every((k) => b.has(k));
        const bSubsetOfA = [...b].every((k) => a.has(k));
        if (aSubsetOfB || bSubsetOfA) return true;
      }
    }
    return false;
  }, [rows]);

  const canDelete = rows.length > 1;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Dictation language" />
          </DialogTitle>
          <DialogDescription>
            <FormattedMessage defaultMessage="Configure multiple dictation languages with hotkeys." />
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {hasHotkeyConflict && (
            <Alert variant="destructive">
              <RiAlertLine className="size-4" />
              <AlertDescription>
                <FormattedMessage defaultMessage="Some hotkeys share overlapping keys, which may cause conflicts." />
              </AlertDescription>
            </Alert>
          )}
          {rows.map((row) => (
            <DictationLanguageRow
              key={row.rowId}
              language={row.language}
              hotkeyKeys={row.hotkeyKeys}
              onLanguageChange={(lang) => handleLanguageChange(row.rowId, lang)}
              onHotkeyChange={(keys) => handleHotkeyChange(row.rowId, keys)}
              onDelete={() => handleDelete(row.rowId)}
              canDelete={canDelete}
            />
          ))}
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={handleAddLanguage}>
              <RiAddLine className="mr-1 size-3.5" />
              <FormattedMessage defaultMessage="Add language" />
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <FormattedMessage defaultMessage="Cancel" />
          </Button>
          <Button onClick={() => void handleSave()}>
            <FormattedMessage defaultMessage="Save" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
