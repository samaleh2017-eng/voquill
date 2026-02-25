import { RiArrowLeftLine } from "@remixicon/react";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center p-4 pb-8 md:pb-16">
      <div className="w-full max-w-md space-y-4">
        <Card className="shadow-lg">
          <CardContent className="p-6 sm:p-8">
            <LoginForm />
          </CardContent>
        </Card>
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <RiArrowLeftLine className="size-4" />
              <FormattedMessage defaultMessage="Go back" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
