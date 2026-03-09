
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does the free trial work?",
    answer: "Our free trial gives you full access to all Sassland features for 14 days. No credit card required. At the end of the trial, you can choose a plan that suits your needs or cancel without any charges."
  },
  {
    question: "Can I change my plan later?",
    answer: "Absolutely! You can upgrade, downgrade, or change your plan at any time. The changes will be reflected in your next billing cycle."
  },
  {
    question: "Is there a setup fee?",
    answer: "No, there are no setup fees for any of our plans. You only pay the advertised subscription price."
  },
  {
    question: "Do you offer custom enterprise solutions?",
    answer: "Yes, we offer custom enterprise solutions tailored to your specific needs. Contact our sales team to discuss your requirements and get a personalized quote."
  },
  {
    question: "What kind of support do you offer?",
    answer: "We offer email support for all plans. Our Professional plan includes priority email support, while Enterprise customers enjoy 24/7 dedicated support and a dedicated account manager."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time. If you cancel, you'll still have access to your plan until the end of your current billing period."
  }
];

const FaqSection = () => {
  return (
    <div className="bg-saas-black py-16 md:py-24 border-t border-gray-800">
      <div className="section-container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-gray-400">
            Find answers to common questions about Sassland. If you can't find what you're looking for, feel free to contact our support team.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto bg-saas-darkGray rounded-xl p-6 md:p-8 border border-gray-800 card-shadow">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-800 last:border-0">
                <AccordionTrigger className="text-left text-white hover:text-saas-orange py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-400 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default FaqSection;
