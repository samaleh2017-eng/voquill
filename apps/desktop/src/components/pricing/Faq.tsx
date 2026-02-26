import { FormattedMessage } from "react-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

type FaqRowProps = {
  value: string;
  title?: React.ReactNode;
  children?: React.ReactNode;
};

const FaqRow = ({ value, title, children }: FaqRowProps) => {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger>{title}</AccordionTrigger>
      <AccordionContent>{children}</AccordionContent>
    </AccordionItem>
  );
};

export type FaqProps = {
  className?: string;
};

export const Faq = ({ className }: FaqProps) => {
  return (
    <div className="flex justify-center items-center">
      <div className={`flex flex-col items-stretch p-8 gap-4 max-w-[800px] ${className ?? ""}`}>
        <Badge variant="secondary" className="self-center">
          <FormattedMessage defaultMessage="FAQ" />
        </Badge>
        <h2 className="text-2xl font-semibold text-center mb-4">
          <FormattedMessage defaultMessage="Frequently asked questions" />
        </h2>
        <Accordion type="single" collapsible className="w-full">
          <FaqRow
            value="voice-activation"
            title={
              <FormattedMessage defaultMessage="How does the voice activation work?" />
            }
          >
            <FormattedMessage defaultMessage="Simply click the microphone bubble that appears in any text input field. Start speaking and watch as your voice is converted to text in real-time." />
          </FaqRow>
          <FaqRow
            value="websites"
            title={
              <FormattedMessage defaultMessage="What websites does it work on?" />
            }
          >
            <FormattedMessage defaultMessage="Voquill works on virtually any website with text input fields - email clients, social media, forms, documents, and more." />
          </FaqRow>
          <FaqRow
            value="security"
            title={<FormattedMessage defaultMessage="Is my voice data secure?" />}
          >
            <FormattedMessage defaultMessage="Absolutely. Our code is open-source, so you can see for yourself. You can even choose to process your voice entirely on-device." />
          </FaqRow>
        </Accordion>
      </div>
    </div>
  );
};
