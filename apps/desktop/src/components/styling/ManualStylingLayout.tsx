import { FormattedMessage } from "react-intl";
import { loadTones } from "../../actions/tone.actions";
import { useAsyncEffect } from "../../hooks/async.hooks";
import { produceAppState, useAppStore } from "../../store";
import {
  getHotkeyCombosForAction,
  SWITCH_WRITING_STYLE_HOTKEY,
} from "../../utils/keyboard.utils";
import { getActiveManualToneIds } from "../../utils/tone.utils";
import { HotkeyBadgeInline } from "@/components/ui/hotkey-badge";
import { VirtualizedListPage } from "../ui/virtualized-list-page";
import { ManualAddStyle } from "./ManualAddStyle";
import { ManualStylingRow } from "./ManualStylingRow";

function StylingSubtitle() {
  const combos = useAppStore((state) =>
    getHotkeyCombosForAction(state, SWITCH_WRITING_STYLE_HOTKEY),
  );

  const openShortcuts = () =>
    produceAppState((draft) => {
      draft.settings.shortcutsDialogOpen = true;
    });

  if (combos.length === 0) {
    return (
      <FormattedMessage
        defaultMessage="Choose different writing styles to change how you sound. You can also <link>set up a hotkey</link> to switch between them faster."
        values={{
          link: (chunks: React.ReactNode) => (
            <button
              className="text-sm text-primary underline-offset-2 hover:underline"
              onClick={openShortcuts}
            >
              {chunks}
            </button>
          ),
        }}
      />
    );
  }

  const hotkey = (
    <HotkeyBadgeInline
      keys={combos[0]}
      onClick={openShortcuts}
      className="mx-0.5"
    />
  );

  return (
    <FormattedMessage
      defaultMessage="Choose different writing styles to change how you sound. Switch between them using the {hotkey} hotkey."
      values={{ hotkey }}
    />
  );
}

export function ManualStylingLayout() {
  useAsyncEffect(async () => {
    await loadTones();
  }, []);

  const toneIds = useAppStore((state) => getActiveManualToneIds(state));

  return (
    <VirtualizedListPage
      title={<FormattedMessage defaultMessage="Writing Styles" />}
      heightMult={7}
      subtitle={<StylingSubtitle />}
      action={<ManualAddStyle />}
      items={toneIds}
      computeItemKey={(id) => id}
      renderItem={(id) => <ManualStylingRow key={id} id={id} />}
      emptyState={
        <div className="mx-auto flex w-[300px] flex-col items-start gap-2 self-center">
          <h3 className="text-base font-semibold text-foreground">
            <FormattedMessage defaultMessage="No styles yet" />
          </h3>
          <p className="text-sm text-muted-foreground">
            <FormattedMessage defaultMessage="Create a style to customize how your voice transcriptions are formatted and refined." />
          </p>
        </div>
      }
    />
  );
}
