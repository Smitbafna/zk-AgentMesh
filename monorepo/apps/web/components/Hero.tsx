import React, { useState, useEffect, useRef } from "react";

// Mouse-reactive canvas component
function MouseReactiveCanvas() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef([]);
  const nodesRef = useRef([]);
  const animationRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size with proper pixel ratio
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      // Set actual size in memory (scaled to account for extra pixel density)
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      // Scale the drawing context so everything draws at the correct size
      ctx.scale(dpr, dpr);
      
      // Set display size (css pixels)
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };
    resizeCanvas();
    window.addEventListener('resize', () => {
      resizeCanvas();
      initParticles();
      initNodes();
    });

    // Initialize particles
    const initParticles = () => {
      const rect = canvas.getBoundingClientRect();
      particlesRef.current = [];
      for (let i = 0; i < 60; i++) {
        particlesRef.current.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.3,
          hue: Math.random() * 60 + 240 // Purple to blue range
        });
      }
    };

    // Initialize nodes
    const initNodes = () => {
      const rect = canvas.getBoundingClientRect();
      nodesRef.current = [];
      for (let i = 0; i < 8; i++) {
        nodesRef.current.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          targetX: Math.random() * rect.width,
          targetY: Math.random() * rect.height,
          size: Math.random() * 15 + 10,
          hue: Math.random() * 60 + 240,
          speed: 0.02 + Math.random() * 0.01
        });
      }
    };

    resizeCanvas();
    initParticles();
    initNodes();

    // Mouse move handler
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      
      const mouse = mouseRef.current;
      
      // Update and draw particles
      particlesRef.current.forEach(particle => {
        // Mouse attraction
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
          const force = (150 - distance) / 150;
          particle.vx += (dx / distance) * force * 0.01;
          particle.vy += (dy / distance) * force * 0.01;
        }
        
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Friction
        particle.vx *= 0.99;
        particle.vy *= 0.99;
        
        // Boundary bounce
        if (particle.x < 0 || particle.x > rect.width) particle.vx *= -0.8;
        if (particle.y < 0 || particle.y > rect.height) particle.vy *= -0.8;
        particle.x = Math.max(0, Math.min(rect.width, particle.x));
        particle.y = Math.max(0, Math.min(rect.height, particle.y));
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particle.hue}, 70%, 60%, ${particle.opacity})`;
        ctx.fill();
      });
      
      // Update and draw nodes
      nodesRef.current.forEach(node => {
        // Move towards target
        node.x += (node.targetX - node.x) * node.speed;
        node.y += (node.targetY - node.y) * node.speed;
        
        // Set new target when close
        if (Math.abs(node.x - node.targetX) < 5 && Math.abs(node.y - node.targetY) < 5) {
          node.targetX = Math.random() * rect.width;
          node.targetY = Math.random() * rect.height;
        }
        
        // Mouse repulsion
        const dx = mouse.x - node.x;
        const dy = mouse.y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          const force = (100 - distance) / 100;
          node.x -= (dx / distance) * force * 20;
          node.y -= (dy / distance) * force * 20;
        }
        
        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size);
        gradient.addColorStop(0, `hsla(${node.hue}, 80%, 70%, 0.8)`);
        gradient.addColorStop(1, `hsla(${node.hue}, 80%, 40%, 0.2)`);
        ctx.fillStyle = gradient;
        ctx.fill();
      });
      
      // Draw connections between close particles and nodes
      [...particlesRef.current, ...nodesRef.current].forEach((item1, i) => {
        [...particlesRef.current, ...nodesRef.current].slice(i + 1).forEach(item2 => {
          const dx = item1.x - item2.x;
          const dy = item1.y - item2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 120) {
            const opacity = (120 - distance) / 120 * 0.3;
            ctx.beginPath();
            ctx.moveTo(item1.x, item1.y);
            ctx.lineTo(item2.x, item2.y);
            ctx.strokeStyle = `rgba(147, 51, 234, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });
      
      // Mouse effect - glowing circle
      if (mouse.x && mouse.y) {
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 30, 0, Math.PI * 2);
        const mouseGradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 30);
        mouseGradient.addColorStop(0, 'rgba(168, 85, 247, 0.3)');
        mouseGradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = mouseGradient;
        ctx.fill();
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', () => {
        resizeCanvas();
        initParticles();
        initNodes();
      });
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="w-1/2 relative">
      <canvas
        ref={canvasRef}
        className="w-full h-screen"
        style={{ background: 'transparent' }}
      />
    </div>
  );
}

export default function HeroSection() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      <div className="flex min-h-screen">
        {/* Left Half - Hero Content */}
        <main className="w-1/2 flex items-center justify-center px-8">
          <div className="text-center space-y-8 max-w-2xl">
            {/* Hero Section */}
            <div className="space-y-8">               
  <div className="space-y-2">                 
    <h1 className="text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-black leading-[1.1] tracking-tight text-white drop-shadow-lg">                   
      Discover AI Agents                 
    </h1>                 
    <h2 className="text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black leading-[1.1] tracking-tight text-pink-300 drop-shadow-lg">                   
      for Every Need                 
    </h2>               
  </div>               
  <div className="space-y-4 max-w-xl mx-auto">                 
    <p className="text-xl lg:text-2xl xl:text-3xl text-pink-300 leading-relaxed font-medium drop-shadow-md">                   
      The premier marketplace for AI agents.                 
    </p>                 
    <p className="text-lg lg:text-xl xl:text-2xl text-white/85 leading-relaxed drop-shadow-md">                   
      Create, deploy, and monetize intelligent agents seamlessly built for developers and businesses alike.                 
    </p>               
  </div>             
</div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
    <button 
      onClick={() => window.location.href = '/explore'}
      className="px-8 py-3 bg-pink-500 text-white font-bold rounded-lg hover:bg-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-pink-500/25"
    >
      Explore Agents
    </button>
    <button 
      onClick={() => window.location.href = '/create'}
      className="px-8 py-3 border border-pink-300/40 text-pink-300 font-medium rounded-lg hover:bg-pink-300/10 hover:border-pink-300/60 transition-all duration-300 backdrop-blur-sm"
    >
      Create Agent
    </button>
  </div>
</div>
        </main>

        {/* Right Half - Mouse-Reactive Animated UI */}
        <MouseReactiveCanvas />
      </div>
    </div>
  );
}