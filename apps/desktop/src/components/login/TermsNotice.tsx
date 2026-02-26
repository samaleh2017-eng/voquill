import { FormattedMessage } from "react-intl";

type TermsNoticeProps = {
  align?: "left" | "center";
};

export const TermsNotice = ({ align = "center" }: TermsNoticeProps) => {
  return (
    <p
      className={`max-w-[300px] text-xs text-muted-foreground ${
        align === "center" ? "self-center text-center" : "self-start text-left"
      }`}
    >
      <FormattedMessage defaultMessage="By using Voquill, you agree to our" />{" "}
      <a
        href="https://voquill.com/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-foreground"
      >
        <FormattedMessage defaultMessage="Terms & Conditions" />
      </a>{" "}
      <FormattedMessage defaultMessage="and" />{" "}
      <a
        href="https://voquill.com/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-foreground"
      >
        <FormattedMessage defaultMessage="Privacy Policy" />
      </a>
    </p>
  );
};
