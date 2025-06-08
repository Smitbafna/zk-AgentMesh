import React, { useState, useEffect } from 'react';
import {
  ArrowRight, Zap, Star, Users, Shield, CheckCircle, Sparkles, Rocket, Clock
} from 'lucide-react';

type Testimonial = {
  text: string;
  author: string;
  role: string;
};

type Plan = {
  name: string;
  subtitle: string;
  price: string;
  period: string;
  features: string[];
  popular: boolean;
  cta: string;
};

const CTASection: React.FC = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 45, seconds: 30 });

  const testimonials: Testimonial[] = [
    {
      text: "Increased our productivity by 300% in the first month",
      author: "Sarah Chen",
      role: "CTO at TechCorp"
    },
    {
      text: "The best AI platform we've ever used. Game-changing!",
      author: "Michael Rodriguez",
      role: "Founder at StartupLab"
    },
    {
      text: "ROI was evident within the first week of deployment",
      author: "Emma Thompson",
      role: "VP Engineering at ScaleUp"
    }
  ];

  const features = [
    "No setup fees or hidden costs",
    "Deploy in under 5 minutes",
    "99.9% uptime guarantee",
    "24/7 premium support included"
  ];

  const plans: Plan[] = [
    {
      name: "Starter",
      subtitle: "Perfect for testing",
      price: "Free",
      period: "forever",
      features: ["10K requests/month", "Basic AI agents", "Community support"],
      popular: false,
      cta: "Start Free Trial"
    },
    {
      name: "Pro",
      subtitle: "Most popular choice",
      price: "$49",
      period: "/month",
      features: ["1M requests/month", "Advanced AI agents", "Priority support", "Custom integrations"],
      popular: true,
      cta: "Start Pro Trial"
    },
    {
      name: "Enterprise",
      subtitle: "For large teams",
      price: "Custom",
      period: "pricing",
      features: ["Unlimited requests", "White-label solution", "Dedicated support", "Custom development"],
      popular: false,
      cta: "Contact Sales"
    }
  ];

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Testimonial rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const testimonial = testimonials[currentTestimonial];

  return (
    <section className="relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20" />
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-6 py-20 relative z-10">
        {/* Countdown banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-full px-6 py-2 mb-4">
            <Clock className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 font-semibold text-sm">LIMITED TIME OFFER</span>
          </div>
          <div className="flex justify-center items-center space-x-6 text-white">
            {(['hours', 'minutes', 'seconds'] as const).map((unit, i) => (
              <React.Fragment key={unit}>
                <div className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                    {String(timeLeft[unit]).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-white/60 uppercase">{unit}</div>
                </div>
                {i < 2 && <div className="text-white/60">:</div>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* CTA heading */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-white/80 text-sm">Join 2.5M+ users worldwide</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Ready to <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">Transform</span><br />
            Your Business?
          </h2>
          <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto mb-8 leading-relaxed">
            Deploy your first AI agent in minutes, not months. Join thousands of companies already scaling with our platform.
          </p>

          {/* Testimonial */}
          <div className="mb-12">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto">
              <div className="flex justify-center mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-white/90 text-lg italic mb-4">
                “{testimonial?.text}”
              </blockquote>
              <div className="text-white/70">
                <div className="font-semibold">{testimonial?.author}</div>
                <div className="text-sm">{testimonial?.role}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white/5 backdrop-blur-sm border rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 transform hover:scale-105 ${
                plan.popular ? 'border-purple-500/50 ring-2 ring-purple-500/20' : 'border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                </div>
              )}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-white/60 text-sm mb-4">{plan.subtitle}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-white/60 ml-1">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                plan.popular
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                  : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20'
              }`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Feature list */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-12 mb-16 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg border border-white/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-white/90 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="text-center">
  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
    <button 
      onClick={() => window.location.href = '/chat'}
      className="group px-12 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white font-bold text-xl rounded-2xl hover:from-purple-700 hover:via-pink-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-purple-500/25 cursor-pointer"
    >
      <span className="flex items-center space-x-3">
        <Rocket className="w-6 h-6" />
        <span>Start Free Today</span>
        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
      </span>
    </button>
    <button className="px-12 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white font-bold text-xl rounded-2xl hover:bg-white/20 hover:border-white/40 transition-all duration-300">
      Schedule Demo
    </button>
  </div>
  <p className="text-white/60 text-sm max-w-2xl mx-auto">
    No credit card required • 14-day free trial • Cancel anytime<br />
    <span className="text-purple-400">50% off Pro plans</span> for the next 24 hours only
  </p>
</div>

        {/* Metrics */}
        <div className="mt-16 pt-12 border-t border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">2.5M+</div>
              <div className="text-white/60 text-sm">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">99.9%</div>
              <div className="text-white/60 text-sm">Uptime SLA</div>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent mb-2">150K+</div>
              <div className="text-white/60 text-sm">AI Agents</div>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-purple-400 bg-clip-text text-transparent mb-2">$50M+</div>
              <div className="text-white/60 text-sm">Processed</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
