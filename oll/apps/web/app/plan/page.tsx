'use client';
import { base } from 'viem/chains';
import styles from "./page.module.css";
import Header from '@/components/Headers';
import CTAsection from "../../components/CTAsection";
import React from 'react';






import { OnchainKitProvider } from '@coinbase/onchainkit';




export default function Page() {
 

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
        <OnchainKitProvider apiKey="HtKBr6ZPPcdHN6plf9qm4G3TAuQtV7Kf" chain={base}>
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            ></div>
          ))}
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Moving Gradient Lines */}
        <div className="absolute inset-0">
          <div className="absolute h-px w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent animate-pulse top-1/4"></div>
          <div className="absolute h-px w-full bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-pulse top-2/3 delay-1000"></div>
          <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent animate-pulse left-1/4 delay-2000"></div>
          <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-purple-500/50 to-transparent animate-pulse right-1/3 delay-500"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen">
       <Header/>
<CTAsection/>


      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>
      </OnchainKitProvider>
    </div>
  );
}