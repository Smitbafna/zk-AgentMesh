'use client'
import React from 'react';

const StatsSection = () => {
  const stats = [
    {
      value: "2.5M+",
      label: "Active Users",
      description: "Growing daily",
      gradient: "from-purple-400 to-blue-400",
      barGradient: "from-purple-500 to-blue-500",
      width: "w-4/5",
      delay: ""
    },
    {
      value: "150K+",
      label: "AI Agents",
      description: "Deployed & running",
      gradient: "from-blue-400 to-cyan-400",
      barGradient: "from-blue-500 to-cyan-500",
      width: "w-3/4",
      delay: "delay-500"
    },
    {
      value: "$50M+",
      label: "Transactions",
      description: "Volume processed",
      gradient: "from-cyan-400 to-green-400",
      barGradient: "from-cyan-500 to-green-500",
      width: "w-5/6",
      delay: "delay-1000"
    },
    {
      value: "99.9%",
      label: "Uptime",
      description: "Enterprise grade",
      gradient: "from-green-400 to-purple-400",
      barGradient: "from-green-500 to-purple-500",
      width: "w-full",
      delay: "delay-1500"
    }
  ];

  const performanceMetrics = [
    {
      value: "85ms",
      unit: "Avg",
      title: "Response Time",
      description: "Lightning-fast API responses",
      percentage: 85,
      gradientId: "gradient1"
    },
    {
      value: "98%",
      unit: "Rate",
      title: "Success Rate",
      description: "Reliable execution guarantee",
      percentage: 98,
      gradientId: "gradient2"
    },
    {
      value: "180+",
      unit: "Countries",
      title: "Global Reach",
      description: "Worldwide infrastructure",
      percentage: 75,
      gradientId: "gradient3"
    }
  ];

  const CircularProgress = ({ percentage, gradientId, value, unit }) => (
    <div className="relative w-32 h-32 mx-auto mb-6">
      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
        <path
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="2"
        />
        <path
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="2"
          strokeDasharray={`${percentage}, 100`}
          className="animate-pulse"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-xs text-white/60">{unit}</div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="container mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Trusted by <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Millions</span>
        </h2>
        <p className="text-xl text-white/70 max-w-3xl mx-auto">
          Join the fastest-growing AI agent ecosystem in the world
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {stats.map((stat, index) => (
          <div key={index} className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 group">
            <div className="mb-4">
              <div className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-2`}>
                {stat.value}
              </div>
              <div className="text-sm text-white/60 uppercase tracking-wider font-semibold">{stat.label}</div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mb-3">
              <div className={`bg-gradient-to-r ${stat.barGradient} h-2 rounded-full ${stat.width} animate-pulse ${stat.delay}`}></div>
            </div>
            <p className="text-white/70 text-sm">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-12">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-white mb-4">Performance Metrics</h3>
          <p className="text-white/70">Real-time platform performance indicators</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="text-center">
              <CircularProgress 
                percentage={metric.percentage}
                gradientId={metric.gradientId}
                value={metric.value}
                unit={metric.unit}
              />
              <h4 className="text-lg font-semibold text-white mb-2">{metric.title}</h4>
              <p className="text-white/70 text-sm">{metric.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Gradients */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
    </section>
  );
};

export default StatsSection;