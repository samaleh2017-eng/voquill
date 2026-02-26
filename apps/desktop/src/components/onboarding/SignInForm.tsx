import { RiArrowRightLine, RiMailLine } from "@remixicon/react";
import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { signOut } from "../../actions/login.actions";
import {
  goToOnboardingPage,
  setAwaitingSignInNavigation,
  setDidSignUpWithAccount,
} from "../../actions/onboarding.actions";
import { useAppStore } from "../../store";
import { trackButtonClick } from "../../utils/analytics.utils";
import { getShouldShowEmailForm } from "../../utils/login.utils";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { LoginForm } from "../login/LoginForm";
import { OidcProviders } from "../login/OidcProviders";
import { TermsNotice } from "../login/TermsNotice";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  BackButton,
  DualPaneLayout,
  OnboardingFormLayout,
} from "./OnboardingCommon";

export const SignInForm = () => {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [confirmLocalSetupOpen, setConfirmLocalSetupOpen] = useState(false);

  const auth = useAppStore((state) => state.auth);
  const isEnterprise = useAppStore((state) => state.isEnterprise);
  const loginStatus = useAppStore((state) => state.login.status);
  const awaitingSignInNavigation = useAppStore(
    (state) => state.onboarding.awaitingSignInNavigation,
  );
  const isSignedIn = Boolean(auth);
  const showEmailButton = useAppStore((state) => getShouldShowEmailForm(state));

  useEffect(() => {
    if (isSignedIn && awaitingSignInNavigation) {
      setAwaitingSignInNavigation(false);
      setEmailDialogOpen(false);
      setDidSignUpWithAccount(true);
      goToOnboardingPage("userDetails");
    }
  }, [isSignedIn, awaitingSignInNavigation]);

  const handleClickLocalSetup = () => {
    trackButtonClick("onboarding_local_setup");
    setConfirmLocalSetupOpen(true);
  };

  const handleConfirmLocalSetup = () => {
    trackButtonClick("onboarding_confirm_local_setup");
    setConfirmLocalSetupOpen(false);
    setDidSignUpWithAccount(false);
    goToOnboardingPage("chooseTranscription");
  };

  const handleCancelLocalSetup = () => {
    trackButtonClick("onboarding_cancel_local_setup");
    setConfirmLocalSetupOpen(false);
  };

  const handleOpenEmailDialog = () => {
    trackButtonClick("onboarding_sign_up_with_email");
    setAwaitingSignInNavigation(true);
    setEmailDialogOpen(true);
  };

  const handleCloseEmailDialog = () => {
    setAwaitingSignInNavigation(false);
    setEmailDialogOpen(false);
  };

  const handleContinue = () => {
    trackButtonClick("onboarding_continue_signed_in");
    setDidSignUpWithAccount(true);
    goToOnboardingPage("userDetails");
  };

  const handleSignOut = async () => {
    trackButtonClick("onboarding_sign_out");
    await signOut();
  };

  const rightContent = (
    <img
      src="https://illustrations.popsy.co/amber/student-going-to-school.svg"
      alt="Illustration"
      className="max-h-[400px] max-w-[400px]"
    />
  );

  const signedInContent = (
    <OnboardingFormLayout
      actions={
        <Button onClick={handleContinue}>
          <FormattedMessage defaultMessage="Continue" />
          <RiArrowRightLine className="size-4" />
        </Button>
      }
    >
      <div className="space-y-4">
        <h2 className="pb-1 text-2xl font-semibold">
          <FormattedMessage defaultMessage="Welcome back" />
        </h2>

        <p className="text-base text-muted-foreground">
          <FormattedMessage
            defaultMessage="You are signed in as {email}"
            values={{ email: auth?.email }}
          />
        </p>

        <button
          onClick={() => void handleSignOut()}
          className="text-sm text-primary hover:underline"
        >
          <FormattedMessage defaultMessage="Sign out" />
        </button>
      </div>
    </OnboardingFormLayout>
  );

  const signInContent = (
    <OnboardingFormLayout
      back={<BackButton />}
      actions={
        !isEnterprise && (
          <Button
            onClick={handleClickLocalSetup}
            variant="ghost"
            className="text-muted-foreground font-normal"
          >
            <FormattedMessage defaultMessage="Local set up" />
            <RiArrowRightLine className="size-4" />
          </Button>
        )
      }
    >
      <div className="space-y-4">
        <h2 className="pb-1 text-2xl font-semibold">
          <FormattedMessage defaultMessage="Create your account" />
        </h2>

        <OidcProviders
          variant="contained"
          onBeforeSignIn={() => {
            trackButtonClick("onboarding_continue_with_provider");
            setAwaitingSignInNavigation(true);
          }}
        />

        {showEmailButton && (
          <Button
            className="w-full"
            variant="outline"
            onClick={handleOpenEmailDialog}
            disabled={loginStatus === "loading"}
          >
            <RiMailLine className="size-4" />
            <FormattedMessage defaultMessage="Sign up with email" />
          </Button>
        )}

        <TermsNotice align="left" />
      </div>

      <Dialog open={emailDialogOpen} onOpenChange={(open) => !open && handleCloseEmailDialog()}>
        <DialogContent className="max-w-sm">
          <LoginForm hideModeSwitch hideOidcProviders defaultMode="signUp" />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={confirmLocalSetupOpen}
        onCancel={handleCancelLocalSetup}
        onConfirm={handleConfirmLocalSetup}
        title={<FormattedMessage defaultMessage="⚠️ Advanced Setup Required" />}
        content={
          <FormattedMessage defaultMessage="Local set up is complicated and requires a strong technical background. We recommend the free plan for most users." />
        }
        confirmLabel={<FormattedMessage defaultMessage="Accept" />}
        cancelLabel={<FormattedMessage defaultMessage="Go back" />}
      />
    </OnboardingFormLayout>
  );

  const form = isSignedIn ? signedInContent : signInContent;

  return <DualPaneLayout left={form} right={rightContent} />;
};
