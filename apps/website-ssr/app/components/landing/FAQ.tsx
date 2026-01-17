import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Markdown
} from '@uni-feedback/ui'

export interface FAQItem {
  question: string
  answer: string
}

interface FAQProps {
  items: FAQItem[]
}

export function FAQ({ items }: FAQProps) {
  return (
    <Accordion type="single" className="pb-4" collapsible>
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          value={`item-${index + 1}`}
          className="px-6 border-b border-x-0 border-t-0"
        >
          <AccordionTrigger className="text-left font-semibold hover:no-underline cursor-pointer">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            <Markdown>{item.answer}</Markdown>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
