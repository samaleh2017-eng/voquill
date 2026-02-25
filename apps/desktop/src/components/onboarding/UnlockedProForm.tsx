import {
  RiArrowRightLine,
  RiInfinityLine,
  RiComputerLine,
  RiMicLine,
  RiCheckDoubleLine,
} from "@remixicon/react";
import { motion } from "framer-motion";
import { FormattedMessage } from "react-intl";
import { goToOnboardingPage } from "../../actions/onboarding.actions";
import { setAllModesToCloud } from "../../actions/user.actions";
import { trackButtonClick } from "../../utils/analytics.utils";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import {
  BackButton,
  DualPaneLayout,
  OnboardingFormLayout,
} from "./OnboardingCommon";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
};

export const UnlockedProForm = () => {
  const handleContinue = async () => {
    trackButtonClick("onboarding_unlocked_pro_continue");
    await setAllModesToCloud();
    goToOnboardingPage("tutorial");
  };

  const form = (
    <OnboardingFormLayout
      back={<BackButton />}
      actions={
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <Button onClick={handleContinue}>
            <FormattedMessage defaultMessage="Continue" />
            <RiArrowRightLine className="size-4" />
          </Button>
        </motion.div>
      }
    >
      <div className="space-y-6">
        <div>
          <motion.span
            className="mb-3 inline-block rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground"
            {...scaleIn}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <FormattedMessage defaultMessage="FREE TRIAL" />
          </motion.span>
          <motion.h2
            className="pb-2 text-2xl font-semibold"
            {...fadeInUp}
            transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
          >
            <FormattedMessage defaultMessage="Pro mode unlocked 🙌" />
          </motion.h2>
          <motion.p
            className="text-base text-muted-foreground"
            {...fadeInUp}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
          >
            <FormattedMessage defaultMessage="One week on us. No payment info required." />
          </motion.p>
        </div>

        <div className="space-y-3">
          <motion.div
            className="flex items-center gap-3"
            {...fadeInUp}
            transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
          >
            <RiInfinityLine className="size-5 shrink-0 text-muted-foreground" />
            <span className="text-base">
              <FormattedMessage defaultMessage="No word limits" />
            </span>
          </motion.div>
          <motion.div
            className="flex items-center gap-3"
            {...fadeInUp}
            transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
          >
            <RiComputerLine className="size-5 shrink-0 text-muted-foreground" />
            <span className="text-base">
              <FormattedMessage defaultMessage="Cross-device syncing" />
            </span>
          </motion.div>
          <motion.div
            className="flex items-center gap-3"
            {...fadeInUp}
            transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}
          >
            <RiMicLine className="size-5 shrink-0 text-muted-foreground" />
            <span className="text-base">
              <FormattedMessage defaultMessage="AI dictation" />
            </span>
          </motion.div>
          <motion.div
            className="flex items-center gap-3"
            {...fadeInUp}
            transition={{ delay: 0.6, duration: 0.4, ease: "easeOut" }}
          >
            <RiCheckDoubleLine className="size-5 shrink-0 text-muted-foreground" />
            <span className="text-base">
              <FormattedMessage defaultMessage="Word dictionary" />
            </span>
          </motion.div>
        </div>
      </div>
    </OnboardingFormLayout>
  );

  const rightContent = (
    <motion.div
      className="flex items-center gap-3"
      {...fadeIn}
      transition={{ delay: 0.2, duration: 0.6 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
      >
        <Logo className="h-16 w-16" />
      </motion.div>
      <motion.span
        className="text-3xl font-bold"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        Voquill
      </motion.span>
      <motion.span
        className="rounded-md bg-primary px-3 py-1 text-lg font-bold text-primary-foreground"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: 0.5,
          duration: 0.4,
          type: "spring",
          stiffness: 300,
          damping: 15,
        }}
      >
        Pro
      </motion.span>
    </motion.div>
  );

  return <DualPaneLayout left={form} right={rightContent} />;
};
