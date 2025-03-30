'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import { FaArrowDown, FaUtensils, FaDharmachakra, FaCalendarAlt, FaLightbulb } from 'react-icons/fa';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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
          className="min-h-screen flex items-center justify-center relative overflow-hidden" 
          style={{ 
            perspective: '1000px',
            transformStyle: 'preserve-3d'
          }}
        >
          <div className="container relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-7xl md:text-9xl font-bold tracking-tight mb-8 transform transition-transform duration-500"
                  style={{ 
                    transform: `translateZ(${scrollY * 0.1}px) rotateX(${mousePosition.y * 5 - 2.5}deg) rotateY(${mousePosition.x * 5 - 2.5}deg)`,
                  }}>
                <span className="block text-primary">SAVORY</span>
                <span className="block text-accent">CIRCLE</span>
              </h1>
              <p className="text-lg md:text-xl mb-12 text-text-secondary max-w-2xl mx-auto transform transition-transform duration-500"
                 style={{ 
                   transform: `translateZ(${scrollY * 0.05}px)`,
                 }}>
                Discover your next favorite meal with our intelligent food selection and meal planning platform. 
                No more decision fatigue when it comes to what to eat.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 transform transition-transform duration-500"
                   style={{ 
                     transform: `translateZ(${scrollY * 0.02}px)`,
                   }}>
                {user ? (
                  <Link
                    href="/dashboard"
                    className="btn-primary hover-3d"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/signup"
                      className="btn-primary hover-3d"
                    >
                      Get Started
                    </Link>
                    <Link
                      href="/login"
                      className="btn-secondary hover-3d"
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6">( ABOUT )</h2>
              <p className="text-lg md:text-xl mb-8 leading-relaxed">
                SavoryCircle, founded in 2024, specializes in helping you decide what to eat. 
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
          className="py-32 bg-light relative"
        >
          <div className="container relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-primary transform transition-all duration-700"
                style={{ 
                  transform: `translateZ(${Math.max(0, (scrollY - 1000) * 0.1)}px)`,
                  opacity: Math.min(1, Math.max(0, (scrollY - 900) / 300))
                }}>
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="hover-3d transform transition-all duration-700"
                  style={{ 
                    transform: `translateZ(${Math.max(0, (scrollY - 1000) * 0.05)}px) translateY(${Math.max(0, (scrollY - 1000) * 0.1 * (index % 2 === 0 ? -1 : 1))}px)`,
                    opacity: Math.min(1, Math.max(0, (scrollY - 900 - index * 50) / 300))
                  }}
                >
                  <div className="flex flex-col items-center">
                    {feature.icon}
                    <h3 className="text-xl md:text-2xl font-medium mb-4 text-center text-primary">{feature.title}</h3>
                    <p className="text-text-secondary text-center">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-secondary text-light relative overflow-hidden">
          <div className="container relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-center">Ready to Transform Your Meal Planning?</h2>
            <p className="text-lg md:text-xl mb-12 max-w-3xl mx-auto text-center">
              Join SavoryCircle today and take the guesswork out of "What's for dinner?"
            </p>
            {mounted && (
              <div className="flex justify-center">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="btn-primary hover-3d"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/signup"
                    className="btn-primary hover-3d"
                  >
                    Sign Up Now
                  </Link>
                )}
              </div>
            )}
          </div>
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