import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const sections = [
  { title: 'Acceptance of Terms', content: 'By using Sarvam you agree to these terms. If you disagree, do not use the platform.' },
  { title: 'User Eligibility', content: 'You must be 18 years or older. By registering you confirm you meet this requirement.' },
  { title: 'Provider Responsibilities', content: 'Providers must deliver services as described, maintain accurate pricing, and respond to customers professionally.' },
  { title: 'Customer Responsibilities', content: 'Customers must provide accurate location and contact information and treat providers respectfully.' },
  { title: 'Prohibited Content', content: 'No fake listings, misleading pricing, adult content, illegal services, or spam.' },
  { title: 'Payment & Pricing', content: 'All prices displayed are in INR. Sarvam does not process payments currently — transactions are between provider and customer directly.' },
  { title: 'Privacy Policy', content: 'We collect your name, email, phone, and location solely to connect you with relevant services. We do not sell your data.' },
  { title: 'Termination', content: 'We reserve the right to suspend accounts violating these terms without prior notice.' },
  { title: 'Governing Law', content: 'These terms are governed by the laws of India.' },
  { title: 'Contact Us', content: 'For queries email: support@sarvam.in' },
];

const Terms = () => {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Terms & Conditions</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 2025</p>

        <Accordion type="single" collapsible className="w-full">
          {sections.map((s, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base">
                {i + 1}. {s.title}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {s.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default Terms;
