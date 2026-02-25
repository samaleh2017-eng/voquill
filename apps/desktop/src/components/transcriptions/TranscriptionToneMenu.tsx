import type { Tone } from "@repo/types";
import { getRec } from "@repo/utilities";
import { useCallback } from "react";
import { useAppStore } from "../../store";
import { getSortedToneIds } from "../../utils/tone.utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TranscriptionToneMenuProps = {
  children: (args: {
    ref: React.RefCallback<HTMLElement | null>;
    isOpen: boolean;
    open: () => void;
    close: () => void;
  }) => React.ReactNode;
  onToneSelect: (toneId: string | null) => void;
};

export const TranscriptionToneMenu = ({
  children,
  onToneSelect,
}: TranscriptionToneMenuProps) => {
  const tones = useAppStore((state) => {
    const toneIds = getSortedToneIds(state);
    return toneIds
      .map((toneId) => getRec(state.toneById, toneId))
      .filter((tone): tone is Tone => tone !== null);
  });

  const handleToneSelect = useCallback(
    (toneId: string | null) => {
      onToneSelect(toneId);
    },
    [onToneSelect],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children({
          ref: () => {},
          isOpen: false,
          open: () => {},
          close: () => {},
        })}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-[300px] overflow-y-auto">
        {tones.map((tone) => (
          <DropdownMenuItem
            key={tone.id}
            onClick={() => handleToneSelect(tone.id)}
          >
            {tone.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
