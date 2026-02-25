import { RiKey2Line } from "@remixicon/react";
import type { OidcProvider } from "@repo/types";
import { submitSignInWithSso } from "../../actions/login.actions";
import { useAppStore } from "../../store";
import { Button } from "@/components/ui/button";

type SsoButtonProps = {
  provider: OidcProvider;
};

export const SsoButton = ({ provider }: SsoButtonProps) => {
  const loading = useAppStore((state) => state.login.status === "loading");

  return (
    <Button
      className="w-full"
      variant="outline"
      disabled={loading}
      onClick={() => submitSignInWithSso(provider.id)}
    >
      <RiKey2Line className="size-4" />
      {provider.name}
    </Button>
  );
};
