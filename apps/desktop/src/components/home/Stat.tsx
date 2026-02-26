export type StatProps = {
  label: string;
  value: number;
};

export const Stat = ({ label, value }: StatProps) => {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="text-3xl font-bold tracking-tight text-foreground">
        {value.toLocaleString()}
      </span>
      <span className="text-base text-muted-foreground">{label}</span>
    </div>
  );
};
