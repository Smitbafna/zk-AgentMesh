'use client';
import React, { useState } from 'react';

const HowItWorksSection = () => {
  const [activeCard, setActiveCard] = useState(null);

  const handleCardClick = (id) => {
    setActiveCard(id);
    setTimeout(() => setActiveCard(null), 2000); // Animation lasts 2 seconds
  };

  const steps = [
    {
      id: 1,
      number: 1,
      title: "Connect Wallet",
      description: "Connect your Web3 wallet to access the platform and manage your AI agents securely",
      gradient: "from-purple-500 to-blue-500",
      badgeGradient: "from-purple-400 to-pink-400",
      shadowColor: "shadow-purple-500/25",
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      id: 2,
      number: 2,
      title: "Browse & Select",
      description: "Explore our marketplace of AI agents or use our no-code builder to create your own custom agent",
      gradient: "from-blue-500 to-cyan-500",
      badgeGradient: "from-blue-400 to-cyan-400",
      shadowColor: "shadow-blue-500/25",
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    },
    {
      id: 3,
      number: 3,
      title: "Configure & Deploy",
      description: "Customize your agent's parameters, train with your data, and deploy instantly to our global infrastructure",
      gradient: "from-cyan-500 to-green-500",
      badgeGradient: "from-cyan-400 to-green-400",
      shadowColor: "shadow-cyan-500/25",
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      id: 4,
      number: 4,
      title: "Earn & Scale",
      description: "Monitor performance, collect payments automatically, and scale your AI agents to reach millions of users",
      gradient: "from-green-500 to-purple-500",
      badgeGradient: "from-green-400 to-purple-400",
      shadowColor: "shadow-green-500/25",
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    }
  ];

  const StepCard = ({ step }) => (
    <div 
      className={`text-center group relative cursor-pointer overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
        activeCard === step.id ? 'animate-pulse' : ''
      }`}
      onClick={() => handleCardClick(step.id)}
    >
      {activeCard === step.id && (
        <div className="absolute inset-0 rounded-2xl">
          <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-white via-transparent to-white bg-clip-border animate-spin-slow opacity-80"></div>
          <div className="absolute inset-0 rounded-2xl border-2 border-white/30 animate-border-glow"></div>
        </div>
      )}
      <div className="relative mb-8 z-10">
        <div className={`w-20 h-20 bg-gradient-to-r ${step.gradient} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg ${step.shadowColor}`}>
          {step.icon}
        </div>
        <div className={`absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r ${step.badgeGradient} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
          {step.number}
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-4 relative z-10">{step.title}</h3>
      <p className="text-white/70 relative z-10">{step.description}</p>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen font-inter">
      <style>{`
        @keyframes border-glow {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
          50% { box-shadow: 0 0 20px 10px rgba(255, 255, 255, 0.3); }
          100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-border-glow {
          animation: border-glow 2s ease-in-out;
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear;
        }
      `}</style>
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            How It <span className="text-pink-200">Works</span>
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto font-medium">
            Get started with AI agents in just 4 simple steps
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/50 via-blue-500/50 to-cyan-500/50 transform -translate-y-1/2"></div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((step) => (
              <StepCard key={step.id} step={step} />
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/25 font-medium">
              Start Building Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorksSection;