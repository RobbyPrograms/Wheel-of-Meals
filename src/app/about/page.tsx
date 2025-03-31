'use client';

import { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FaUtensils, FaDharmachakra, FaCalendarAlt, FaLightbulb, FaHeart, FaUsers, FaRocket, FaShare, FaComments, FaStar, FaBookOpen, FaCheckCircle, FaArrowRight, FaUser } from 'react-icons/fa';

export default function AboutPage() {
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  
  const heroRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  // Parallax and transform effects
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);
  const patternY = useTransform(scrollY, [0, 1000], [0, 300]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const values = [
    {
      icon: <FaHeart className="text-4xl text-[#319141]" />,
      title: "User-Centric",
      description: "We put our users first, designing features that make meal planning truly enjoyable."
    },
    {
      icon: <FaUsers className="text-4xl text-[#319141]" />,
      title: "Community Driven",
      description: "Built with feedback from food enthusiasts who understand the daily cooking challenge."
    },
    {
      icon: <FaRocket className="text-4xl text-[#319141]" />,
      title: "Innovation",
      description: "Constantly evolving with new features and improvements based on user needs."
    }
  ];

  const features = [
    {
      icon: <FaUtensils className="text-4xl text-[#319141]" />,
      title: "Food Management",
      description: "Keep track of your favorite foods and their ingredients in one place."
    },
    {
      icon: <FaDharmachakra className="text-4xl text-[#319141]" />,
      title: "Meal Wheel",
      description: "Spin the wheel to randomly select your next meal from your favorites."
    },
    {
      icon: <FaCalendarAlt className="text-4xl text-[#319141]" />,
      title: "Meal Planning",
      description: "Plan your meals for the week or month ahead with our intuitive planner."
    },
    {
      icon: <FaLightbulb className="text-4xl text-[#319141]" />,
      title: "AI Suggestions",
      description: "Get personalized recipe suggestions powered by advanced AI technology."
    },
    {
      icon: <FaShare className="text-4xl text-[#319141]" />,
      title: "Social Sharing",
      description: "Share your favorite recipes and meal plans with the community."
    },
    {
      icon: <FaComments className="text-4xl text-[#319141]" />,
      title: "Community Engagement",
      description: "Interact with other food enthusiasts, share tips, and get inspired."
    },
    {
      icon: <FaStar className="text-4xl text-[#319141]" />,
      title: "Favorites System",
      description: "Save and organize your favorite recipes for quick access."
    },
    {
      icon: <FaBookOpen className="text-4xl text-[#319141]" />,
      title: "Recipe Library",
      description: "Browse through a growing collection of community-shared recipes."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Busy Parent",
      content: "SavoryCircle has transformed how I plan meals for my family. The AI suggestions are spot-on!",
      avatar: "/testimonials/avatar1.jpg"
    },
    {
      name: "Mike Chen",
      role: "Food Enthusiast",
      content: "The meal wheel feature is genius! It makes deciding what to cook actually fun.",
      avatar: "/testimonials/avatar2.jpg"
    },
    {
      name: "Emily Rodriguez",
      role: "Health Coach",
      content: "I recommend SavoryCircle to all my clients. It makes meal planning accessible and enjoyable.",
      avatar: "/testimonials/avatar3.jpg"
    }
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-[#1B3523]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#319141] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#1B3523] overflow-hidden">
      <Navbar />

      {/* Hero Section - Enhanced with more compelling copy */}
      <motion.section 
        ref={heroRef}
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
        style={{ y: heroY }}
      >
        <motion.div 
          className="absolute inset-0 bg-[url('/food-pattern.png')] opacity-10"
          style={{ y: patternY }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B3523]/95 to-[#1B3523]" />
        <motion.div 
          className="relative container mx-auto px-4 text-center"
          style={{ opacity: heroOpacity }}
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-bold text-white mb-6"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            Revolutionizing Meal Planning
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Transform your meal planning experience with SavoryCircle's innovative approach.
          </motion.p>
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link 
              href="/auth"
              className="inline-flex items-center px-8 py-4 bg-[#319141] text-white rounded-full text-lg font-semibold hover:bg-[#1B3523] transition-colors duration-300"
            >
              Get Started Free <FaArrowRight className="ml-2" />
            </Link>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Mission Section - Enhanced with more details */}
      <section ref={missionRef} className="py-24 relative z-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-[#319141] mb-6">Our Mission</h2>
              <div className="space-y-6 text-lg text-gray-600">
                <p>
                  At SavoryCircle, we're on a mission to eliminate the daily stress of meal planning. 
                  We believe that deciding what to eat shouldn't be a source of anxiety but an 
                  opportunity for creativity and enjoyment.
                </p>
                <p>
                  Founded in 2024, our platform combines cutting-edge AI technology with community wisdom 
                  to create a unique meal planning experience that adapts to your preferences and lifestyle.
                </p>
                <p>
                  Whether you're a busy parent, a health enthusiast, or someone who simply wants to bring 
                  more variety to their meals, SavoryCircle is designed to make your life easier and your 
                  meals more exciting.
                </p>
              </div>
            </motion.div>

            {/* Values */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              {values.map((value, index) => (
                <motion.div 
                  key={index}
                  className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  whileHover={{ 
                    scale: 1.05,
                    rotateY: 10,
                    z: 50
                  }}
                >
                  <div className="flex flex-col items-center text-center">
                    <motion.div 
                      className="mb-4 transform transition-transform duration-500"
                      whileHover={{ scale: 1.2, rotate: 360 }}
                    >
                      {value.icon}
                    </motion.div>
                    <h3 className="text-xl font-semibold text-[#319141] mb-3">{value.title}</h3>
                    <p className="text-gray-600">{value.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-4xl font-bold text-center text-[#319141] mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            What Our Users Say
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[#319141] flex items-center justify-center">
                      <FaUser className="text-white text-xl" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-gray-600">{testimonial.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 bg-[#1B3523] relative">
        <motion.div 
          className="absolute inset-0 bg-[url('/food-pattern.png')] opacity-5"
          style={{ y: patternY }}
        />
        <div className="container mx-auto px-4 relative">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Key Features</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Discover the tools that make SavoryCircle your perfect companion for meal planning.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center hover:bg-white/20 transition-all duration-500"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.05,
                  rotateX: 10,
                  z: 50
                }}
              >
                <div className="flex flex-col items-center">
                  <motion.div 
                    className="mb-6 transform transition-transform duration-500"
                    whileHover={{ scale: 1.2, rotate: 360 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-24 bg-[#319141]">
        <div className="container mx-auto px-4 text-center">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-white mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Ready to Transform Your Meal Planning?
          </motion.h2>
          <motion.p 
            className="text-xl text-white/90 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Join thousands of satisfied users who have made meal planning effortless with SavoryCircle.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Link 
              href="/auth"
              className="inline-flex items-center px-8 py-4 bg-white text-[#319141] rounded-full text-lg font-semibold hover:bg-gray-100 transition-colors duration-300"
            >
              Get Started Free <FaArrowRight className="ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1B3523] mt-auto">
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