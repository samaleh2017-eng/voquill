import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { setMode, submitSignIn } from "../../actions/login.actions";
import { produceAppState, useAppStore } from "../../store";
import {
  getCanSubmitLogin,
  getShouldShowEmailForm,
} from "../../utils/login.utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OidcProviders } from "./OidcProviders";

type SignInFormProps = {
  hideOidcProviders?: boolean;
};

export const SignInForm = ({ hideOidcProviders = false }: SignInFormProps) => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  const email = useAppStore((state) => state.login.email);
  const password = useAppStore((state) => state.login.password);
  const canSubmit = useAppStore((state) => getCanSubmitLogin(state));
  const showEmailForm = useAppStore((state) => getShouldShowEmailForm(state));

  const handleClickReset = () => {
    setMode("resetPassword");
  };

  const handleClickRegister = () => {
    setMode("signUp");
  };

  const handleChangeEmail = (event: React.ChangeEvent<HTMLInputElement>) => {
    produceAppState((state) => {
      state.login.email = event.target.value;
    });
  };

  const handleChangePassword = (event: React.ChangeEvent<HTMLInputElement>) => {
    produceAppState((state) => {
      state.login.password = event.target.value;
    });
  };

  const handleSubmit = async () => {
    await submitSignIn();
  };

  return (
    <div className="space-y-4">
      {!hideOidcProviders && <OidcProviders />}

      {showEmailForm && (
        <>
          {!hideOidcProviders && (
            <div className="relative flex items-center py-1">
              <div className="flex-1 border-t border-border" />
              <span className="px-3 text-xs text-muted-foreground">
                <FormattedMessage defaultMessage="or" />
              </span>
              <div className="flex-1 border-t border-border" />
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">
                <FormattedMessage defaultMessage="Email" />
              </Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={handleChangeEmail}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password">
                <FormattedMessage defaultMessage="Password" />
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={handleChangePassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setPasswordVisible((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {passwordVisible ? (
                    <RiEyeLine className="size-4" />
                  ) : (
                    <RiEyeOffLine className="size-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <FormattedMessage defaultMessage="Log in" />
          </Button>

          <div className="flex items-center justify-between">
            <button
              onClick={handleClickReset}
              className="text-sm text-primary hover:underline"
            >
              <FormattedMessage defaultMessage="Forgot?" />
            </button>
            <button
              onClick={handleClickRegister}
              className="text-sm text-primary hover:underline"
            >
              <FormattedMessage defaultMessage="Create account" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
