import { RiArrowLeftLine } from "@remixicon/react";
import { FormattedMessage } from "react-intl";
import { setMode, submitResetPassword } from "../../actions/login.actions";
import { produceAppState, useAppStore } from "../../store";
import { getCanSubmitResetPassword } from "../../utils/login.utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const ResetPasswordForm = () => {
  const isEnterprise = useAppStore((state) => state.isEnterprise);
  const email = useAppStore((state) => state.login.email);
  const canSubmit = useAppStore((state) => getCanSubmitResetPassword(state));

  const handleClickBack = () => {
    setMode("signIn");
  };

  const handleChangeEmail = (event: React.ChangeEvent<HTMLInputElement>) => {
    produceAppState((state) => {
      state.login.email = event.target.value;
    });
  };

  const handleSubmit = async () => {
    await submitResetPassword();
  };

  if (isEnterprise) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <p className="text-sm text-muted-foreground">
          <FormattedMessage defaultMessage="Contact your administrator to reset your password. They can either reset your password or delete your account and have you create a new one." />
        </p>
        <Button variant="ghost" size="sm" onClick={handleClickBack}>
          <RiArrowLeftLine className="size-4" />
          <FormattedMessage defaultMessage="Back" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <p className="text-center text-sm text-muted-foreground">
        <FormattedMessage defaultMessage="Enter your email and we'll send a reset link." />
      </p>
      <div className="w-full space-y-1.5">
        <Label htmlFor="reset-email">
          <FormattedMessage defaultMessage="Email" />
        </Label>
        <Input
          id="reset-email"
          type="email"
          value={email}
          onChange={handleChangeEmail}
        />
      </div>
      <Button className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
        <FormattedMessage defaultMessage="Send reset link" />
      </Button>
      <Button variant="ghost" size="sm" onClick={handleClickBack}>
        <RiArrowLeftLine className="size-4" />
        <FormattedMessage defaultMessage="Back" />
      </Button>
    </div>
  );
};
