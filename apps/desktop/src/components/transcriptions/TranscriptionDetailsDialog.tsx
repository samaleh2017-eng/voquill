import { RiLoopLeftLine } from "@remixicon/react";
import { getRec } from "@repo/utilities";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { showErrorSnackbar } from "../../actions/app.actions";
import {
  closeTranscriptionDetailsDialog,
  retranscribeTranscription,
} from "../../actions/transcriptions.actions";
import { AppState } from "../../state/app.state";
import { useAppStore } from "../../store";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TranscriptionToneMenu } from "./TranscriptionToneMenu";

const formatModelSizeLabel = (
  modelSize?: string | null,
  unknownLabel: React.ReactNode = "Unknown",
): React.ReactNode => {
  const value = modelSize?.trim();
  if (!value) return unknownLabel;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

function TextBlock({
  label,
  value,
  placeholder,
  monospace,
}: {
  label: React.ReactNode;
  value: string | null | undefined;
  placeholder?: React.ReactNode;
  monospace?: boolean;
}) {
  const normalized = value?.trim();

  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      {normalized ? (
        <div className="mt-1 rounded-md bg-muted p-2">
          <p
            className={`whitespace-pre-wrap break-words text-sm text-foreground ${monospace ? "font-mono" : ""}`}
          >
            {normalized}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {placeholder ?? <FormattedMessage defaultMessage="Not provided." />}
        </p>
      )}
    </div>
  );
}

