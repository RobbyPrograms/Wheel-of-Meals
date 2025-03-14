'use client';

import { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { FaUtensils, FaDharmachakra, FaCalendarAlt, FaLightbulb, FaDatabase, FaArrowRight } from 'react-icons/fa';

export default function AboutPage() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const animationStartTimeRef = useRef<number>(Date.now());
  const headerRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const backgroundElementsRef = useRef<Array<{
    x: number;
    y: number;
    size: number;
    speed: number;
    opacity: number;
    direction: number;
    color: string;
    xOffset: number;
    yOffset: number;
  }>>([]);

  // Initialize background elements
  useEffect(() => {
    // Create random floating elements
    backgroundElementsRef.current = Array.from({ length: 15 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 20 + Math.random() * 80,
      speed: 0.5 + Math.random() * 1.5,
      opacity: 0.02 + Math.random() * 0.04, // Reduced opacity
      direction: Math.random() > 0.5 ? 1 : -1,
      color: [
        '#255F38', // primary
        '#1F7D53', // accent
        '#18230F', // secondary
        '#4A7856', // highlight
      ][Math.floor(Math.random() * 4)],
      xOffset: Math.random() * 10,
      yOffset: Math.random() * 10
    }));
    
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
      icon: <FaUtensils className="text-4xl text-accent" />,
      title: 'Food Management',
      description: 'Keep track of your favorite foods and their ingredients in one place.'
    },
    {
      icon: <FaDharmachakra className="text-4xl text-highlight" />,
      title: 'Meal Wheel',
      description: 'Spin the wheel to randomly select your next meal from your favorites.'
    },
    {
      icon: <FaCalendarAlt className="text-4xl text-accent" />,
      title: 'Meal Planning',
      description: 'Plan your meals for the week or month ahead with our intuitive planner.'
    },
    {
      icon: <FaLightbulb className="text-4xl text-highlight" />,
      title: 'AI Suggestions',
      description: 'Get AI-powered recipe suggestions based on your favorite foods.'
    }
  ];

  const steps = [
    {
      title: 'Create an account',
      description: 'Sign up to save your preferences and access all features.'
    },
    {
      title: 'Set up your database',
      description: 'Visit the setup page to configure your Supabase database.'
    },
    {
      title: 'Add your favorite foods',
      description: 'Build your collection of favorite meals.'
    },
    {
      title: 'Spin the wheel',
      description: 'Let the wheel decide your next meal.'
    },
    {
      title: 'Create meal plans',
      description: 'Plan your meals for the week ahead.'
    }
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main>
        {/* Header Section */}
        <section 
          ref={headerRef}
          className="pt-32 pb-20 bg-primary text-light relative overflow-hidden" 
          style={{ 
            perspective: '1000px',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Floating background elements */}
          {backgroundElementsRef.current.slice(0, 8).map((element, index) => {
            // Calculate position based on time for continuous animation
            const time = (Date.now() - animationStartTimeRef.current) / 1000;
            const yMovement = Math.sin(time * element.speed + index) * 5;
            const xMovement = Math.cos(time * element.speed * 0.5 + index) * 3;
            
            return (
              <div
                key={`header-float-${index}`}
                className="absolute rounded-full"
                style={{
                  left: `calc(${element.x}% + ${xMovement + element.xOffset}px)`,
                  top: `calc(${element.y}% + ${yMovement + element.yOffset}px)`,
                  width: `${element.size * 0.8}px`,
                  height: `${element.size * 0.8}px`,
                  backgroundColor: '#fff',
                  opacity: element.opacity * 0.5,
                  transform: `rotate(${time * 10 * element.direction}deg)`,
                  transition: 'none',
                }}
              />
            );
          })}

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center transform transition-all duration-500"
                 style={{ 
                   transform: `translateZ(${scrollY * 0.05}px) rotateX(${mousePosition.y * 2 - 1}deg) rotateY(${mousePosition.x * 2 - 1}deg)`,
                 }}>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">About Wheel of Meals</h1>
              <p className="text-xl md:text-2xl max-w-3xl mx-auto">
                Helping you discover new meals and simplify your meal planning process.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section 
          ref={missionRef}
          className="py-24 bg-light relative"
          style={{ 
            perspective: '1000px',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Floating background elements */}
          {backgroundElementsRef.current.slice(3, 10).map((element, index) => {
            // Calculate position based on time for continuous animation
            const time = (Date.now() - animationStartTimeRef.current) / 1000;
            const yMovement = Math.sin(time * element.speed + index + 15) * 5;
            const xMovement = Math.cos(time * element.speed * 0.5 + index + 15) * 3;
            
            return (
              <div
                key={`mission-float-${index}`}
                className="absolute rounded-full"
                style={{
                  left: `calc(${element.x}% + ${xMovement + element.xOffset}px)`,
                  top: `calc(${element.y}% + ${yMovement + element.yOffset}px)`,
                  width: `${element.size * 0.7}px`,
                  height: `${element.size * 0.7}px`,
                  backgroundColor: element.color,
                  opacity: element.opacity,
                  transform: `rotate(${time * 10 * element.direction}deg)`,
                  transition: 'none',
                }}
              />
            );
          })}

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-primary">Our Mission</h2>
              <div className="text-lg md:text-xl text-text-secondary space-y-6 leading-relaxed">
                <p>
                  Wheel of Meals was created to solve the age-old question: "What should we eat today?" 
                  Our mission is to help people discover new meal ideas, reduce decision fatigue, 
                  and make meal planning a fun and enjoyable process.
                </p>
                <p>
                  Whether you're cooking for yourself, your family, or planning meals for the week, 
                  Wheel of Meals provides the tools you need to make meal decisions quickly and easily.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section 
          ref={featuresRef}
          className="py-24 bg-secondary text-light relative overflow-hidden"
          style={{ 
            perspective: '1000px',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Floating background elements */}
          {backgroundElementsRef.current.slice(5, 12).map((element, index) => {
            // Calculate position based on time for continuous animation
            const time = (Date.now() - animationStartTimeRef.current) / 1000;
            const yMovement = Math.sin(time * element.speed + index + 30) * 5;
            const xMovement = Math.cos(time * element.speed * 0.5 + index + 30) * 3;
            
            return (
              <div
                key={`features-float-${index}`}
                className="absolute rounded-full"
                style={{
                  left: `calc(${element.x}% + ${xMovement + element.xOffset}px)`,
                  top: `calc(${element.y}% + ${yMovement + element.yOffset}px)`,
                  width: `${element.size * 0.6}px`,
                  height: `${element.size * 0.6}px`,
                  backgroundColor: '#fff',
                  opacity: element.opacity * 0.3,
                  transform: `rotate(${time * 10 * element.direction}deg)`,
                  transition: 'none',
                }}
              />
            );
          })}

          <div className="container mx-auto px-4 relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="hover-3d bg-primary bg-opacity-20 backdrop-blur-sm rounded-xl p-8"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-6">{feature.icon}</div>
                    <h3 className="text-xl md:text-2xl font-medium mb-4">{feature.title}</h3>
                    <p className="text-light text-opacity-80">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Getting Started Section */}
        <section className="py-24 bg-light relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-12 text-primary">Getting Started</h2>
              <p className="text-xl mb-10 text-text-secondary">
                Getting started with Wheel of Meals is easy:
              </p>
              
              <div className="space-y-8 mb-12">
                {steps.map((step, index) => (
                  <div 
                    key={index}
                    className="flex hover-3d"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent flex items-center justify-center text-light font-bold text-xl mr-6">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2 text-primary">{step.title}</h3>
                      <p className="text-text-secondary">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center">
                <Link
                  href="/setup"
                  className="btn-primary hover-3d flex items-center gap-2"
                >
                  <span>Database Setup Guide</span>
                  <FaArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-light py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <h3 className="text-xl font-display font-bold text-light">WHEEL OF MEALS</h3>
              <p className="text-light text-opacity-70">© {new Date().getFullYear()} All rights reserved</p>
            </div>
            <div className="flex gap-8">
              <Link href="/" className="text-light hover:text-highlight transition-colors">
                Home
              </Link>
              <Link href="/setup" className="text-light hover:text-highlight transition-colors">
                Setup
              </Link>
              <Link href="/dashboard" className="text-light hover:text-highlight transition-colors">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 