import { FormattedMessage } from "react-intl";
import { useAppStore } from "../../store";

export const ManagedByOrgNotice = () => {
  const orgName = useAppStore((state) => state.enterpriseLicense?.org);

  return (
    <div className="rounded-lg border border-border px-4 py-3">
      <p className="text-sm text-muted-foreground">
        <FormattedMessage
          defaultMessage="This setting is managed by {org}."
          values={{ org: orgName ?? "your organization" }}
        />
      </p>
    </div>
  );
};
