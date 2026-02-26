import {
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from "react-router-dom";
import { FormattedMessage } from "react-intl";
import { Button } from "@/components/ui/button";

const ErrorContent = () => {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <h2 className="text-2xl font-semibold">
          <FormattedMessage defaultMessage="404 - page not found" />
        </h2>
      );
    }

    return (
      <>
        <h2 className="text-2xl font-semibold">
          {error.status} - {error.statusText}
        </h2>
        <p className="text-muted-foreground">{error.data?.message}</p>
      </>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-semibold">
        <FormattedMessage defaultMessage="Something went wrong." />
      </h2>
      <p className="text-muted-foreground">{(error as Error).message}</p>
    </>
  );
};

export default function ErrorBoundary() {
  const nav = useNavigate();

  const handleGoHome = () => {
    nav("/");
  };

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex max-w-[800px] flex-col items-center gap-6 pb-32 text-center">
        <ErrorContent />
        <Button onClick={handleGoHome}>
          <FormattedMessage defaultMessage="Return home" />
        </Button>
      </div>
    </div>
  );
}
