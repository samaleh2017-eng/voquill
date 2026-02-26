import type { Tone } from "@repo/types";
import { getRec } from "@repo/utilities";
import { useCallback, useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { showErrorSnackbar } from "../../actions/app.actions";
import {
  closeRetranscribeDialog,
  retranscribeTranscription,
} from "../../actions/transcriptions.actions";
import { produceAppState, useAppStore } from "../../store";
import {
  DICTATION_LANGUAGES,
  type DictationLanguageCode,
  ORDERED_DICTATION_LANGUAGES,
} from "../../utils/language.utils";
import { getSortedToneIds } from "../../utils/tone.utils";
import { getMyDictationLanguage } from "../../utils/user.utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const languageOptions = ORDERED_DICTATION_LANGUAGES.map((code) => ({
  code,
  label: DICTATION_LANGUAGES[code],
}));

export const RetranscribeDialog = () => {
  const intl = useIntl();

  const open = useAppStore(
    (state) => state.transcriptions.retranscribeDialogOpen,
  );
  const transcriptionId = useAppStore(
    (state) => state.transcriptions.retranscribeDialogTranscriptionId,
  );

  const tones = useAppStore((state) => {
    const toneIds = getSortedToneIds(state);
    return toneIds
      .map((toneId) => getRec(state.toneById, toneId))
      .filter((tone): tone is Tone => tone !== null);
  });

  const defaultLanguage = useAppStore((state) => getMyDictationLanguage(state));

  const [selectedToneId, setSelectedToneId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] =
    useState<string>(defaultLanguage);

  useEffect(() => {
    if (open) {
      setSelectedToneId(tones[0]?.id ?? null);
      setSelectedLanguage(defaultLanguage);
    }
  }, [open, defaultLanguage, tones]);

  const handleSubmit = useCallback(async () => {
    if (!transcriptionId) return;

    closeRetranscribeDialog();

    produceAppState((draft) => {
      if (!draft.transcriptions.retranscribingIds.includes(transcriptionId)) {
        draft.transcriptions.retranscribingIds.push(transcriptionId);
      }
    });

    try {
      await retranscribeTranscription({
        transcriptionId,
        toneId: selectedToneId,
        languageCode: selectedLanguage,
      });
    } catch (error) {
      console.error("Failed to retranscribe audio", error);
      const fallbackMessage = intl.formatMessage({
        defaultMessage: "Unable to retranscribe audio snippet.",
      });
      const message = error instanceof Error ? error.message : fallbackMessage;
      showErrorSnackbar(message || fallbackMessage);
    } finally {
      produceAppState((draft) => {
        draft.transcriptions.retranscribingIds =
          draft.transcriptions.retranscribingIds.filter(
            (id) => id !== transcriptionId,
          );
      });
    }
  }, [transcriptionId, selectedToneId, selectedLanguage, intl]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) closeRetranscribeDialog();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Retranscribe" />
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="retranscribe-style">
              <FormattedMessage defaultMessage="Style" />
            </Label>
            <select
              id="retranscribe-style"
              value={selectedToneId ?? ""}
              onChange={(e) => setSelectedToneId(e.target.value || null)}
              className="flex h-9 w-full appearance-none rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {tones.map((tone) => (
                <option key={tone.id} value={tone.id}>
                  {tone.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="retranscribe-language">
              <FormattedMessage defaultMessage="Language" />
            </Label>
            <select
              id="retranscribe-language"
              value={selectedLanguage}
              onChange={(e) =>
                setSelectedLanguage(e.target.value as DictationLanguageCode)
              }
              className="flex h-9 w-full appearance-none rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {languageOptions.map(({ code, label }) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={closeRetranscribeDialog}>
            <FormattedMessage defaultMessage="Cancel" />
          </Button>
          <Button onClick={handleSubmit}>
            <FormattedMessage defaultMessage="Transcribe" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
