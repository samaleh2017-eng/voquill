import { Fragment } from "react";
import { FormattedMessage } from "react-intl";
import { useAppStore } from "../../store";
import {
  DICTATE_HOTKEY,
  getHotkeyCombosForAction,
} from "../../utils/keyboard.utils";
import { HotkeyBadge } from "./HotkeyBadge";

export const DictationInstruction = () => {
  const combos = useAppStore((state) =>
    getHotkeyCombosForAction(state, DICTATE_HOTKEY),
  );

  if (combos.length === 0) {
    return null;
  }

  const hotkeys = (
    <>
      {combos.map((combo, index) => {
        const key = combo.join("|");
        const isLast = index === combos.length - 1;
        const separator = (() => {
          if (isLast) {
            return "";
          }
          if (combos.length === 2) {
            return " or ";
          }
          if (index === combos.length - 2) {
            return ", or ";
          }
          return ", ";
        })();

        return (
          <Fragment key={key}>
            <HotkeyBadge keys={combo} className="mx-0.5" />
            {separator}
          </Fragment>
        );
      })}
    </>
  );

  return (
    <p className="text-sm text-muted-foreground">
      {combos.length === 1 ? (
        <FormattedMessage
          defaultMessage="Press {hotkeys} to dictate anywhere."
          values={{ hotkeys }}
        />
      ) : (
        <FormattedMessage
          defaultMessage="Press one of {hotkeys} to dictate anywhere."
          values={{ hotkeys }}
        />
      )}
    </p>
  );
};
