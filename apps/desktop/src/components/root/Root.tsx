import { Suspense, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Outlet, useLocation } from "react-router-dom";
import { trackPageView } from "../../utils/analytics.utils";
import { HeaderPortalProvider } from "./HeaderPortalContext";
import { LoadingApp } from "./LoadingApp";
import { OverlaySyncSideEffects } from "./OverlaySyncSideEffects";
import { PermissionSideEffects } from "./PermissionSideEffects";
import { RootConfetti } from "./RootConfetti";
import { RootDialogs } from "./RootDialogs";
import { RootSideEffects } from "./RootSideEffects";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4">
      <h2>Something went wrong:</h2>
      <pre className="whitespace-pre-wrap">{error.message}</pre>
    </div>
  );
}

export default function Root() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return (
    <>
      <PermissionSideEffects />
      <RootConfetti />
      <RootSideEffects />
      <OverlaySyncSideEffects />
      <RootDialogs />
      <HeaderPortalProvider>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<LoadingApp />}>
            <div className="h-full w-full">
              <Outlet />
            </div>
          </Suspense>
        </ErrorBoundary>
      </HeaderPortalProvider>
    </>
  );
}
