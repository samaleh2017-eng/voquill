import { RiGoogleFill } from "@remixicon/react";
import { FormattedMessage } from "react-intl";
import { useAppStore } from "../../store";
import { submitSignInWithGoogle } from "../../actions/login.actions";
import { Button } from "@/components/ui/button";

export const SignInWithGoogleButton = () => {
  const loading = useAppStore((state) => state.login.status === "loading");

  return (
    <Button
      className="w-full"
      variant="outline"
      disabled={loading}
      onClick={submitSignInWithGoogle}
    >
      <RiGoogleFill className="size-4" />
      <FormattedMessage defaultMessage="Continue with Google" />
    </Button>
  );
};
