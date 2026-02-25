import { RiArrowLeftLine } from "@remixicon/react";
import { FormattedMessage } from "react-intl";
import { setMode } from "../../actions/login.actions";
import { Button } from "@/components/ui/button";

export const ResetSentForm = () => {
  const handleClickBack = () => {
    setMode("signIn");
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <p className="text-center text-sm text-muted-foreground">
        <FormattedMessage defaultMessage="An email has been sent to you with a link to reset your password." />
      </p>
      <Button variant="ghost" size="sm" onClick={handleClickBack}>
        <RiArrowLeftLine className="size-4" />
        <FormattedMessage defaultMessage="Back" />
      </Button>
    </div>
  );
};
