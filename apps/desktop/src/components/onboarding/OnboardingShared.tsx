import { cn } from "@/lib/utils";

export type FormContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export const FormContainer = ({ children, className }: FormContainerProps) => {
  return (
    <div className={cn("max-h-full w-full max-w-[500px] p-2", className)}>
      {children}
    </div>
  );
};
