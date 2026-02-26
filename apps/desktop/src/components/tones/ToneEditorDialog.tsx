import { RiDeleteBinLine, RiSaveLine, RiLoader4Line } from "@remixicon/react";
import { Tone } from "@repo/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import { setAppTargetTone } from "../../actions/app-target.actions";
import {
  closeToneEditorDialog,
  deleteTone,
  upsertTone,
} from "../../actions/tone.actions";
import { useAppStore } from "../../store";
import { createId } from "../../utils/id.utils";
import { ConfirmDialog } from "../common/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MAX_PROMPT_LEN = 8000;

export const ToneEditorDialog = () => {
  const toneEditor = useAppStore((state) => state.toneEditor);
  const toneById = useAppStore((state) => state.toneById);

  const tones = useMemo(
    () =>
      Object.values(toneById).sort(
        (left, right) => left.sortOrder - right.sortOrder,
      ),
    [toneById],
  );

  const editingTone: Tone | null = toneEditor.toneId
    ? (toneById[toneEditor.toneId] ?? null)
    : null;

  const handleClose = useCallback(() => {
    closeToneEditorDialog();
  }, []);

  const handleCreate = useCallback(
    async (name: string, promptTemplate: string) => {
      const nextSortOrder =
        tones.length > 0 ? tones[tones.length - 1].sortOrder + 1 : 0;

      const newTone: Tone = {
        id: createId(),
        name,
        promptTemplate,
        isSystem: false,
        createdAt: Date.now(),
        sortOrder: nextSortOrder,
      };

      await upsertTone(newTone);

      if (toneEditor.targetId) {
        await setAppTargetTone(toneEditor.targetId, newTone.id);
      }
    },
    [tones, toneEditor.targetId],
  );

  const handleEditSave = useCallback(async (toneToSave: Tone) => {
    await upsertTone(toneToSave);
  }, []);

  const handleDelete = useCallback(async (toneId: string) => {
    await deleteTone(toneId);
  }, []);

  const isEditMode = toneEditor.mode === "edit" && !!editingTone;
  const tone = isEditMode && editingTone ? editingTone : null;
  const [name, setName] = useState("");
  const [promptTemplate, setPromptTemplate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (isEditMode && tone) {
      setName(tone.name);
      setPromptTemplate(tone.promptTemplate);
    } else if (toneEditor.mode === "create") {
      setName("");
      setPromptTemplate("");
    }
  }, [isEditMode, tone, toneEditor.mode, toneEditor.open]);

  useEffect(() => {
    if (!toneEditor.open) {
      setIsConfirmOpen(false);
    }
  }, [toneEditor.open]);

  const hasChanges =
    isEditMode &&
    tone &&
    (name !== tone.name || promptTemplate !== tone.promptTemplate);

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedPrompt = promptTemplate.trim();

    if (!trimmedName || !trimmedPrompt) {
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && tone) {
        await handleEditSave({
          ...tone,
          name: trimmedName,
          promptTemplate: trimmedPrompt,
        });
      } else {
        await handleCreate(trimmedName, trimmedPrompt);
      }
      handleClose();
    } finally {
      setIsSaving(false);
    }
  }, [
    name,
    promptTemplate,
    isEditMode,
    tone,
    handleEditSave,
    handleCreate,
    handleClose,
  ]);

  const handleDeleteTone = useCallback(async () => {
    if (!isEditMode || !tone) {
      return;
    }

    setIsConfirmOpen(false);
    setIsDeleting(true);
    try {
      await handleDelete(tone.id);
      handleClose();
    } finally {
      setIsDeleting(false);
    }
  }, [isEditMode, tone, handleDelete, handleClose]);

  const handleOpenDeleteConfirm = useCallback(() => {
    if (!isEditMode || !tone || tone.isSystem) {
      return;
    }

    setIsConfirmOpen(true);
  }, [isEditMode, tone]);

  const handleCancelDelete = useCallback(() => {
    setIsConfirmOpen(false);
  }, []);

  const handleCancel = useCallback(() => {
    if (isEditMode && tone) {
      setName(tone.name);
      setPromptTemplate(tone.promptTemplate);
    }
    handleClose();
  }, [isEditMode, tone, handleClose]);

  const title = useMemo(
    () =>
      isEditMode ? (
        <FormattedMessage defaultMessage="Edit style" />
      ) : (
        <FormattedMessage defaultMessage="Create style" />
      ),
    [isEditMode],
  );

  return (
    <>
      <Dialog open={toneEditor.open} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-6 min-h-[320px] py-2">
            <div className="space-y-1.5">
              <Label><FormattedMessage defaultMessage="Name" /></Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Casual, Formal, Business..."
                maxLength={120}
              />
            </div>

            <div className="space-y-1.5">
              <Label><FormattedMessage defaultMessage="Prompt" /></Label>
              <Textarea
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
                rows={7}
                placeholder="Make it sound like a professional but friendly email. Use jargon and fun words."
                maxLength={MAX_PROMPT_LEN}
              />
              <p className="text-xs text-muted-foreground">
                {promptTemplate.length}/{MAX_PROMPT_LEN}
              </p>
            </div>
          </div>

          <DialogFooter className="flex-row justify-between sm:justify-between">
            {isEditMode && (
              <Button
                variant="ghost"
                onClick={handleOpenDeleteConfirm}
                disabled={isDeleting}
                className="text-amber-600 hover:text-amber-700"
              >
                <RiDeleteBinLine className="mr-2 h-4 w-4" />
                <FormattedMessage defaultMessage="Delete" />
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="ghost" onClick={handleCancel}>
                <FormattedMessage defaultMessage="Cancel" />
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  isSaving ||
                  !name.trim() ||
                  !promptTemplate.trim() ||
                  (isEditMode && !hasChanges)
                }
              >
                {isSaving && <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />}
                <RiSaveLine className="mr-2 h-4 w-4" />
                {isEditMode ? (
                  <FormattedMessage defaultMessage="Save changes" />
                ) : (
                  <FormattedMessage defaultMessage="Create" />
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={<FormattedMessage defaultMessage="Delete style" />}
        content={
          <FormattedMessage defaultMessage="Are you sure you want to delete this style?" />
        }
        onCancel={handleCancelDelete}
        onConfirm={handleDeleteTone}
        confirmLabel={<FormattedMessage defaultMessage="Delete" />}
        confirmButtonProps={{ variant: "destructive", disabled: isDeleting }}
      />
    </>
  );
};
