import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Star, Users, Shield, Zap } from 'lucide-react';

const FAQSection = () => {
  const [openItems, setOpenItems] = useState(new Set([1])); // First item open by default

  const toggleFAQ = (id:any) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const faqData = [
    {
      id: 1,
      icon: <Zap className="w-5 h-5" />,
      category: "Getting Started",
      question: "How do I deploy my first AI agent?",
      answer: "Getting started is simple! Create your account, choose from our library of pre-built agents or build your own using our drag-and-drop interface. Deploy with one click to our global infrastructure. Your agent will be live and processing requests within seconds."
    },
    {
      id: 2,
      icon: <Shield className="w-5 h-5" />,
      category: "Security",
      question: "How secure is my data and AI agent code?",
      answer: "We use enterprise-grade security with end-to-end encryption, SOC 2 compliance, and isolated execution environments. Your code and data are protected by the same security standards used by Fortune 500 companies. All data is encrypted both in transit and at rest."
    },
    {
      id: 3,
      icon: <Users className="w-5 h-5" />,
      category: "Scaling",
      question: "Can the platform handle high-volume requests?",
      answer: "Absolutely! Our platform automatically scales to handle millions of requests per day. With 99.9% uptime and sub-100ms response times, your agents can handle traffic spikes seamlessly. We offer dedicated infrastructure for enterprise clients."
    },
    {
      id: 4,
      icon: <Star className="w-5 h-5" />,
      category: "Pricing",
      question: "What pricing plans do you offer?",
      answer: "We offer flexible pricing starting with a free tier that includes 10,000 requests per month. Our Pro plan scales with usage, and Enterprise plans include dedicated infrastructure, priority support, and custom integrations. No hidden fees, transparent pricing."
    },
    {
      id: 5,
      icon: <HelpCircle className="w-5 h-5" />,
      category: "Support",
      question: "What kind of support do you provide?",
      answer: "We provide 24/7 support for all paid plans, including live chat, email support, and comprehensive documentation. Enterprise customers get dedicated account managers and priority support with guaranteed response times."
    },
    {
      id: 6,
      icon: <Zap className="w-5 h-5" />,
      category: "Integration",
      question: "How do I integrate with my existing systems?",
      answer: "Our platform offers REST APIs, webhooks, and SDKs for popular programming languages. We also provide pre-built integrations for common tools like Slack, Discord, Zapier, and major cloud platforms. Custom integrations are available for Enterprise plans."
    }
  ];

  const categories = [...new Set(faqData.map(item => item.category))];

  return (
    <section className="container mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Frequently Asked <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Questions</span>
        </h2>
        <p className="text-xl text-white/70 max-w-3xl mx-auto">
          Everything you need to know about our AI agent platform
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {categories.map((category, index) => (
          <div
            key={category}
            className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white/80 text-sm font-medium hover:bg-white/20 transition-all duration-300 cursor-pointer"
          >
            {category}
          </div>
        ))}
      </div>

      {/* FAQ Items */}
      <div className="max-w-4xl mx-auto space-y-4">
        {faqData.map((item) => (
          <div
            key={item.id}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 group"
          >
            <button
              onClick={() => toggleFAQ(item.id)}
              className="w-full p-6 md:p-8 text-left flex items-center justify-between hover:bg-white/5 transition-all duration-300"
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex-shrink-0 p-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-lg border border-white/10">
                  <div className="text-purple-400">
                    {item.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-purple-400 font-medium mb-1 uppercase tracking-wider">
                    {item.category}
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white group-hover:text-purple-300 transition-colors duration-300">
                    {item.question}
                  </h3>
                </div>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div className={`transform transition-transform duration-300 ${openItems.has(item.id) ? 'rotate-180' : ''}`}>
                  <ChevronDown className="w-5 h-5 text-white/60" />
                </div>
              </div>
            </button>
            
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
              openItems.has(item.id) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="px-6 md:px-8 pb-6 md:pb-8">
                <div className="pl-14 md:pl-16">
                  <div className="w-full h-px bg-gradient-to-r from-purple-500/30 to-cyan-500/30 mb-6"></div>
                  <p className="text-white/80 leading-relaxed text-base md:text-lg">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Contact Support Section */}
      <div className="mt-16 text-center">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-12 max-w-2xl mx-auto">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-2xl border border-white/10 mx-auto flex items-center justify-center mb-4">
              <HelpCircle className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Still have questions?</h3>
            <p className="text-white/70 mb-8">
              Our support team is here to help you get the most out of our platform
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105">
              Contact Support
            </button>
            <button className="px-8 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300">
              Join Community
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;