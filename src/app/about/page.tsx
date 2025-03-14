'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { FaUtensils, FaDharmachakra, FaCalendarAlt, FaLightbulb, FaDatabase } from 'react-icons/fa';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-primary text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">About Wheel of Meals</h1>
            <p className="text-xl max-w-3xl mx-auto">
              Helping you discover new meals and simplify your meal planning process.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg mb-6">
                Wheel of Meals was created to solve the age-old question: "What should we eat today?" 
                Our mission is to help people discover new meal ideas, reduce decision fatigue, 
                and make meal planning a fun and enjoyable process.
              </p>
              <p className="text-lg mb-6">
                Whether you're cooking for yourself, your family, or planning meals for the week, 
                Wheel of Meals provides the tools you need to make meal decisions quickly and easily.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="flex justify-center mb-4">
                  <FaUtensils className="text-4xl text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Food Management</h3>
                <p className="text-gray-600">
                  Keep track of your favorite foods and their ingredients in one place.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="flex justify-center mb-4">
                  <FaDharmachakra className="text-4xl text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Meal Wheel</h3>
                <p className="text-gray-600">
                  Spin the wheel to randomly select your next meal from your favorites.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="flex justify-center mb-4">
                  <FaCalendarAlt className="text-4xl text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Meal Planning</h3>
                <p className="text-gray-600">
                  Plan your meals for the week or month ahead with our intuitive planner.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="flex justify-center mb-4">
                  <FaLightbulb className="text-4xl text-yellow-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Suggestions</h3>
                <p className="text-gray-600">
                  Get AI-powered recipe suggestions based on your favorite foods.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Getting Started</h2>
              <p className="text-lg mb-6">
                Getting started with Wheel of Meals is easy:
              </p>
              <ol className="list-decimal pl-6 space-y-4 mb-8">
                <li className="text-lg">
                  <span className="font-semibold">Create an account</span> - Sign up to save your preferences and access all features.
                </li>
                <li className="text-lg">
                  <span className="font-semibold">Set up your database</span> - Visit the setup page to configure your Supabase database.
                </li>
                <li className="text-lg">
                  <span className="font-semibold">Add your favorite foods</span> - Build your collection of favorite meals.
                </li>
                <li className="text-lg">
                  <span className="font-semibold">Spin the wheel</span> - Let the wheel decide your next meal.
                </li>
                <li className="text-lg">
                  <span className="font-semibold">Create meal plans</span> - Plan your meals for the week ahead.
                </li>
              </ol>
              <div className="flex justify-center">
                <Link
                  href="/setup"
                  className="flex items-center bg-primary text-white px-6 py-3 rounded-md hover:bg-primary-dark transition-colors"
                >
                  <FaDatabase className="mr-2" />
                  Database Setup Guide
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">Wheel of Meals</h3>
              <p className="text-gray-400">© {new Date().getFullYear()} All rights reserved</p>
            </div>
            <div className="flex gap-6">
              <Link href="/" className="hover:text-gray-300">
                Home
              </Link>
              <Link href="/setup" className="hover:text-gray-300">
                Setup
              </Link>
              <Link href="/dashboard" className="hover:text-gray-300">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 