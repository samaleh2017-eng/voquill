import { RiLoader4Line } from "@remixicon/react";

export const LoadingApp = () => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <RiLoader4Line className="size-8 animate-spin text-primary" />
    </div>
  );
};
