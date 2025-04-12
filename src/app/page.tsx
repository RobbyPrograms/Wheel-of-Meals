'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import { FaArrowDown, FaUtensils, FaDharmachakra, FaCalendarAlt, FaLightbulb, FaCheck, FaChartLine, FaUsers } from 'react-icons/fa';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      title: 'Food Management',
      description: 'Keep track of your favorite foods and their ingredients.',
      icon: <FaUtensils className="text-4xl text-accent mb-6" />,
    },
    {
      title: 'Meal Wheel',
      description: 'Spin the wheel to randomly select your next meal from your favorites.',
      icon: <FaDharmachakra className="text-4xl text-highlight mb-6" />,
    },
    {
      title: 'Meal Planning',
      description: 'Plan your meals for the week or month ahead.',
      icon: <FaCalendarAlt className="text-4xl text-accent mb-6" />,
    },
    {
      title: 'AI Suggestions',
      description: 'Get AI-powered recipe suggestions based on your favorite foods.',
      icon: <FaLightbulb className="text-4xl text-highlight mb-6" />,
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <main>
        {/* Hero Section - Full Screen */}
        <section 
          ref={heroRef}
          className="min-h-screen flex items-center justify-center relative overflow-hidden pt-32 pb-32" 
          style={{ 
            perspective: '1000px',
            transformStyle: 'preserve-3d'
          }}
        >
          <div className="container relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="mb-12 transform transition-transform duration-500"
                   style={{ 
                     transform: `translateZ(${scrollY * 0.15}px) scale(${1 - Math.min(scrollY * 0.001, 0.3)})`,
                   }}>
              </div>
              <h1 className="text-7xl md:text-9xl font-bold tracking-tight mb-12 transform transition-transform duration-500"
                  style={{ 
                    transform: `translateZ(${scrollY * 0.1}px)`,
                  }}>
                <span className="block text-[#0F1E0F] hover:text-[#319141] transition-colors duration-300 drop-shadow-2xl">SAVORY</span>
                <span className="block text-[#0F1E0F] hover:text-[#319141] transition-colors duration-300 mt-2 drop-shadow-2xl">CIRCLE</span>
              </h1>
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl mb-16 transform transition-transform duration-500"
                   style={{ 
                     transform: `translateZ(${scrollY * 0.05}px)`,
                   }}>
                <p className="text-xl md:text-2xl font-medium mb-4 text-[#319141]">
                  Your Next Great Meal Awaits
                </p>
                <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
                  Discover your next favorite meal with our intelligent food selection and 
                  meal planning platform. No more decision fatigue when it comes to what to eat.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-6 transform transition-transform duration-500 mb-12"
                   style={{ 
                     transform: `translateZ(${scrollY * 0.02}px)`,
                   }}>
                {user ? (
                  <Link
                    href="/dashboard"
                    className="btn-primary hover-3d text-lg px-16 py-5 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/signup"
                      className="btn-primary hover-3d text-lg px-16 py-5 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                    >
                      Get Started
                    </Link>
                    <Link
                      href="/login"
                      className="btn-secondary hover-3d text-lg px-16 py-5 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                    >
                      Log In
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section 
          ref={aboutRef}
          className="py-32 bg-primary text-light relative"
        >
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center transform transition-all duration-700"
                 style={{ 
                   transform: `translateZ(${Math.max(0, (scrollY - 500) * 0.1)}px) rotateX(${Math.max(0, Math.min(10, (scrollY - 500) * 0.01))}deg)`,
                   opacity: Math.min(1, Math.max(0, (scrollY - 400) / 300))
                 }}>
              <h2 className="text-3xl md:text-4xl font-bold mb-6"> ABOUT </h2>
              <p className="text-lg md:text-xl mb-8 leading-relaxed">
                SavoryCircle, founded in 2025, specializes in helping you decide what to eat. 
                As a meal planning tool, it offers premium food selection and organization features 
                for those seeking an authentic and mindful eating experience.
              </p>
              <Link href="/about" className="inline-flex items-center text-light hover:text-highlight transition-colors font-medium">
                EXPLORE
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section 
          ref={featuresRef}
          className="py-32 bg-light relative overflow-hidden"
        >
          <div className="container relative z-10">
            <h2 className="text-5xl md:text-6xl font-bold text-center mb-24 text-[#0F1E0F] transform transition-all duration-700"
                style={{ 
                  transform: `translateZ(${Math.max(0, (scrollY - 1000) * 0.1)}px)`,
                  opacity: Math.min(1, Math.max(0, (scrollY - 900) / 300))
                }}>
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
              {[
                {
                  title: "Food Management",
                  description: "Add your favorite meals, ingredients, and recipes. Rate dishes and track your culinary preferences.",
                  icon: <FaUtensils className="text-5xl text-[#319141] mb-6" />,
                  features: ["Personal food library", "Rating system", "Ingredient tracking"]
                },
                {
                  title: "Smart Meal Planning",
                  description: "Plan your meals effortlessly with our intelligent scheduling system.",
                  icon: <FaCalendarAlt className="text-5xl text-[#319141] mb-6" />,
                  features: ["Weekly meal plans", "Customizable schedules", "Shopping lists"]
                },
                {
                  title: "AI-Powered Suggestions",
                  description: "Get personalized recipe recommendations based on your preferences and past choices.",
                  icon: <FaLightbulb className="text-5xl text-[#319141] mb-6" />,
                  features: ["Smart recommendations", "Recipe generation", "Taste learning"]
                },
                {
                  title: "Random Meal Wheel",
                  description: "Can't decide? Let our wheel pick your next meal from your favorites.",
                  icon: <FaDharmachakra className="text-5xl text-[#319141] mb-6" />,
                  features: ["Quick decisions", "Customizable options", "Fun interface"]
                },
                {
                  title: "Progress Tracking",
                  description: "Track your culinary journey with our XP system and achievements.",
                  icon: <FaChartLine className="text-5xl text-[#319141] mb-6" />,
                  features: ["XP system", "Achievement badges", "Level progression"]
                },
                {
                  title: "Social Features",
                  description: "Connect with friends, share recipes, and discover new meal ideas together.",
                  icon: <FaUsers className="text-5xl text-[#319141] mb-6" />,
                  features: ["Friend connections", "Recipe sharing", "Community engagement"]
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105"
                  style={{ 
                    transform: `translateZ(${Math.max(0, (scrollY - 1000) * 0.05)}px)`,
                    opacity: Math.min(1, Math.max(0, (scrollY - 900 - index * 50) / 300))
                  }}
                >
                  <div className="flex flex-col items-center text-center">
                    {feature.icon}
                    <h3 className="text-2xl font-bold mb-4 text-[#0F1E0F]">{feature.title}</h3>
                    <p className="text-gray-600 mb-6">{feature.description}</p>
                    <ul className="space-y-2 text-left w-full">
                      {feature.features.map((item, i) => (
                        <li key={i} className="flex items-center text-[#319141]">
                          <FaCheck className="mr-2 flex-shrink-0" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 bg-[#0F1E0F] text-white relative overflow-hidden">
          <div className="container relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
                Ready to Transform Your
                <span className="block text-[#319141]">Meal Planning?</span>
              </h2>
              <p className="text-xl md:text-2xl mb-12 text-white/80 max-w-2xl mx-auto">
                Join SavoryCircle today and take the guesswork out of "What's for dinner?"
              </p>
              {mounted && (
                <div className="flex justify-center">
                  {user ? (
                    <Link
                      href="/dashboard"
                      className="btn-primary hover-3d text-lg px-16 py-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-[#319141] hover:bg-[#3CAB50] transform hover:-translate-y-1"
                    >
                      Go to Dashboard
                    </Link>
                  ) : (
                    <Link
                      href="/signup"
                      className="btn-primary hover-3d text-lg px-16 py-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-[#319141] hover:bg-[#3CAB50] transform hover:-translate-y-1"
                    >
                      Get Started Now
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
        </section>
      </main>

      <footer className="bg-primary text-light py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <h3 className="text-xl font-display font-bold text-light">SAVORYCIRCLE</h3>
              <p className="text-light text-opacity-70">© {new Date().getFullYear()} All rights reserved</p>
            </div>
            <div className="flex gap-8">
              <Link href="/about" className="text-light hover:text-highlight transition-colors">
                About
              </Link>
              <Link href="/setup" className="text-light hover:text-highlight transition-colors">
                Setup
              </Link>
              {mounted && user && (
                <Link href="/dashboard" className="text-light hover:text-highlight transition-colors">
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 