function MetaField({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

const resolveApiKeyLabel = (
  records: AppState["apiKeyById"],
  apiKeyId: string | null | undefined,
  noneLabel: string,
  unknownLabel: string,
): string => {
  if (!apiKeyId) return noneLabel;
  const record = records[apiKeyId];
  if (!record) return unknownLabel;
  const suffix = record.keySuffix?.trim();
  if (suffix && suffix.length > 0) return `${record.name} (••••${suffix})`;
  return record.name;
};

export const TranscriptionDetailsDialog = () => {
  const open = useAppStore((state) => state.transcriptions.detailsDialogOpen);
  const transcription = useAppStore((state) => {
    const transcriptionId = state.transcriptions.detailsDialogTranscriptionId;
    if (!transcriptionId) return null;
    return getRec(state.transcriptionById, transcriptionId);
  });
  const apiKeysById = useAppStore((state) => state.apiKeyById);
  const intl = useIntl();
  const [isRetranscribing, setIsRetranscribing] = useState(false);

  const handleClose = useCallback(() => {
    closeTranscriptionDetailsDialog();
  }, []);

  const handleRetranscribe = useCallback(
    async (toneId: string | null) => {
      if (!transcription?.id) {
        showErrorSnackbar(
          intl.formatMessage({
            defaultMessage: "Unable to load transcription details.",
          }),
        );
        return;
      }
      try {
        setIsRetranscribing(true);
        await retranscribeTranscription({
          transcriptionId: transcription.id,
          toneId,
        });
      } catch (error) {
        const fallbackMessage = intl.formatMessage({
          defaultMessage: "Unable to retranscribe audio snippet.",
        });
        const message =
          error instanceof Error ? error.message : fallbackMessage;
        showErrorSnackbar(message || fallbackMessage);
      } finally {
        setIsRetranscribing(false);
      }
    },
    [intl, transcription?.id],
  );

  const transcriptionModeLabel = useMemo(() => {
    if (transcription?.transcriptionMode === "api")
      return <FormattedMessage defaultMessage="API" />;
    if (transcription?.transcriptionMode === "cloud")
      return <FormattedMessage defaultMessage="Voquill Cloud" />;
    if (transcription?.transcriptionMode === "local")
      return <FormattedMessage defaultMessage="Local" />;
    return <FormattedMessage defaultMessage="Unknown" />;
  }, [transcription?.transcriptionMode]);

  const transcriptionApiKeyLabel = useMemo(
    () =>
      resolveApiKeyLabel(
        apiKeysById,
        transcription?.transcriptionApiKeyId,
        "None",
        "Unknown",
      ),
    [apiKeysById, transcription?.transcriptionApiKeyId],
  );

  const postProcessModeLabel = useMemo(() => {
    if (transcription?.postProcessMode === "api")
      return <FormattedMessage defaultMessage="API" />;
    if (transcription?.postProcessMode === "cloud")
      return <FormattedMessage defaultMessage="Voquill Cloud" />;
    return <FormattedMessage defaultMessage="Disabled" />;
  }, [transcription?.postProcessMode]);

  const postProcessApiKeyLabel = useMemo(
    () =>
      resolveApiKeyLabel(
        apiKeysById,
        transcription?.postProcessApiKeyId,
        "None",
        "Unknown",
      ),
    [apiKeysById, transcription?.postProcessApiKeyId],
  );

  const modelSizeLabel = useMemo(
    () => formatModelSizeLabel(transcription?.modelSize ?? null, "Unknown"),
    [transcription?.modelSize],
  );

  const deviceLabel = useMemo(() => {
    const value = transcription?.inferenceDevice?.trim();
    return value && value.length > 0 ? (
      value
    ) : (
      <FormattedMessage defaultMessage="Unknown" />
    );
  }, [transcription?.inferenceDevice]);

  const postProcessDeviceLabel = useMemo(() => {
    const value = transcription?.postProcessDevice?.trim();
    return value && value.length > 0 ? (
      value
    ) : (
      <FormattedMessage defaultMessage="Unknown" />
    );
  }, [transcription?.postProcessDevice]);

  const transcriptionPrompt = useMemo(() => {
    const prompt = transcription?.transcriptionPrompt?.trim();
    return prompt && prompt.length > 0 ? prompt : null;
  }, [transcription?.transcriptionPrompt]);

  const rawTranscriptText = useMemo(
    () => transcription?.rawTranscript ?? transcription?.transcript ?? "",
    [transcription?.rawTranscript, transcription?.transcript],
  );

  const sanitizedTranscriptText = useMemo(
    () => transcription?.sanitizedTranscript ?? null,
    [transcription?.sanitizedTranscript],
  );

  const postProcessPrompt = useMemo(() => {
    let prompt = transcription?.postProcessPrompt?.trim() ?? "";
    if (rawTranscriptText)
      prompt = prompt.replace(rawTranscriptText.trim(), "<transcript>");
    return prompt && prompt.length > 0 ? prompt : null;
  }, [transcription?.postProcessPrompt, rawTranscriptText]);

  const finalTranscriptText = transcription?.transcript ?? "";

  const transcriptionDurationLabel = useMemo(() => {
    const ms = transcription?.transcriptionDurationMs;
    if (ms == null) return null;
    return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
  }, [transcription?.transcriptionDurationMs]);

  const postprocessDurationLabel = useMemo(() => {
    const ms = transcription?.postprocessDurationMs;
    if (ms == null) return null;
    return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
  }, [transcription?.postprocessDurationMs]);

  const warnings = useMemo(() => {
    if (!transcription?.warnings) return [];
    return transcription.warnings
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
  }, [transcription?.warnings]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Transcription Details" />
          </DialogTitle>
        </DialogHeader>

        {transcription ? (
          <div className="flex flex-col gap-6">
            <div>
              <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                <FormattedMessage defaultMessage="Outputs" />
              </span>
              <div className="mt-2 flex flex-col gap-3">
                <TextBlock
                  label={
                    <FormattedMessage defaultMessage="Raw transcription" />
                  }
                  value={rawTranscriptText}
                  placeholder={
                    <FormattedMessage defaultMessage="Raw transcript unavailable." />
                  }
                  monospace
                />
                {sanitizedTranscriptText && (
                  <TextBlock
                    label={
                      <FormattedMessage defaultMessage="After replacements" />
                    }
                    value={sanitizedTranscriptText}
                    monospace
                  />
                )}
                <TextBlock
                  label={
                    <FormattedMessage defaultMessage="Final transcription" />
                  }
                  value={finalTranscriptText}
                  placeholder={
                    <FormattedMessage defaultMessage="Final transcript unavailable." />
                  }
                  monospace
                />
              </div>
            </div>

            {warnings.length > 0 && (
              <>
                <Separator />
                <div>
                  <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                    <FormattedMessage defaultMessage="Warnings" />
                  </span>
                  <div className="mt-2 flex flex-col gap-2">
                    {warnings.map((warning, index) => (
                      <div
                        key={`warning-${index}`}
                        className="rounded-md bg-muted p-2"
                      >
                        <p className="text-sm text-amber-500">{warning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {(transcriptionDurationLabel || postprocessDurationLabel) && (
              <>
                <Separator />
                <div>
                  <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                    <FormattedMessage defaultMessage="Performance" />
                  </span>
                  <div className="mt-2 flex flex-col gap-3">
                    {transcriptionDurationLabel && (
                      <MetaField
                        label={
                          <FormattedMessage defaultMessage="Transcription Duration" />
                        }
                        value={transcriptionDurationLabel}
                      />
                    )}
                    {postprocessDurationLabel && (
                      <MetaField
                        label={
                          <FormattedMessage defaultMessage="Post-processing Duration" />
                        }
                        value={postprocessDurationLabel}
                      />
                    )}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div>
              <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                <FormattedMessage defaultMessage="Transcription Step" />
              </span>
              <div className="mt-2 flex flex-col gap-3">
                <MetaField
                  label={<FormattedMessage defaultMessage="Mode" />}
                  value={transcriptionModeLabel}
                />
                <MetaField
                  label={<FormattedMessage defaultMessage="Device" />}
                  value={deviceLabel}
                />
                <MetaField
                  label={<FormattedMessage defaultMessage="Model Size" />}
                  value={modelSizeLabel}
                />
                <MetaField
                  label={<FormattedMessage defaultMessage="API Key" />}
                  value={transcriptionApiKeyLabel}
                />
                <TextBlock
                  label={<FormattedMessage defaultMessage="Prompt" />}
                  value={transcriptionPrompt}
                  placeholder={
                    <FormattedMessage defaultMessage="No custom prompt applied." />
                  }
                  monospace
                />
              </div>
            </div>

            <Separator />

            <div>
              <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                <FormattedMessage defaultMessage="Post-processing Step" />
              </span>
              <div className="mt-2 flex flex-col gap-3">
                <MetaField
                  label={<FormattedMessage defaultMessage="Mode" />}
                  value={postProcessModeLabel}
                />
                <MetaField
                  label={<FormattedMessage defaultMessage="Processor" />}
                  value={postProcessDeviceLabel}
                />
                <MetaField
                  label={<FormattedMessage defaultMessage="API Key" />}
                  value={postProcessApiKeyLabel}
                />
                <TextBlock
                  label={<FormattedMessage defaultMessage="Prompt" />}
                  value={postProcessPrompt}
                  placeholder={
                    <FormattedMessage defaultMessage="No LLM post-processing was applied." />
                  }
                  monospace
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <FormattedMessage defaultMessage="Metadata unavailable for this transcription." />
          </p>
        )}

        <DialogFooter>
          <TranscriptionToneMenu onToneSelect={handleRetranscribe}>
            {({ ref, open }) => (
              <Button
                ref={ref as React.Ref<HTMLButtonElement>}
                variant="ghost"
                onClick={open}
                disabled={isRetranscribing || !transcription}
                className="gap-1.5"
              >
                <RiLoopLeftLine className="size-4" />
                <FormattedMessage defaultMessage="Retranscribe" />
              </Button>
            )}
          </TranscriptionToneMenu>
          <Button variant="outline" onClick={handleClose}>
            <FormattedMessage defaultMessage="Close" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
