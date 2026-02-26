import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { FormattedMessage } from "react-intl";
import { useSearchParams } from "react-router-dom";
import { useOnExit } from "../../hooks/helper.hooks";
import { useConsumeQueryParams } from "../../hooks/navigation.hooks";
import { INITIAL_LOGIN_STATE, LoginMode } from "../../state/login.state";
import { produceAppState, useAppStore } from "../../store";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { ResetSentForm } from "./ResetSentForm";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";
import { TermsNotice } from "./TermsNotice";

const mapMode = (mode: string | null): LoginMode | null => {
  if (mode === "register") return "signUp";
  if (mode === "login") return "signIn";
  return null;
};

const useMode = () => {
  const stateMode = useAppStore((state) => state.login.mode);
  const [searchParams] = useSearchParams();
  const queryMode = mapMode(searchParams.get("mode"));
  return queryMode || stateMode;
};

type LoginFormProps = {
  hideModeSwitch?: boolean;
  hideOidcProviders?: boolean;
  defaultMode?: LoginMode;
};

export const LoginForm = ({
  hideModeSwitch = false,
  hideOidcProviders = false,
  defaultMode,
}: LoginFormProps) => {
  const mode = useMode();
  const errorMessage = useAppStore((state) => state.login.errorMessage);

  useOnExit(() => {
    produceAppState((draft) => {
      draft.login = INITIAL_LOGIN_STATE;
    });
  });

  useConsumeQueryParams(["mode"], ([mode]) => {
    produceAppState((draft) => {
      const mapped = mapMode(mode);
      if (mapped) {
        draft.login.mode = mapped;
      }
    });
  });

  useEffect(() => {
    if (defaultMode) {
      produceAppState((draft) => {
        draft.login.mode = defaultMode;
      });
    }
  }, [defaultMode]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        {mode === "signIn" && <FormattedMessage defaultMessage="Sign in" />}
        {mode === "signUp" && <FormattedMessage defaultMessage="Sign up" />}
        {mode === "resetPassword" && (
          <FormattedMessage defaultMessage="Reset password" />
        )}
        {mode === "passwordResetSent" && (
          <FormattedMessage defaultMessage="Email sent" />
        )}
      </h2>

      <AnimatePresence mode="wait">
        {mode === "signIn" && (
          <motion.div
            key="signIn"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <SignInForm hideOidcProviders={hideOidcProviders} />
          </motion.div>
        )}
        {mode === "signUp" && (
          <motion.div
            key="signUp"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <SignUpForm
              hideModeSwitch={hideModeSwitch}
              hideOidcProviders={hideOidcProviders}
            />
          </motion.div>
        )}
        {mode === "resetPassword" && (
          <motion.div
            key="resetPassword"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <ResetPasswordForm />
          </motion.div>
        )}
        {mode === "passwordResetSent" && (
          <motion.div
            key="passwordResetSent"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <ResetSentForm />
          </motion.div>
        )}
      </AnimatePresence>

      <TermsNotice />

      {errorMessage && (
        <p className="text-center text-sm text-destructive">{errorMessage}</p>
      )}
    </div>
  );
};
