'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import { FaArrowDown, FaUtensils, FaDharmachakra, FaCalendarAlt, FaLightbulb, FaCheck, FaChartLine, FaUsers, FaShare, FaUserFriends, FaHeart, FaComments, FaMobileAlt } from 'react-icons/fa';

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
                  Share & Discover Homemade Recipes with Friends
                </p>
                <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
                  Join our community of home cooks! Share your favorite recipes, discover new dishes from friends, 
                  and build your personal collection of tried-and-true meals. Connect with fellow food lovers and 
                  make meal planning fun and social.
                </p>
              </div>

              {/* Quick Feature Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
                <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg">
                  <FaUsers className="text-3xl text-[#319141] mb-3 mx-auto" />
                  <h3 className="text-lg font-semibold text-[#0F1E0F] mb-2">Connect with Friends</h3>
                  <p className="text-sm text-gray-600">Share recipes and discover what your friends are cooking</p>
                </div>
                <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg">
                  <FaUtensils className="text-3xl text-[#319141] mb-3 mx-auto" />
                  <h3 className="text-lg font-semibold text-[#0F1E0F] mb-2">Share Your Recipes</h3>
                  <p className="text-sm text-gray-600">Build and share your collection of favorite homemade meals</p>
                </div>
                <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg">
                  <FaLightbulb className="text-3xl text-[#319141] mb-3 mx-auto" />
                  <h3 className="text-lg font-semibold text-[#0F1E0F] mb-2">Get Inspired</h3>
                  <p className="text-sm text-gray-600">Explore new recipes and cooking ideas from the community</p>
                </div>
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
                SavoryCircle, started in 2025, specializes in helping you decide what to eat. 
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
        <section className="py-16 bg-gradient-to-b from-[#E8F5E9] to-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[#0F1E0F]">
              Why Choose SavoryCircle?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-6 bg-white rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  <FaShare className="text-2xl text-[#319141] mr-3" />
                  <h3 className="text-xl font-semibold">Share Your Recipes</h3>
                </div>
                <p className="text-gray-600">
                  Create and share your favorite homemade recipes with friends. Add photos, ingredients, 
                  and detailed instructions to help others recreate your dishes.
                </p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  <FaUserFriends className="text-2xl text-[#319141] mr-3" />
                  <h3 className="text-xl font-semibold">Connect with Friends</h3>
                </div>
                <p className="text-gray-600">
                  Follow friends, discover their favorite meals, and build a community of food lovers. 
                  Get inspired by what others are cooking.
                </p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  <FaCalendarAlt className="text-2xl text-[#319141] mr-3" />
                  <h3 className="text-xl font-semibold">Smart Meal Planning</h3>
                </div>
                <p className="text-gray-600">
                  Plan your meals effortlessly by saving recipes from friends and the community. 
                  Organize your favorite dishes for easy access.
                </p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  <FaHeart className="text-2xl text-[#319141] mr-3" />
                  <h3 className="text-xl font-semibold">Save Favorites</h3>
                </div>
                <p className="text-gray-600">
                  Build your personal collection of tried-and-true recipes. Save recipes from friends 
                  and customize them to your taste.
                </p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  <FaComments className="text-2xl text-[#319141] mr-3" />
                  <h3 className="text-xl font-semibold">Engage & Discuss</h3>
                </div>
                <p className="text-gray-600">
                  Comment on recipes, share tips, and discuss cooking techniques with other food enthusiasts. 
                  Learn from the community's experience.
                </p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  <FaMobileAlt className="text-2xl text-[#319141] mr-3" />
                  <h3 className="text-xl font-semibold">Access Anywhere</h3>
                </div>
                <p className="text-gray-600">
                  Access your recipe collection and meal plans from any device. Perfect for grocery 
                  shopping or cooking at home.
                </p>
              </div>
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