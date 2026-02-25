import { useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { tryOpenPaymentDialogForPricingPlan } from "../../actions/payment.actions";
import {
  closeUpgradePlanDialog,
  selectUpgradePlan,
  showUpgradePlanList,
} from "../../actions/pricing.actions";
import { useAppStore } from "../../store";
import { getEffectivePlan, getIsPaidSubscriber } from "../../utils/member.utils";
import { PricingPlan } from "../../utils/price.utils";
import { LoginForm } from "../login/LoginForm";
import { FormContainer } from "../onboarding/OnboardingShared";
import { PlanList } from "./PlanList";
import { trackButtonClick } from "../../utils/analytics.utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const UpgradePlanDialog = () => {
  const intl = useIntl();
  const open = useAppStore((state) => state.pricing.upgradePlanDialog);
  const view = useAppStore((state) => state.pricing.upgradePlanDialogView);
  const currPlan = useAppStore(getEffectivePlan);
  const isPaidSubscriber = useAppStore(getIsPaidSubscriber);
  const currLoggedIn = useAppStore((state) => Boolean(state.auth));
  const targPlan = useAppStore((state) => state.pricing.upgradePlanPendingPlan);

  useEffect(() => {
    const isTargPlanPro =
      targPlan === "pro_monthly" || targPlan === "pro_yearly";

    if (targPlan === "free" && currPlan === "free") {
      closeUpgradePlanDialog();
    } else if (isTargPlanPro && isPaidSubscriber) {
      closeUpgradePlanDialog();
    } else if (isTargPlanPro && !isPaidSubscriber && currLoggedIn) {
      closeUpgradePlanDialog();
      tryOpenPaymentDialogForPricingPlan(targPlan);
    }
  }, [currLoggedIn, currPlan, isPaidSubscriber, targPlan]);

  const handleClose = () => {
    trackButtonClick("close_upgrade_plan_dialog");
    closeUpgradePlanDialog();
  };

  const handleClickPlan = (plan: PricingPlan) => {
    trackButtonClick("select_plan_in_upgrade_dialog", { desiredPlan: plan });
    selectUpgradePlan(plan);
  };

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-full h-full sm:max-w-full sm:h-full flex flex-col rounded-none border-none p-0">
        {view === "plans" && (
          <div className="flex-1 flex flex-col overflow-auto">
            <DialogHeader className="text-center pt-8 px-6">
              <DialogTitle className="text-2xl font-bold">
                <FormattedMessage defaultMessage="Upgrade your plan" />
              </DialogTitle>
              <DialogDescription>
                <FormattedMessage defaultMessage="Cross-device sync, Voquill Cloud, and more advanced features." />
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 px-6 py-4">
              <PlanList
                onSelect={handleClickPlan}
                text={intl.formatMessage({ defaultMessage: "Upgrade" })}
                className="mt-2 mb-2"
              />
            </div>
          </div>
        )}
        {view === "login" && (
          <div className="flex-1 flex flex-col items-center pt-8">
            <FormContainer>
              <div className="text-center mb-4">
                <p className="text-muted-foreground">
                  <FormattedMessage defaultMessage="You'll need an account first" />
                </p>
              </div>
              <LoginForm />
            </FormContainer>
          </div>
        )}
        <DialogFooter className="px-6 pb-4">
          {view === "login" && (
            <Button variant="ghost" onClick={showUpgradePlanList}>
              <FormattedMessage defaultMessage="Back to plans" />
            </Button>
          )}
          <Button variant="ghost" onClick={handleClose}>
            <FormattedMessage defaultMessage="Close" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
