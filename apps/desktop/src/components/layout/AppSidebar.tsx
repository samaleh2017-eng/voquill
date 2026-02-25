import { FormattedMessage } from "react-intl";
import { useLocation, useNavigate } from "react-router-dom";
import {
  RiHome4Line,
  RiTimeLine,
  RiBookLine,
  RiPaletteLine,
  RiSettings3Line,
  RiDownloadLine,
  RiQuestionLine,
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
} from "@/components/ui/sidebar";
import { LogoWithText } from "./Logo";
import DiscordIcon from "../../assets/discord.svg?react";

const DISCORD_INVITE_URL = "https://discord.gg/5jXkDvdVdt";
const SUPPORT_EMAIL = "mailto:support@voquill.com";

type NavItem = {
  label: React.ReactNode;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  {
    label: <FormattedMessage defaultMessage="Home" />,
    path: "/dashboard",
    icon: RiHome4Line,
  },
  {
    label: <FormattedMessage defaultMessage="History" />,
    path: "/dashboard/transcriptions",
    icon: RiTimeLine,
  },
  {
    label: <FormattedMessage defaultMessage="Dictionary" />,
    path: "/dashboard/dictionary",
    icon: RiBookLine,
  },
  {
    label: <FormattedMessage defaultMessage="Styles" />,
    path: "/dashboard/styling",
    icon: RiPaletteLine,
  },
];

export type AppSidebarProps = {
  onChoose?: () => void;
};

export function AppSidebar({ onChoose }: AppSidebarProps) {
  const location = useLocation();
  const nav = useNavigate();
  const isEnterprise = useAppStore((state) => state.isEnterprise);
  const updateReady = useAppStore(
    (state) => state.updater.status === "ready",
  );

  const handleNav = (path: string) => {
    onChoose?.();
    nav(path);
  };

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <LogoWithText />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ label, path, icon: Icon }) => (
                <SidebarMenuItem key={path}>
                  <SidebarMenuButton
                    isActive={location.pathname === path}
                    onClick={() => handleNav(path)}
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
              className="h-9 gap-3 px-3 text-sm font-medium"
            >
              <RiSettings3Line className="size-[18px] shrink-0" />
              <span>
                <FormattedMessage defaultMessage="Settings" />
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
