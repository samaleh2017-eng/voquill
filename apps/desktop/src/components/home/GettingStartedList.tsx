import {
  RiCheckboxCircleFill,
  RiCheckboxBlankCircleLine,
  RiInformationLine,
} from "@remixicon/react";
import dayjs from "dayjs";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useLocalStorage } from "../../hooks/local-storage.hooks";
import { useAppStore } from "../../store";
import { getMyUser } from "../../utils/user.utils";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StorageImageInline } from "@/components/ui/storage-image";

type ChecklistItem = {
  label: string;
  info: string;
  done: boolean;
  extra?: React.ReactNode;
};

function AppIconBoxes({ iconPaths }: { iconPaths: (string | null)[] }) {
  const slots = [
    iconPaths[0] ?? null,
    iconPaths[1] ?? null,
    iconPaths[2] ?? null,
  ];

  return (
    <div className="flex flex-row gap-1.5">
      {slots.map((path, i) => (
        <div
          key={i}
          className={`flex size-9 items-center justify-center overflow-hidden rounded-md bg-muted ${path ? "ring-1.5 ring-primary" : ""}`}
        >
          {path && <StorageImageInline path={path} size={36} />}
        </div>
      ))}
    </div>
  );
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  return (
    <div className="flex items-center gap-3 rounded-md px-1 py-2.5 transition-colors hover:bg-accent/50">
      {item.done ? (
        <RiCheckboxCircleFill className="size-5 shrink-0 text-primary" />
      ) : (
        <RiCheckboxBlankCircleLine className="size-5 shrink-0 text-muted-foreground/40" />
      )}
      <span
        className={`text-sm ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}
      >
        {item.label}
      </span>
      {item.extra}
      <div className="flex-1" />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="shrink-0">
              <RiInformationLine className="size-4 cursor-help text-muted-foreground/40" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {item.info}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export function GettingStartedList() {
  const intl = useIntl();
  const onboardedAt = useAppStore((state) => getMyUser(state)?.onboardedAt);
  const [isDismissed, setDismissed] = useLocalStorage(
    "voquill:checklist-dismissed",
    false,
  );
  const [hasAddedDictionaryWord] = useLocalStorage(
    "voquill:checklist-dictionary",
    false,
  );
  const [hasSelectedWritingStyle] = useLocalStorage(
    "voquill:checklist-writing-style",
    false,
  );
  const appTargetById = useAppStore((state) => state.appTargetById);

  const appTargetEntries = useMemo(
    () => Object.values(appTargetById),
    [appTargetById],
  );
  const appCount = appTargetEntries.length;
  const appsComplete = appCount >= 3;

  const iconPaths = useMemo(
    () => appTargetEntries.slice(0, 3).map((t) => t.iconPath ?? null),
    [appTargetEntries],
  );

  const checklist: ChecklistItem[] = [
    {
      label: intl.formatMessage({
        defaultMessage: "Use Voquill in 3 different apps",
      }),
      info: intl.formatMessage({
        defaultMessage:
          "Dictate text into 3 different applications. Voquill will detect each app automatically.",
      }),
      done: appsComplete,
      extra: <AppIconBoxes iconPaths={iconPaths} />,
    },
    {
      label: intl.formatMessage({
        defaultMessage: "Select a different writing style",
      }),
      info: intl.formatMessage({
        defaultMessage:
          "Go to the Styles page and choose a writing style to change how your dictation sounds.",
      }),
      done: hasSelectedWritingStyle,
    },
    {
      label: intl.formatMessage({
        defaultMessage: "Add a word to your dictionary",
      }),
      info: intl.formatMessage({
        defaultMessage:
          "Open the Dictionary page and add a glossary term or replacement rule.",
      }),
      done: hasAddedDictionaryWord,
    },
  ];

  const completedCount = checklist.filter((i) => i.done).length;
  const progress = (completedCount / checklist.length) * 100;
  const allDone = completedCount === checklist.length;

  const onboardedBeforeCutoff = useMemo(
    () => onboardedAt && dayjs(onboardedAt).isBefore("2026-02-12"),
    [onboardedAt],
  );

  if (isDismissed || allDone || onboardedBeforeCutoff) {
    return null;
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="text-base font-semibold text-foreground">
            <FormattedMessage defaultMessage="Getting started" />
          </h2>
          <button
            className="text-xs text-muted-foreground hover:underline"
            onClick={() => setDismissed(true)}
          >
            <FormattedMessage defaultMessage="Skip" />
          </button>
        </div>
        <span className="text-xs text-muted-foreground">
          <FormattedMessage
            defaultMessage="{completed} of {total}"
            values={{ completed: completedCount, total: checklist.length }}
          />
        </span>
      </div>
      <Progress value={progress} className="mb-2 h-1.5" />
      <div className="flex flex-col">
        {checklist.map((item) => (
          <ChecklistRow key={item.label} item={item} />
        ))}
      </div>
    </div>
  );
}
