import { useEffect } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router-dom";
import { resetOnboarding } from "../../actions/onboarding.actions";
import { clearGotStartedAt } from "../../actions/user.actions";
import { useAppStore } from "../../store";
import { getShouldGoToOnboarding } from "../../utils/user.utils";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import { VectorField } from "./VectorField";

export default function WelcomePage() {
  const nav = useNavigate();
  const shouldGotoOnboarding = useAppStore(getShouldGoToOnboarding);
  const enterpriseName = useAppStore((state) => state.enterpriseLicense?.org);

  const handleGetStarted = () => {
    resetOnboarding();
    nav("/onboarding");
  };

  const handleLogin = () => {
    resetOnboarding();
    nav("/login?mode=login");
  };

  useEffect(() => {
    if (shouldGotoOnboarding) {
      nav("/onboarding");
      clearGotStartedAt();
    }
  }, [shouldGotoOnboarding]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <VectorField />
      <div className="relative z-10 flex min-h-full w-full items-center justify-center px-3 py-6">
        <div className="relative max-w-[420px] rounded-2xl bg-background/80 p-8 shadow-[0_0_120px_120px_var(--color-background)] backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Logo className="h-12 w-12" />
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Voquill
                </h1>
              </div>
              <p className="text-base text-muted-foreground">
                {enterpriseName ? (
                  <FormattedMessage
                    defaultMessage="Voice OS for {enterpriseName}"
                    values={{ enterpriseName }}
                  />
                ) : (
                  <FormattedMessage defaultMessage="Voice is your new keyboard." />
                )}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2">
              <Button size="lg" className="w-full" onClick={handleGetStarted}>
                <FormattedMessage defaultMessage="Get started" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="w-full text-muted-foreground"
                onClick={handleLogin}
              >
                <FormattedMessage defaultMessage="I already have an account" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
