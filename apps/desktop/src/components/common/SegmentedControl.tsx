import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type SegmentedControlOption<Value extends string> = {
  value: Value;
  label: string;
  disabled?: boolean;
};

export type SegmentedControlProps<Value extends string> = {
  value: Value;
  options: SegmentedControlOption<Value>[];
  onChange: (value: Value) => void;
  ariaLabel?: string;
  className?: string;
};

export const SegmentedControl = <Value extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<Value>) => {
  const activeCandidate = options.find(
    (option) => option.value === value && !option.disabled,
  );
  const fallback = options.find((option) => !option.disabled);
  const activeValue = activeCandidate?.value ?? fallback?.value ?? value;

  return (
    <Tabs
      value={activeValue}
      onValueChange={(v) => {
        const option = options.find((o) => o.value === v);
        if (option && !option.disabled && option.value !== value) {
          onChange(option.value as Value);
        }
      }}
      className={cn("w-auto", className)}
    >
      <TabsList aria-label={ariaLabel}>
        {options.map((option) => (
          <TabsTrigger
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
