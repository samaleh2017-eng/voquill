import { getVersion } from "@tauri-apps/api/app";
import { Outlet } from "react-router-dom";
import { useAsyncData } from "../../hooks/async.hooks";
import { TranscriptionDetailsDialog } from "../transcriptions/TranscriptionDetailsDialog";
import { FeatureReleaseDialog } from "./FeatureReleaseDialog";
import { PermissionsDialog } from "./PermissionsDialog";
import { TrialEndedDialog } from "./TrialEndedDialog";

export default function DashboardPage() {
  const data = useAsyncData(getVersion, []);

  return (
    <>
      <FeatureReleaseDialog />
      <PermissionsDialog />
      <TranscriptionDetailsDialog />
      <TrialEndedDialog />
      <Outlet />
      <span className="fixed bottom-0 left-2 text-[0.55rem] text-muted-foreground/30">
        {data.state === "success" ? `v${data.data}` : ""}
      </span>
    </>
  );
}
