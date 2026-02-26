import { RiGoogleFill, RiKey2Line } from "@remixicon/react";
import { FormattedMessage } from "react-intl";
import {
  submitSignInWithGoogle,
  submitSignInWithSso,
} from "../../actions/login.actions";
import { useAppStore } from "../../store";
import { Button } from "@/components/ui/button";

type OidcProvidersProps = {
  onBeforeSignIn?: () => void;
  variant?: "outlined" | "contained";
};

export const OidcProviders = ({
  onBeforeSignIn,
  variant = "outlined",
}: OidcProvidersProps) => {
  const isEnterprise = useAppStore((state) => state.isEnterprise);
  const oidcProviders = useAppStore((state) => state.oidcProviders);
  const loading = useAppStore((state) => state.login.status === "loading");

  const handleGoogleClick = () => {
    onBeforeSignIn?.();
    submitSignInWithGoogle();
  };

  const handleSsoClick = (providerId: string) => {
    onBeforeSignIn?.();
    submitSignInWithSso(providerId);
  };

  const buttonVariant = variant === "contained" ? "default" : "outline";

  if (!isEnterprise) {
    return (
      <Button
        className="w-full"
        variant={buttonVariant}
        disabled={loading}
        onClick={handleGoogleClick}
      >
        <RiGoogleFill className="size-4" />
        <FormattedMessage defaultMessage="Continue with Google" />
      </Button>
    );
  }

  if (oidcProviders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {oidcProviders.map((provider) => (
        <Button
          key={provider.id}
          className="w-full"
          variant={buttonVariant}
          disabled={loading}
          onClick={() => handleSsoClick(provider.id)}
        >
          <RiKey2Line className="size-4" />
          {provider.name}
        </Button>
      ))}
    </div>
  );
};
