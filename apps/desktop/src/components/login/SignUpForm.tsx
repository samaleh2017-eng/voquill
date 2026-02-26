import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { produceAppState, useAppStore } from "../../store";
import { OidcProviders } from "./OidcProviders";
import { setMode, submitSignUp } from "../../actions/login.actions";
import {
  getCanSubmitSignUp,
  getShouldShowEmailForm,
  getSignUpConfirmPasswordValidation,
  getSignUpEmailValidation,
  getSignUpPasswordValidation,
} from "../../utils/login.utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignUpFormProps = {
  hideModeSwitch?: boolean;
  hideOidcProviders?: boolean;
};

export const SignUpForm = ({
  hideModeSwitch = false,
  hideOidcProviders = false,
}: SignUpFormProps) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const email = useAppStore((state) => state.login.email);
  const password = useAppStore((state) => state.login.password);
  const confirmPassword = useAppStore((state) => state.login.confirmPassword);
  const canSubmit = useAppStore((state) => getCanSubmitSignUp(state));
  const showEmailForm = useAppStore((state) => getShouldShowEmailForm(state));

  const emailValidation = useAppStore((state) =>
    getSignUpEmailValidation(state),
  );
  const passwordValidation = useAppStore((state) =>
    getSignUpPasswordValidation(state),
  );
  const confirmPasswordValidation = useAppStore((state) =>
    getSignUpConfirmPasswordValidation(state),
  );

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

  const handleChangeConfirmPassword = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    produceAppState((state) => {
      state.login.confirmPassword = event.target.value;
    });
  };

  const handleClickLogin = () => {
    setMode("signIn");
  };

  const handleSubmit = async () => {
    await submitSignUp();
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
              <Label htmlFor="signup-email">
                <FormattedMessage defaultMessage="Email" />
              </Label>
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={handleChangeEmail}
                aria-invalid={!!emailValidation}
              />
              {emailValidation && (
                <p className="text-xs text-destructive">{emailValidation}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-password">
                <FormattedMessage defaultMessage="Password" />
              </Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={handleChangePassword}
                  aria-invalid={!!passwordValidation}
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
              {passwordValidation && (
                <p className="text-xs text-destructive">
                  {passwordValidation}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-confirm-password">
                <FormattedMessage defaultMessage="Confirm password" />
              </Label>
              <div className="relative">
                <Input
                  id="signup-confirm-password"
                  type={confirmPasswordVisible ? "text" : "password"}
                  value={confirmPassword}
                  onChange={handleChangeConfirmPassword}
                  aria-invalid={!!confirmPasswordValidation}
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setConfirmPasswordVisible((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {confirmPasswordVisible ? (
                    <RiEyeLine className="size-4" />
                  ) : (
                    <RiEyeOffLine className="size-4" />
                  )}
                </button>
              </div>
              {confirmPasswordValidation && (
                <p className="text-xs text-destructive">
                  {confirmPasswordValidation}
                </p>
              )}
            </div>
          </div>

          <Button
            className="w-full"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <FormattedMessage defaultMessage="Create account" />
          </Button>
        </>
      )}

      {!hideModeSwitch && (
        <div className="flex justify-center">
          <button
            onClick={handleClickLogin}
            className="text-sm text-primary hover:underline"
          >
            <FormattedMessage defaultMessage="Already have an account? Log in" />
          </button>
        </div>
      )}
    </div>
  );
};
