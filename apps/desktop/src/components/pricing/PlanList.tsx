import { RiCheckLine } from "@remixicon/react";
import { MemberPlan } from "@repo/types";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { loadPrices } from "../../actions/pricing.actions";
import { useOnEnter } from "../../hooks/helper.hooks";
import { useAppStore } from "../../store";
import { getEffectivePlan, getIsOnTrial } from "../../utils/member.utils";
import { getDollarPriceFromKey, PricingPlan } from "../../utils/price.utils";
import { Button } from "@/components/ui/button";

type CheckmarkRowProps = {
  children?: React.ReactNode;
  disabled?: boolean;
};

const CheckmarkRow = ({ children, disabled }: CheckmarkRowProps) => {
  return (
    <div className={`flex items-center gap-1.5 ${disabled ? "opacity-30" : ""}`}>
      <RiCheckLine className="h-4 w-4 shrink-0" />
      <p className="text-sm">{children}</p>
    </div>
  );
};

type PlanCardProps = {
  highlighted?: boolean;
  title?: React.ReactNode;
  price?: React.ReactNode;
  children?: React.ReactNode;
  button?: React.ReactNode;
};

const PlanCard = ({
  highlighted,
  title,
  price,
  children,
  button,
}: PlanCardProps) => {
  return (
    <div
      className={`w-full sm:w-[260px] rounded-xl border-[3px] p-4 flex flex-col gap-1 bg-card ${
        highlighted ? "border-primary" : "border-border"
      }`}
    >
      <p className="text-xs text-muted-foreground">{title}</p>
      <div className="text-xl font-semibold">{price}</div>
      <div className="mt-2 mb-3">{button}</div>
      {children}
    </div>
  );
};

type BillingToggleProps = {
  isYearly: boolean;
  onToggle: () => void;
};

