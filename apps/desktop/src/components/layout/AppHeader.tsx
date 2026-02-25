import { useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { RiRocketLine, RiUserLine } from "@remixicon/react";
import { useHeaderPortal } from "../../hooks/header.hooks";
import { useIsOnboarded } from "../../hooks/user.hooks";
import { produceAppState, useAppStore } from "../../store";
import {
  getEffectivePlan,
  getIsOnTrial,
  getIsPro,
  planToDisplayName,
} from "../../utils/member.utils";
import { getInitials } from "../../utils/string.utils";
import { getMyUser } from "../../utils/user.utils";
import { openUpgradePlanDialog } from "../../actions/pricing.actions";
import { TrialCountdown } from "../common/TrialCountdown";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function maybeArrayElements<T>(visible: boolean, values: T[]): T[] {
  return visible ? values : [];
}

export function AppHeader() {
  const { leftContent } = useHeaderPortal();
  const isOnboarded = useIsOnboarded();
  const isPro = useAppStore(getIsPro);
  const isOnTrial = useAppStore(getIsOnTrial);
  const plan = useAppStore(getEffectivePlan);
  const planName = useAppStore((state) => {
    const p = getEffectivePlan(state);
    if (p !== "enterprise") {
      return planToDisplayName(p);
    }
    const orgName = state.enterpriseLicense?.org.trim();
    return orgName || planToDisplayName(p);
  });

  const myName = useAppStore((state) => {
    const user = getMyUser(state);
    return user?.name ?? "Unknown";
  });

  const myInitials = useMemo(() => getInitials(myName), [myName]);

  const menuItems = [
    {
      label: <FormattedMessage defaultMessage="My profile" />,
      icon: RiUserLine,
      onClick: () => {
        produceAppState((draft) => {
          draft.settings.profileDialogOpen = true;
        });
      },
    },
    ...maybeArrayElements(!isPro, [
      {
        label: <FormattedMessage defaultMessage="Upgrade to Pro" />,
        icon: RiRocketLine,
        onClick: () => openUpgradePlanDialog(),
      },
    ]),
  ];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        {leftContent}
      </div>

      {isOnboarded && (
        <div className="flex items-center gap-3">
          {plan === "free" && (
            <Button
              onClick={() => openUpgradePlanDialog()}
              size="sm"
              className="gap-1.5 font-semibold"
            >
              <RiRocketLine className="size-4" />
              <FormattedMessage defaultMessage="Upgrade" />
            </Button>
          )}

          {isOnTrial && <TrialCountdown />}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent focus-visible:outline-none sm:flex">
                <Avatar className="size-8 text-sm">
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {myInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold leading-none">
                    {myName}
                  </span>
                  <span className="text-xs leading-none text-muted-foreground">
                    {planName}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {menuItems.map((item, i) => (
                <DropdownMenuItem key={i} onClick={item.onClick}>
                  <item.icon className="mr-2 size-4" />
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  );
}
