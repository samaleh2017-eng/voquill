import { FormattedMessage, useIntl } from "react-intl";
import { useLocation, useNavigate } from "react-router-dom";
import {
  RiHome4Line,
  RiTimeLine,
  RiBookLine,
  RiPaletteLine,
  RiSettings3Line,
  RiDownloadLine,
  RiQuestionLine,
  RiSidebarFoldLine,
  RiSidebarUnfoldLine,
} from "@remixicon/react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useAppStore } from "../../store";
import { openUpdateDialog } from "../../actions/updater.actions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo, LogoWithText } from "./Logo";
import DiscordIcon from "../../assets/discord.svg?react";
import { getIsPro } from "../../utils/member.utils";

const DISCORD_INVITE_URL = "https://discord.gg/5jXkDvdVdt";
const SUPPORT_EMAIL = "mailto:support@voquill.com";

type NavItem = {
  label: React.ReactNode;
  tooltipLabel: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type AppSidebarProps = {
  onChoose?: () => void;
};

export function AppSidebar({ onChoose }: AppSidebarProps) {
  const location = useLocation();
  const nav = useNavigate();
  const intl = useIntl();
  const { toggleSidebar, open } = useSidebar();
  const isEnterprise = useAppStore((state) => state.isEnterprise);
  const isPro = useAppStore(getIsPro);
  const updateReady = useAppStore(
    (state) => state.updater.status === "ready",
  );

  const navItems: NavItem[] = [
    {
      label: <FormattedMessage defaultMessage="Home" />,
      tooltipLabel: intl.formatMessage({ defaultMessage: "Home" }),
      path: "/dashboard",
      icon: RiHome4Line,
    },
    {
      label: <FormattedMessage defaultMessage="History" />,
      tooltipLabel: intl.formatMessage({ defaultMessage: "History" }),
      path: "/dashboard/transcriptions",
      icon: RiTimeLine,
    },
    {
      label: <FormattedMessage defaultMessage="Dictionary" />,
      tooltipLabel: intl.formatMessage({ defaultMessage: "Dictionary" }),
      path: "/dashboard/dictionary",
      icon: RiBookLine,
    },
    {
      label: <FormattedMessage defaultMessage="Styles" />,
      tooltipLabel: intl.formatMessage({ defaultMessage: "Styles" }),
      path: "/dashboard/styling",
      icon: RiPaletteLine,
    },
  ];

  const handleNav = (path: string) => {
    onChoose?.();
    nav(path);
  };

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="flex items-center justify-center px-3 py-4">
        <div className="flex items-center gap-2">
          {open ? <LogoWithText /> : <Logo />}
          {open && isPro && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gradient-to-r from-primary to-primary/70 text-primary-foreground">
              PRO
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ label, path, icon: Icon, tooltipLabel }) => (
                <SidebarMenuItem key={path}>
                  <SidebarMenuButton
                    isActive={location.pathname === path}
                    onClick={() => handleNav(path)}
                    tooltip={tooltipLabel}
                    className="h-9 gap-3 px-3 text-sm font-medium"
                  >
                    <Icon className="size-[18px] shrink-0" />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-4">
        <SidebarSeparator className="mb-2" />
        <SidebarMenu>
          {updateReady && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => openUpdateDialog()}
                tooltip={intl.formatMessage({ defaultMessage: "Update available" })}
                className="h-9 gap-3 px-3 text-sm font-medium"
              >
                <RiDownloadLine className="size-[18px] shrink-0" />
                <span>
                  <FormattedMessage defaultMessage="Update available" />
                </span>
                <SidebarMenuBadge>
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                </SidebarMenuBadge>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {isEnterprise ? (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => openUrl(SUPPORT_EMAIL)}
                tooltip={intl.formatMessage({ defaultMessage: "Support" })}
                className="h-9 gap-3 px-3 text-sm font-medium"
              >
                <RiQuestionLine className="size-[18px] shrink-0" />
                <span>
                  <FormattedMessage defaultMessage="Support" />
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => openUrl(DISCORD_INVITE_URL)}
                tooltip={intl.formatMessage({ defaultMessage: "Discord" })}
                className="h-9 gap-3 px-3 text-sm font-medium"
              >
                <DiscordIcon className="size-[18px] shrink-0" />
                <span>
                  <FormattedMessage defaultMessage="Discord" />
                </span>
                <SidebarMenuBadge>
                  <span className="size-2 rounded-full bg-emerald-500" />
                </SidebarMenuBadge>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={location.pathname === "/dashboard/settings"}
              onClick={() => handleNav("/dashboard/settings")}
              tooltip={intl.formatMessage({ defaultMessage: "Settings" })}
              className="h-9 gap-3 px-3 text-sm font-medium"
            >
              <RiSettings3Line className="size-[18px] shrink-0" />
              <span>
                <FormattedMessage defaultMessage="Settings" />
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => toggleSidebar()}
              tooltip={intl.formatMessage({ defaultMessage: "Collapse" })}
              className="h-9 gap-3 px-3 text-sm font-medium"
            >
              {open ? (
                <RiSidebarFoldLine className="size-[18px] shrink-0" />
              ) : (
                <RiSidebarUnfoldLine className="size-[18px] shrink-0" />
              )}
              <span>
                <FormattedMessage defaultMessage="Collapse" />
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
