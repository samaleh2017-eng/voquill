import { RiAddLine, RiText, RiFindReplaceLine } from "@remixicon/react";
import { Term } from "@repo/types";
import dayjs from "dayjs";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { showErrorSnackbar } from "../../actions/app.actions";
import { loadDictionary } from "../../actions/dictionary.actions";
import { setLocalStorageValue } from "../../actions/local-storage.actions";
import { useAsyncEffect } from "../../hooks/async.hooks";
import { getTermRepo } from "../../repos";
import { produceAppState, useAppStore } from "../../store";
import { createId } from "../../utils/id.utils";
import { VirtualizedListPage } from "../ui/virtualized-list-page";
import { DictionaryRow } from "./DictionaryRow";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DictionaryPage() {
  const termIds = useAppStore((state) => state.dictionary.termIds);

  useAsyncEffect(async () => {
    await loadDictionary();
  }, []);

  const handleAddTerm = useCallback(async (replacement: boolean) => {
    const newTerm: Term = {
      id: createId(),
      createdAt: dayjs().toISOString(),
      sourceValue: "",
      destinationValue: "",
      isReplacement: replacement,
    };

    produceAppState((draft) => {
      draft.termById[newTerm.id] = newTerm;
      draft.dictionary.termIds = [newTerm.id, ...draft.dictionary.termIds];
    });

    try {
      const created = await getTermRepo().createTerm(newTerm);
      produceAppState((draft) => {
        draft.termById[created.id] = created;
      });
      setLocalStorageValue("voquill:checklist-dictionary", true);
    } catch (error) {
      produceAppState((draft) => {
        delete draft.termById[newTerm.id];
        draft.dictionary.termIds = draft.dictionary.termIds.filter(
          (termId) => termId !== newTerm.id,
        );
      });
      showErrorSnackbar(error);
    }
  }, []);

  const addButton = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <RiAddLine className="size-4" />
          <FormattedMessage defaultMessage="Add" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleAddTerm(false)}>
          <RiText className="mr-2 size-4" />
          <FormattedMessage defaultMessage="Glossary term" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAddTerm(true)}>
          <RiFindReplaceLine className="mr-2 size-4" />
          <FormattedMessage defaultMessage="Replacement rule" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <VirtualizedListPage
      title={<FormattedMessage defaultMessage="Dictionary" />}
      subtitle={
        <FormattedMessage defaultMessage="Voquill may misunderstand you on occasion. If you see certain words being missed frequently, you can define a replacement rule here to fix the spelling automatically." />
      }
      action={addButton}
      items={termIds}
      computeItemKey={(id) => id}
      heightMult={10}
      renderItem={(id) => <DictionaryRow key={id} id={id} />}
    />
  );
}