const BillingToggle = ({ isYearly, onToggle }: BillingToggleProps) => {
  return (
    <div className="flex justify-center mb-4">
      <div className="flex items-center gap-3">
        <span
          className={`text-sm font-medium transition-colors ${
            !isYearly ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <FormattedMessage defaultMessage="Monthly" />
        </span>
        <button
          onClick={onToggle}
          className="relative w-11 h-[22px] rounded-full bg-muted border border-border cursor-pointer transition-colors hover:bg-accent"
        >
          <div
            className={`absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-foreground transition-transform duration-300 ${
              isYearly ? "translate-x-[22px]" : "translate-x-0"
            }`}
          />
        </button>
        <span
          className={`text-sm font-medium transition-colors ${
            isYearly ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <FormattedMessage defaultMessage="Yearly" />
        </span>
        <span className="py-0.5 px-2 rounded-full bg-green-500/12 border border-green-500/20 text-green-500 text-[0.7rem] font-semibold tracking-wide">
          <FormattedMessage defaultMessage="Save 33%" />
        </span>
      </div>
    </div>
  );
};

export type PlanListProps = {
  onSelect: (plan: PricingPlan) => void;
  disabled?: boolean;
  text?: string;
  className?: string;
  ignoreCurrentPlan?: boolean;
};

export const PlanList = ({
  onSelect,
  className,
  text,
  disabled,
  ignoreCurrentPlan,
}: PlanListProps) => {
  const intl = useIntl();
  const effectivePlan = useAppStore(getEffectivePlan);
  const isOnTrial = useAppStore(getIsOnTrial);
  const [isYearly, setIsYearly] = useState(true);

  const proMonthlyPrice = useAppStore((state) =>
    getDollarPriceFromKey(state, "pro_monthly"),
  );
  const proYearlyPrice = useAppStore((state) =>
    getDollarPriceFromKey(state, "pro_yearly"),
  );
  const freeWordsPerDay = useAppStore(
    (state) => state.config?.freeWordsPerDay ?? 1_000,
  );

  const proYearlyPerMonth = proYearlyPrice
    ? Math.round(proYearlyPrice / 12)
    : null;
  const displayPrice = isYearly ? proYearlyPerMonth : proMonthlyPrice;
  const yearlyTotal = proYearlyPrice;

  useOnEnter(() => {
    loadPrices();
  });

  const getText = (plan: MemberPlan) => {
    const currentPlan = isOnTrial ? "free" : effectivePlan;
    if (currentPlan === plan && !ignoreCurrentPlan) {
      return {
        text: intl.formatMessage({ defaultMessage: "Current plan" }),
        disabled: true,
      };
    }

    return {
      text: text ?? intl.formatMessage({ defaultMessage: "Continue" }),
      disabled,
    };
  };

  const trialCard = (
    <PlanCard
      title={<FormattedMessage defaultMessage="Trial" />}
      price={
        <div>
          <p className="text-xl font-semibold">
            <FormattedMessage defaultMessage="Free" />
          </p>
          <p className="text-xs text-muted-foreground">
            <FormattedMessage defaultMessage="No credit card required" />
          </p>
        </div>
      }
      button={
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelect("free")}
          disabled={getText("free").disabled}
          className="w-full"
        >
          {getText("free").text}
        </Button>
      }
    >
      <CheckmarkRow>
        <FormattedMessage
          defaultMessage="{freeWordsPerDay, number} free words per day"
          values={{ freeWordsPerDay }}
        />
      </CheckmarkRow>
      <CheckmarkRow>
        <FormattedMessage defaultMessage="Commercial use" />
      </CheckmarkRow>
      <CheckmarkRow>
        <FormattedMessage defaultMessage="AI dictation" />
      </CheckmarkRow>
      <CheckmarkRow>
        <FormattedMessage defaultMessage="Cross-device data storage" />
      </CheckmarkRow>
      <CheckmarkRow>
        <FormattedMessage defaultMessage="Community support" />
      </CheckmarkRow>
      <CheckmarkRow disabled>
        <FormattedMessage defaultMessage="Basic agent mode" />
      </CheckmarkRow>
    </PlanCard>
  );

  const proCard = (
    <PlanCard
      highlighted
      title={<FormattedMessage defaultMessage="Pro" />}
      price={
        <div>
          <p className="text-xl font-semibold">
            {displayPrice
              ? intl.formatMessage(
                  { defaultMessage: "${displayPrice}/month" },
                  { displayPrice },
                )
              : "--"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isYearly && yearlyTotal ? (
              <FormattedMessage
                defaultMessage="Billed annually (${total}/year)"
                values={{ total: yearlyTotal }}
              />
            ) : (
              <FormattedMessage defaultMessage="Billed monthly" />
            )}
          </p>
        </div>
      }
      button={
        <Button
          variant="blue"
          size="sm"
          onClick={() => onSelect(isYearly ? "pro_yearly" : "pro_monthly")}
          disabled={getText("pro").disabled}
          className="w-full"
        >
          {getText("pro").text}
        </Button>
      }
    >
      <CheckmarkRow disabled>
        <FormattedMessage defaultMessage="Everything the trial has" />
      </CheckmarkRow>
      <CheckmarkRow>
        <FormattedMessage defaultMessage="Unlimited words per month" />
      </CheckmarkRow>
      <CheckmarkRow>
        <FormattedMessage defaultMessage="Access to beta features" />
      </CheckmarkRow>
      <CheckmarkRow>
        <FormattedMessage defaultMessage="Cross-device sync" />
      </CheckmarkRow>
      <CheckmarkRow>
        <FormattedMessage defaultMessage="Priority support" />
      </CheckmarkRow>
    </PlanCard>
  );

  return (
    <div className={`flex flex-col items-center ${className ?? ""}`}>
      <BillingToggle
        isYearly={isYearly}
        onToggle={() => setIsYearly(!isYearly)}
      />
      <div className="flex flex-row gap-4 items-stretch justify-center flex-wrap">
        {trialCard}
        {proCard}
      </div>
    </div>
  );
};
