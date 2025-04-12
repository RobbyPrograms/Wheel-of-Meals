'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { FavoriteFood } from '@/lib/supabase';
import { FaUtensils, FaArrowLeft, FaHeart, FaXmark, FaDice, FaHandPointer } from 'react-icons/fa6';

export default function RandomMealPage() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<FavoriteFood[]>([]);
  const [currentMeals, setCurrentMeals] = useState<FavoriteFood[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<FavoriteFood | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [availableMealTypes, setAvailableMealTypes] = useState<string[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [lastX, setLastX] = useState(0);
  const [lastTime, setLastTime] = useState(0);

  useEffect(() => {
    if (user) {
      fetchMeals();
    }
  }, [user]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchMeals = async () => {
    try {
      const { data: meals, error } = await supabase
        .from('favorite_foods')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      setMeals(meals || []);
      shuffleAndSetMeals(meals || []);
      
      // Get unique meal types
      const types = new Set<string>();
      meals?.forEach(meal => {
        meal.meal_types?.forEach((type: string) => types.add(type));
      });
      setAvailableMealTypes(Array.from(types));
    } catch (err) {
      console.error('Error fetching meals:', err);
    }
  };

  const shuffleAndSetMeals = (mealsToShuffle: FavoriteFood[]) => {
    const filteredMeals = selectedFilters.length > 0
      ? mealsToShuffle.filter(meal => meal.meal_types?.some(type => selectedFilters.includes(type)))
      : mealsToShuffle;

    // Fisher-Yates shuffle
    const shuffled = [...filteredMeals];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    setCurrentMeals(shuffled.slice(0, 5)); // Show 5 cards at a time
  };

  const calculateVelocity = (currentX: number, currentTime: number) => {
    if (lastTime === 0) {
      setLastX(currentX);
      setLastTime(currentTime);
      return 0;
    }

    const deltaTime = currentTime - lastTime;
    const deltaX = currentX - lastX;
    const newVelocity = deltaX / deltaTime;

    setLastX(currentX);
    setLastTime(currentTime);

    return newVelocity;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection
    setIsDragging(true);
    setStartX(e.clientX - offsetX);
    setLastTime(0); // Reset velocity tracking
    setVelocity(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent text selection
    const currentX = e.clientX - startX;
    setOffsetX(currentX);
    
    // Calculate velocity for swipe momentum
    const newVelocity = calculateVelocity(e.clientX, e.timeStamp);
    setVelocity(newVelocity);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setLastTime(0);

    // Use velocity to determine swipe direction
    const swipeThreshold = Math.abs(velocity) > 0.5 ? 50 : 100;
    
    if (Math.abs(offsetX) > swipeThreshold) {
      const isRight = offsetX > 0;
      handleSwipe(isRight);
    } else {
      // Animate back to center with spring effect
      setOffsetX(0);
    }
  };

  const handleSwipe = (isRight: boolean) => {
    if (currentMeals.length === 0) return;

    const meal = currentMeals[0];
    setSelectedMeal(isRight ? meal : null);
    
    // Remove the top card
    setCurrentMeals(prev => prev.slice(1));
    setOffsetX(0);

    // Refill the deck if running low
    if (currentMeals.length <= 2) {
      shuffleAndSetMeals(meals);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setTouchStart(e.touches[0].clientX);
    setStartX(e.touches[0].clientX - offsetX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX - startX;
    setOffsetX(currentX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (Math.abs(offsetX) > 100) {
      const isRight = offsetX > 0;
      handleSwipe(isRight);
    } else {
      setOffsetX(0);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Random Meal Selector</h1>
          <p className="text-text-secondary mb-6">Please log in to use this feature.</p>
          <Link
            href="/login"
            className="inline-block bg-accent text-white px-6 py-2 rounded-md hover:bg-accent/90 transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-text-secondary hover:text-primary transition-colors inline-flex items-center gap-2"
        >
          <FaArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-primary mb-2">Random Meal Selector</h1>
        <p className="text-text-secondary mb-4">
          {isMobile 
            ? "Swipe right to select a meal, left to skip!"
            : "Swipe or use buttons to select your next meal!"}
        </p>

        {/* Meal Type Filters */}
        {availableMealTypes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-primary mb-3">Filter by Meal Type</h2>
            <div className="flex flex-wrap gap-2">
              {availableMealTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedFilters(prev =>
                      prev.includes(type)
                        ? prev.filter(t => t !== type)
                        : [...prev, type]
                    );
                    shuffleAndSetMeals(meals);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedFilters.includes(type)
                      ? 'bg-accent text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Interaction Hint */}
        <div className="flex items-center justify-center gap-2 mb-8 text-gray-500 text-sm">
          {isMobile ? (
            <div className="flex items-center gap-1">
              <FaHandPointer className="h-4 w-4" />
              <span>Swipe cards to make your choice</span>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <FaHandPointer className="h-4 w-4" />
                <span>Drag cards</span>
              </div>
              <span>or</span>
              <div className="flex items-center gap-2">
                <button className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-500">
                  <FaXmark className="h-3 w-3" />
                </button>
                <span>/</span>
                <button className="w-6 h-6 flex items-center justify-center rounded-full bg-green-100 text-green-500">
                  <FaHeart className="h-3 w-3" />
                </button>
                <span>Click buttons</span>
              </div>
            </div>
          )}
        </div>

        {/* Card Stack Area */}
        <div className="relative h-[400px] mb-8 select-none">
          {currentMeals.map((meal, index) => (
            <div
              key={meal.id}
              ref={index === 0 ? cardRef : null}
              className={`absolute inset-0 bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 select-none ${
                index === 0 ? 'z-10' : 'z-0'
              } ${isDragging ? 'cursor-grabbing' : index === 0 && !isMobile ? 'cursor-grab' : 'cursor-default'}`}
              style={{
                transform: index === 0 
                  ? `translateX(${offsetX}px) rotate(${offsetX * 0.05}deg)`
                  : `translateY(${index * 4}px) scale(${1 - index * 0.05})`,
                opacity: index === 0 ? 1 : 1 - index * 0.2,
                transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }}
              onMouseDown={!isMobile ? handleMouseDown : undefined}
              onMouseMove={!isMobile ? handleMouseMove : undefined}
              onMouseUp={!isMobile ? handleMouseUp : undefined}
              onMouseLeave={!isMobile ? handleMouseUp : undefined}
              onTouchStart={isMobile ? handleTouchStart : undefined}
              onTouchMove={isMobile ? handleTouchMove : undefined}
              onTouchEnd={isMobile ? handleTouchEnd : undefined}
            >
              <div className="p-6 h-full flex flex-col select-none">
                <div className="flex-1 select-none">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaUtensils className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="text-2xl font-bold text-primary mb-3 text-center">{meal.name}</h3>
                  {meal.meal_types && meal.meal_types.length > 0 && (
                    <div className="flex justify-center gap-2 mb-4">
                      {meal.meal_types.map((type, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {index === 0 && !isMobile && (
                  <div className="flex justify-center gap-8 mt-4 select-none">
                    <button
                      onClick={() => handleSwipe(false)}
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                    >
                      <FaXmark className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() => handleSwipe(true)}
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-500 hover:bg-green-200 transition-colors"
                    >
                      <FaHeart className="h-6 w-6" />
                    </button>
                  </div>
                )}
              </div>

              {/* Swipe Indicators */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  opacity: Math.min(Math.abs(offsetX) / 75, 1), // Made more sensitive
                  background: offsetX > 0 
                    ? 'linear-gradient(90deg, transparent 0%, rgba(34, 197, 94, 0.1) 100%)'
                    : offsetX < 0
                    ? 'linear-gradient(-90deg, transparent 0%, rgba(239, 68, 68, 0.1) 100%)'
                    : 'transparent',
                  transition: isDragging ? 'none' : 'all 0.3s ease'
                }}
              >
                <div 
                  className={`absolute top-1/2 -translate-y-1/2 ${offsetX > 0 ? 'right-8' : 'left-8'} transition-transform duration-200`}
                  style={{
                    opacity: Math.min(Math.abs(offsetX) / 75, 1), // Made more sensitive
                    transform: `translate(${offsetX > 0 ? offsetX * 0.1 : offsetX * -0.1}px, -50%) scale(${1 + Math.min(Math.abs(offsetX) / 500, 0.2)})`,
                  }}
                >
                  {offsetX > 0 ? (
                    <FaHeart className="h-12 w-12 text-green-500" />
                  ) : (
                    <FaXmark className="h-12 w-12 text-red-500" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Meal Display */}
        {selectedMeal && (
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <h3 className="text-xl font-bold text-primary mb-4">You selected: {selectedMeal.name}!</h3>
            <Link
              href={`/dashboard/meals/${selectedMeal.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              View Recipe
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        {/* Reshuffle Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => shuffleAndSetMeals(meals)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FaDice className="h-4 w-4" />
            Reshuffle Deck
          </button>
        </div>
      </div>
    </div>
  );
} 