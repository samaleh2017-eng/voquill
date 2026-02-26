import {
  RiArrowRightLine,
  RiDeleteBinLine,
  RiGlobalLine,
} from "@remixicon/react";
import { getRec } from "@repo/utilities";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { showErrorSnackbar } from "../../actions/app.actions";
import { getTermRepo } from "../../repos";
import { getAppState, produceAppState, useAppStore } from "../../store";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type DictionaryRowProps = {
  id: string;
};

export const DictionaryRow = ({ id }: DictionaryRowProps) => {
  const intl = useIntl();
  const term = useAppStore((state) => getRec(state.termById, id));
  const [sourceValue, setSourceValue] = useState(term?.sourceValue ?? "");
  const [destinationValue, setDestinationValue] = useState(
    term?.destinationValue ?? "",
  );
  const isReplacement = term?.isReplacement ?? true;
  const isGlobal = term?.isGlobal ?? false;

  useEffect(() => {
    setSourceValue(term?.sourceValue ?? "");
    setDestinationValue(term?.destinationValue ?? "");
  }, [term?.sourceValue, term?.destinationValue]);

  const handleFieldChange =
    (field: "source" | "destination") =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (field === "source") setSourceValue(event.target.value);
      else setDestinationValue(event.target.value);
    };

  const handleCommit = useCallback(async () => {
    if (!term) return;
    if (
      term.sourceValue === sourceValue &&
      term.destinationValue === destinationValue
    )
      return;

    const previousTerm = term;
    const updatedTerm = { ...term, sourceValue, destinationValue };

    produceAppState((draft) => {
      draft.termById[id] = updatedTerm;
    });

    try {
      await getTermRepo().updateTerm(updatedTerm);
    } catch (error) {
      produceAppState((draft) => {
        draft.termById[id] = previousTerm;
      });
      setSourceValue(previousTerm.sourceValue);
      setDestinationValue(previousTerm.destinationValue);
      showErrorSnackbar(error);
    }
  }, [destinationValue, id, sourceValue, term]);

  const handleDelete = useCallback(async () => {
    if (!term) return;

    const previousTerm = term;
    const previousIds = [...getAppState().dictionary.termIds];

    produceAppState((draft) => {
      delete draft.termById[id];
      draft.dictionary.termIds = draft.dictionary.termIds.filter(
        (termId) => termId !== id,
      );
    });

    try {
      await getTermRepo().deleteTerm(id);
    } catch (error) {
      produceAppState((draft) => {
        draft.termById[id] = previousTerm;
        draft.dictionary.termIds = previousIds;
      });
      setSourceValue(previousTerm.sourceValue);
      setDestinationValue(previousTerm.destinationValue);
      showErrorSnackbar(error);
    }
  }, [id, term]);

  if (!term) return null;

  return (
    <div className="flex items-center gap-3 py-2">
      <Input
        placeholder={
          isReplacement
            ? intl.formatMessage({ defaultMessage: "Original" })
            : intl.formatMessage({ defaultMessage: "Glossary term" })
        }
        value={sourceValue}
        onChange={handleFieldChange("source")}
        onBlur={handleCommit}
        disabled={isGlobal}
        className={`flex-1 ${!isGlobal && sourceValue.trim() === "" ? "border-destructive" : ""}`}
      />
      {isReplacement ? (
        <>
          <RiArrowRightLine className="size-4 shrink-0 text-muted-foreground" />
          <textarea
            placeholder={intl.formatMessage({
              defaultMessage: "Replacement",
            })}
            value={destinationValue}
            onChange={handleFieldChange("destination")}
            onBlur={handleCommit}
            disabled={isGlobal}
            rows={1}
            className={`flex min-h-9 flex-1 rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${!isGlobal && destinationValue.trim() === "" ? "border-destructive" : "border-input"}`}
          />
        </>
      ) : null}
      {isGlobal ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <button
                  disabled
                  className="rounded-md p-1.5 text-muted-foreground opacity-50"
                >
                  <RiGlobalLine className="size-4" />
                </button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <FormattedMessage defaultMessage="This term is managed by your organization." />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <button
          aria-label={intl.formatMessage(
            { defaultMessage: "Delete dictionary item {term}" },
            { term: term.sourceValue },
          )}
          onClick={handleDelete}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <RiDeleteBinLine className="size-4" />
        </button>
      )}
    </div>
  );
};
