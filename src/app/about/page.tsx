'use client';

import { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { FaUtensils, FaDharmachakra, FaCalendarAlt, FaLightbulb, FaHeart, FaUsers, FaRocket } from 'react-icons/fa';

export default function AboutPage() {
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const values = [
    {
      icon: <FaHeart className="text-4xl text-accent" />,
      title: "User-Centric",
      description: "We put our users first, designing features that make meal planning truly enjoyable."
    },
    {
      icon: <FaUsers className="text-4xl text-highlight" />,
      title: "Community Driven",
      description: "Built with feedback from food enthusiasts who understand the daily cooking challenge."
    },
    {
      icon: <FaRocket className="text-4xl text-accent" />,
      title: "Innovation",
      description: "Constantly evolving with new features and improvements based on user needs."
    }
  ];

  const features = [
    {
      icon: <FaUtensils className="text-4xl text-white" />,
      title: "Food Management",
      description: "Keep track of your favorite foods and their ingredients in one place."
    },
    {
      icon: <FaDharmachakra className="text-4xl text-white" />,
      title: "Meal Wheel",
      description: "Spin the wheel to randomly select your next meal from your favorites."
    },
    {
      icon: <FaCalendarAlt className="text-4xl text-white" />,
      title: "Meal Planning",
      description: "Plan your meals for the week or month ahead with our intuitive planner."
    },
    {
      icon: <FaLightbulb className="text-4xl text-white" />,
      title: "AI Suggestions",
      description: "Get AI-powered recipe suggestions based on your favorite foods."
    }
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-primary pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/food-pattern.png')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/95 to-primary"></div>
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              About SavoryCircle
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              Helping you discover new meals and simplify your meal planning process.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-primary to-transparent transform translate-y-24"></div>
      </section>

      {/* Mission Section */}
      <section className="pt-32 pb-24 relative z-10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">Our Mission</h2>
              <div className="space-y-6 text-lg text-text-secondary">
                <p>
                  SavoryCircle was created to solve the age-old question: "What should we eat today?" 
                  Our mission is to help people discover new meal ideas, reduce decision fatigue, 
                  and make meal planning a fun and enjoyable process.
                </p>
                <p>
                  Whether you're cooking for yourself, your family, or planning meals for the week, 
                  SavoryCircle provides the tools you need to make meal decisions quickly and easily.
                </p>
              </div>
            </div>

            {/* Values */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              {values.map((value, index) => (
                <div 
                  key={index}
                  className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100 hover:transform hover:scale-105 transition-all duration-300"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4">{value.icon}</div>
                    <h3 className="text-xl font-semibold text-primary mb-3">{value.title}</h3>
                    <p className="text-text-secondary">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-primary relative">
        <div className="absolute inset-0 bg-[url('/food-pattern.png')] opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Key Features</h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Discover the tools that make SavoryCircle your perfect companion for meal planning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center hover:transform hover:scale-105 transition-all duration-300"
              >
                <div className="flex flex-col items-center">
                  <div className="mb-6">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
                  <p className="text-white/80">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              Ready to Transform Your Meal Planning?
            </h2>
            <p className="text-xl text-text-secondary mb-12">
              Join thousands of users who have simplified their meal decisions with SavoryCircle.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center px-8 py-4 bg-accent hover:bg-highlight text-white text-lg font-medium rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              Get Started Today
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <h3 className="text-2xl font-display font-bold text-white">SAVORYCIRCLE</h3>
              <p className="text-white/70">© {new Date().getFullYear()} All rights reserved</p>
            </div>
            <div className="flex gap-8">
              <Link href="/" className="text-white/90 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/dashboard" className="text-white/90 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/about" className="text-white/90 hover:text-white transition-colors">
                About
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 