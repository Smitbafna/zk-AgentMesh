import React from "react";

export default function HeroSection() {
  return (
    <main className="container mx-auto px-6 py-12">
      <div className="text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-6 text-center max-w-4xl mx-auto py-20">
  <h2 className="text-4xl md:text-6xl font-bold leading-tight bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 text-transparent bg-clip-text">
    Discover AI Agents for Every Need
  </h2>
  <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
    The premier marketplace for AI agents. Create, deploy, and monetize intelligent agents seamlessly built for developers and businesses alike.
  </p>
</div>


        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button 
          onClick={() => window.location.href = '/explore'}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Explore Agents
        </button>
        <button 
          onClick={() => window.location.href = '/create'}
          className="px-8 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-300"
        >
          Create Agent
        </button>
        </div>
      </div>
    </main>
  );
}