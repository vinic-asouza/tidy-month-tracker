import { SectionShell } from "@/components/layout/SectionShell";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { faqSection } from "@/content/copy";
import { faqItems } from "@/content/faq";

export function FaqSection() {
  return (
    <SectionShell
      id={faqSection.id}
      title={faqSection.title}
      subtitle={faqSection.subtitle}
      className="bg-muted/30"
      centered
    >
      <div className="max-w-2xl mx-auto">
        <Accordion>
          {faqItems.map((item, i) => (
            <AccordionItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              defaultOpen={i === 0}
            />
          ))}
        </Accordion>
      </div>
    </SectionShell>
  );
}
