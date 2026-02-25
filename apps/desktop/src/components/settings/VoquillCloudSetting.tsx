import { RiRocketLine } from "@remixicon/react";
import { FormattedMessage } from "react-intl";
import { openUpgradePlanDialog } from "../../actions/pricing.actions";
import { useAppStore } from "../../store";
import { getIsPro } from "../../utils/member.utils";
import { Button } from "@/components/ui/button";

export const VoquillCloudSetting = () => {
  const isPro = useAppStore(getIsPro);

  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-sm">
        <FormattedMessage defaultMessage="Use Voquill Cloud" />
      </p>
      <p className="text-sm text-muted-foreground">
        <FormattedMessage defaultMessage="No downloads or manual setup. Record on any device and we'll keep your data secure, synced, and ready everywhere." />
      </p>
      {!isPro && (
        <Button onClick={openUpgradePlanDialog}>
          <FormattedMessage defaultMessage="Upgrade to Pro" />
          <RiRocketLine className="ml-2 size-4" />
        </Button>
      )}
    </div>
  );
};
