import React, { useState } from 'react';

const FeaturesSection = () => {
  const [activeCard, setActiveCard] = useState(null);

  const handleCardClick = (id) => {
    setActiveCard(id);
    setTimeout(() => setActiveCard(null), 2000); // Animation lasts 2 seconds
  };

  const features = [
    {
      id: 1,
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      gradient: "from-pink-500 to-purple-500",
      title: "Lightning Fast",
      description: "Deploy AI agents in seconds with our optimized infrastructure. Experience near-instant response times and seamless scaling."
    },
    {
      id: 2,
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      gradient: "from-purple-500 to-pink-500",
      title: "Enterprise Security",
      description: "Bank-grade encryption and security protocols. Your data and AI agents are protected with military-level security standards."
    },
    {
      id: 3,
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      gradient: "from-pink-500 to-purple-500",
      title: "Monetize Instantly",
      description: "Turn your AI agents into revenue streams. Built-in payment processing and smart contracts for seamless transactions."
    },
    {
      id: 4,
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      gradient: "from-purple-500 to-pink-500",
      title: "No-Code Builder",
      description: "Create sophisticated AI agents without writing a single line of code. Drag, drop, and deploy with our intuitive interface."
    },
    {
      id: 5,
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      gradient: "from-pink-500 to-purple-500",
      title: "Real-Time Analytics",
      description: "Monitor performance, track usage, and optimize your agents with comprehensive analytics and AI-powered insights."
    },
    {
      id: 6,
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      gradient: "from-purple-500 to-pink-500",
      title: "Global Community",
      description: "Join thousands of developers and creators. Share, collaborate, and learn from the world's largest AI agent community."
    }
  ];

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
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg tracking-tight">
            Why Choose <span className="text-pink-200">AgentMesh</span>?
          </h2>
          <p className="text-xl text-white/85 max-w-3xl mx-auto drop-shadow-md font-medium">
            The most advanced platform for AI agent creation, deployment, and monetization
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div 
              key={feature.id}
              onClick={() => handleCardClick(feature.id)}
              className={`relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 group cursor-pointer overflow-hidden ${
                activeCard === feature.id ? 'animate-pulse' : ''
              }`}
            >
              {activeCard === feature.id && (
                <div className="absolute inset-0 rounded-2xl">
                  <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-white via-transparent to-white bg-clip-border animate-spin-slow opacity-80"></div>
                  <div className="absolute inset-0 rounded-2xl border-2 border-white/30 animate-border-glow"></div>
                </div>
              )}
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 drop-shadow-md tracking-tight relative z-10">{feature.title}</h3>
              <p className="text-white/85 drop-shadow-sm font-medium leading-relaxed relative z-10">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default FeaturesSection;