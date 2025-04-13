'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { FavoriteFood } from '@/lib/supabase';
import { FaUtensils, FaArrowLeft, FaHeart, FaXmark, FaDice, FaHandPointer, FaCalendarPlus, FaTrash, FaRepeat } from 'react-icons/fa6';
import { useRouter } from 'next/navigation';

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
  const [likedMeals, setLikedMeals] = useState<FavoriteFood[]>([]);
  const [dislikedMeals, setDislikedMeals] = useState<FavoriteFood[]>([]);
  const [showLikedPanel, setShowLikedPanel] = useState(false);
  const [allowRepeats, setAllowRepeats] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const router = useRouter();

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

      // Normalize meal types to always be lowercase arrays
      const normalizedMeals = meals?.map(meal => ({
        ...meal,
        meal_types: Array.isArray(meal.meal_types) 
          ? meal.meal_types.map((type: string | null) => type?.toLowerCase()).filter(Boolean)
          : []
      })) || [];

      setMeals(normalizedMeals);
      shuffleAndSetMeals(normalizedMeals);
      
      // Get unique meal types
      const types = new Set<string>(['breakfast', 'lunch', 'dinner', 'snack']);
      normalizedMeals.forEach(meal => {
        if (Array.isArray(meal.meal_types)) {
          meal.meal_types.forEach((type: string | null) => {
            if (type) types.add(type.toLowerCase());
          });
        }
      });

      // Convert to array and sort in specific order
      const sortedTypes = Array.from(types).sort((a, b) => {
        const order = ['breakfast', 'lunch', 'dinner', 'snack'];
        return order.indexOf(a) - order.indexOf(b);
      });
      setAvailableMealTypes(sortedTypes);
    } catch (err) {
      console.error('Error fetching meals:', err);
    }
  };

  const shuffleAndSetMeals = (mealsToShuffle: FavoriteFood[]) => {
    let availableMeals = [...mealsToShuffle];
    
    console.log('Selected Filters:', selectedFilters);
    
    // If repeats are not allowed, remove already liked/seen meals and disliked meals
    if (!allowRepeats) {
      availableMeals = availableMeals.filter(meal => 
        !likedMeals.some(liked => liked.id === meal.id) &&
        !dislikedMeals.some(disliked => disliked.id === meal.id)
      );
    }

    // Apply type filters
    let filteredMeals = availableMeals;
    
    if (selectedFilters.length > 0) {
      console.log('Filtering meals...');
      filteredMeals = availableMeals.filter(meal => {
        console.log('Checking meal:', meal.name);
        console.log('Raw meal_types:', meal.meal_types);
        
        // Ensure meal_types is a valid array of lowercase strings
        const mealTypes = Array.isArray(meal.meal_types) 
          ? meal.meal_types
              .filter(Boolean)  // Remove null/undefined values
              .map(type => typeof type === 'string' ? type.toLowerCase() : '')
              .filter(type => type !== '')  // Remove empty strings
          : [];
          
        console.log('Processed meal_types:', mealTypes);
        
        // If no meal types and filters are selected, exclude the meal
        if (mealTypes.length === 0) {
          console.log('Meal has no types, excluding');
          return false;
        }

        // Check if ANY of the selected filters match the meal's types
        const hasMatchingType = selectedFilters.some(filter => {
          const matches = mealTypes.includes(filter);
          console.log(`Checking if ${filter} matches any of`, mealTypes, ':', matches);
          return matches;
        });

        console.log('Meal matches filter:', hasMatchingType);
        return hasMatchingType;
      });
    }

    console.log('Filtered meals:', filteredMeals.map(m => ({ name: m.name, types: m.meal_types })));

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
    if (deltaTime === 0) return 0;

    const deltaX = currentX - lastX;
    // Smooth out the velocity calculation
    const newVelocity = deltaX / Math.max(deltaTime, 16); // Cap minimum time difference at 16ms

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
    e.preventDefault();

    // Calculate new position
    const currentX = e.clientX - startX;
    
    // Apply smoothing to the movement
    const smoothedX = currentX * 0.95; // Slightly dampen the movement
    
    setOffsetX(smoothedX);
    
    // Calculate velocity for swipe momentum
    const newVelocity = calculateVelocity(e.clientX, e.timeStamp);
    // Smooth out velocity changes
    setVelocity(prev => prev * 0.5 + newVelocity * 0.5);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    // Reset all drag-related states
    setIsDragging(false);
    setLastTime(0);
    setVelocity(0);
    setStartX(0);

    // Use absolute offset for threshold check to make it more consistent
    const absOffset = Math.abs(offsetX);
    // Make threshold more forgiving for slow movements
    const baseThreshold = currentMeals.length === 1 ? 40 : 75; // Lower threshold for last card
    const velocityThreshold = Math.abs(velocity) > 0.5 ? baseThreshold * 0.5 : baseThreshold;
    
    if (absOffset > velocityThreshold) {
      const isRight = offsetX > 0;
      handleSwipe(isRight);
    } else {
      // Reset position and ensure no toast is shown for incomplete swipes
      setOffsetX(0);
      setSelectedMeal(null);
    }
  };

  const handleSwipe = (isRight: boolean, isButtonClick: boolean = false) => {
    if (currentMeals.length === 0) return;

    const meal = currentMeals[0];
    const isLastCard = currentMeals.length === 1;
    
    // Reset transform immediately to prevent stuck animations
    setOffsetX(0);
    setIsDragging(false);
    
    // Always process if it's a button click, otherwise check swipe threshold
    if (isButtonClick || (isRight && Math.abs(offsetX) > (currentMeals.length === 1 ? 50 : 75))) {
      // Handle liked meal
      setLikedMeals(prev => {
        // Always add if repeats are allowed
        if (allowRepeats) return [...prev, meal];
        // Don't add if already in liked meals and repeats not allowed
        if (prev.some(m => m.id === meal.id)) return prev;
        return [...prev, meal];
      });
    } else if (!isButtonClick) {
      // Add to disliked meals if swiping left
      setDislikedMeals(prev => {
        if (prev.some(m => m.id === meal.id)) return prev;
        return [...prev, meal];
      });
    }

    // Remove just the top card
    setCurrentMeals(prev => prev.slice(1));

    // If this was the last card, check for more meals immediately
    if (isLastCard) {
      // Get available meals based on current filters and repeat settings
      let availableMeals = [...meals];
      
      // If repeats are not allowed, remove already liked/seen meals and disliked meals
      if (!allowRepeats) {
        availableMeals = availableMeals.filter(meal => 
          !likedMeals.some(liked => liked.id === meal.id) &&
          !dislikedMeals.some(disliked => disliked.id === meal.id)
        );
      }

      // Apply type filters if any are selected
      if (selectedFilters.length > 0) {
        availableMeals = availableMeals.filter(meal => {
          const mealTypes = Array.isArray(meal.meal_types) 
            ? meal.meal_types
                .filter(Boolean)
                .map(type => typeof type === 'string' ? type.toLowerCase() : '')
                .filter(type => type !== '')
            : [];
          
          if (mealTypes.length === 0) return false;
          
          return selectedFilters.some(filter => 
            mealTypes.includes(filter.toLowerCase())
          );
        });
      }

      // Only set new meals if there are available ones
      if (availableMeals.length > 0 && (allowRepeats || availableMeals.length > likedMeals.length)) {
        const shuffled = [...availableMeals].sort(() => Math.random() - 0.5);
        setTimeout(() => {
          setCurrentMeals(shuffled.slice(0, 5));
        }, 300); // Small delay to ensure smooth transition
      }
    }
    // Only refill if we're completely out of cards
    else if (currentMeals.length === 0) {
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
    
    // Calculate new position with smoothing
    const currentX = e.touches[0].clientX - startX;
    const smoothedX = currentX * 0.95; // Apply same smoothing as mouse movement
    
    setOffsetX(smoothedX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    // Reset all touch-related states
    setIsDragging(false);
    setTouchStart(0);
    setStartX(0);

    // Use absolute offset for threshold check
    const absOffset = Math.abs(offsetX);
    const swipeThreshold = currentMeals.length === 1 ? 50 : 75;
    
    if (absOffset > swipeThreshold) {
      const isRight = offsetX > 0;
      handleSwipe(isRight);
    } else {
      // Reset position and ensure no toast is shown for incomplete swipes
      setOffsetX(0);
      setSelectedMeal(null);
    }
  };

  const removeLikedMeal = (mealId: string) => {
    setLikedMeals(prev => prev.filter(meal => meal.id !== mealId));
  };

  const createMealPlan = async () => {
    if (isCreatingPlan) return;
    setIsCreatingPlan(true);

    try {
      // Show creating state
      setSelectedMeal({
        id: 'temp',
        name: '⏳ Creating meal plan...',
        user_id: user?.id || '',
        meal_types: [],
        created_at: new Date().toISOString(),
        ingredients: [],
        visibility: 'private'
      });

      // Calculate dates and create plan
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + likedMeals.length - 1);

      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric'
        });
      };

      // Create unique name with timestamp
      const timestamp = new Date().getTime();
      const planName = `Meal Plan ${formatDate(startDate)} - ${formatDate(endDate)} (${timestamp})`;

      // Shuffle the liked meals to randomize their order
      const shuffledMeals = [...likedMeals].sort(() => Math.random() - 0.5);

      // Create the meal plan
      const { data: mealPlan, error: mealPlanError } = await supabase
        .from('meal_plans')
        .insert({
          user_id: user?.id,
          name: planName,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          plan: {
            [formatDate(startDate)]: {
              breakfast: null,
              lunch: null,
              dinner: shuffledMeals[0] || null
            },
            ...shuffledMeals.slice(1).reduce((acc, meal, index) => {
              const date = new Date(startDate);
              date.setDate(startDate.getDate() + index + 1);
              return {
                ...acc,
                [formatDate(date)]: {
                  breakfast: null,
                  lunch: null,
                  dinner: meal
                }
              };
            }, {})
          },
          no_repeat: !allowRepeats
        })
        .select()
        .single();

      if (mealPlanError) {
        throw new Error(`Please try creating your meal plan again`);
      }

      if (!mealPlan) {
        throw new Error('Please try creating your meal plan again');
      }

      // Show success message with meal count and date range
      setSelectedMeal({
        id: 'success',
        name: `✨ Created ${likedMeals.length} day meal plan: ${formatDate(startDate)} - ${formatDate(endDate)} ✨`,
        user_id: user?.id || '',
        meal_types: [],
        created_at: new Date().toISOString(),
        ingredients: [],
        visibility: 'private'
      });

      // Wait to show success message
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Show redirect message
      setSelectedMeal({
        id: 'redirect',
        name: '🚀 Taking you to your meal plan...',
        user_id: user?.id || '',
        meal_types: [],
        created_at: new Date().toISOString(),
        ingredients: [],
        visibility: 'private'
      });

      // Wait before redirecting
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Clear and redirect
      setSelectedMeal(null);
      setLikedMeals([]);
      setShowLikedPanel(false);
      router.push(`/dashboard?panel=meal-plans`);

    } catch (err) {
      console.error('Error:', err);
      // Show a friendly message instead of an error
      setSelectedMeal({
        id: 'retry',
        name: '✨ Let\'s try that again! ✨',
        user_id: user?.id || '',
        meal_types: [],
        created_at: new Date().toISOString(),
        ingredients: [],
        visibility: 'private'
      });
      // Show message for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSelectedMeal(null);
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const handleFilterClick = (type: string) => {
    console.log('Filter clicked:', type);
    const normalizedType = type.toLowerCase();
    console.log('Normalized type:', normalizedType);
    
    const newFilters = selectedFilters.includes(normalizedType)
      ? [] // If clicking the active filter, clear all filters
      : [normalizedType]; // Otherwise, set only this filter
    
    console.log('New filters:', newFilters);
    setSelectedFilters(newFilters);
    
    // Use the new filters immediately instead of waiting for state update
    let availableMeals = [...meals];
    
    // If repeats are not allowed, remove already liked/seen meals
    if (!allowRepeats) {
      availableMeals = availableMeals.filter(meal => 
        !likedMeals.some(liked => liked.id === meal.id)
      );
    }

    // Apply type filters using newFilters instead of selectedFilters
    let filteredMeals = availableMeals;
    
    if (newFilters.length > 0) {
      console.log('Filtering meals with new filters:', newFilters);
      filteredMeals = availableMeals.filter(meal => {
        console.log('Checking meal:', meal.name);
        console.log('Raw meal_types:', meal.meal_types);
        
        // Ensure meal_types is a valid array of lowercase strings
        const mealTypes = Array.isArray(meal.meal_types) 
          ? meal.meal_types
              .filter(Boolean)  // Remove null/undefined values
              .map(type => typeof type === 'string' ? type.toLowerCase() : '')
              .filter(type => type !== '')  // Remove empty strings
          : [];
          
        console.log('Processed meal_types:', mealTypes);
        
        // If no meal types and filters are selected, exclude the meal
        if (mealTypes.length === 0) {
          console.log('Meal has no types, excluding');
          return false;
        }

        // Check if ANY of the selected filters match the meal's types
        const hasMatchingType = newFilters.some(filter => {
          const matches = mealTypes.includes(filter);
          console.log(`Checking if ${filter} matches any of`, mealTypes, ':', matches);
          return matches;
        });

        console.log('Meal matches filter:', hasMatchingType);
        return hasMatchingType;
      });
    }

    console.log('Filtered meals:', filteredMeals.map(m => ({ name: m.name, types: m.meal_types })));

    // Fisher-Yates shuffle
    const shuffled = [...filteredMeals];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    setCurrentMeals(shuffled.slice(0, 5)); // Show 5 cards at a time
  };

  // Add cleanup effect to reset states when component unmounts
  useEffect(() => {
    return () => {
      setIsDragging(false);
      setOffsetX(0);
      setStartX(0);
      setTouchStart(0);
      setLastTime(0);
      setVelocity(0);
    };
  }, []);

  // Clear all meals handler
  const handleClearAll = () => {
    // Clear liked and disliked meals
    setLikedMeals([]);
    setDislikedMeals([]);
    // Clear any filters that might be active
    setSelectedFilters([]);
    // Get all meals and shuffle them
    const shuffled = [...meals].sort(() => Math.random() - 0.5);
    // Set the current meals immediately
    setCurrentMeals(shuffled.slice(0, 5));
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 pb-32">
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
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-primary mb-2">Random Meal Selector</h1>
            <p className="text-text-secondary mb-4">
              {isMobile 
                ? "Swipe right to select a meal, left to skip!"
                : "Swipe or use buttons to select your next meal!"}
            </p>

            {availableMealTypes.length > 0 && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-primary mb-3">Filter by Meal Type</h2>
                <div className="flex flex-wrap gap-2">
                  {availableMealTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleFilterClick(type)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedFilters.includes(type.toLowerCase())
                          ? 'bg-accent text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add Repeat Meals Toggle */}
            <div className="mb-8 bg-white rounded-xl p-4 shadow-sm hover:shadow transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                    allowRepeats ? 'bg-accent/10' : 'bg-gray-50'
                  }`}>
                    <FaRepeat className={`h-4 w-4 transition-colors duration-200 ${
                      allowRepeats ? 'text-accent' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Allow Repeat Meals</h3>
                    <p className="text-xs text-gray-500">Add the same meal multiple times to your plan</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setAllowRepeats(!allowRepeats);
                    shuffleAndSetMeals(meals);
                  }}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-opacity-75 ${
                    allowRepeats ? 'bg-accent' : 'bg-gray-200'
                  }`}
                >
                  <span className="sr-only">Toggle repeat meals</span>
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      allowRepeats ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
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
          </div>

          <div className="relative mx-auto" style={{ height: '400px' }}>
            <div className="absolute inset-0">
              {currentMeals.length > 0 ? (
                currentMeals.map((meal, index) => (
                  <div
                    key={meal.id}
                    ref={index === 0 ? cardRef : null}
                    className={`absolute inset-0 bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 select-none touch-none ${
                      index === 0 ? 'z-10' : 'z-0'
                    } ${isDragging ? 'cursor-grabbing' : index === 0 && !isMobile ? 'cursor-grab' : 'cursor-default'}`}
                    style={{
                      transform: index === 0 
                        ? `translateX(${offsetX}px) rotate(${offsetX * 0.03}deg)`
                        : currentMeals.length === 1
                          ? `translateY(4px) scale(0.98) rotate(2deg)`
                          : `translateY(${index * 4}px) scale(${1 - index * 0.05})`,
                      opacity: index === 0 ? 1 : currentMeals.length === 1 ? 0.1 : 1 - index * 0.2,
                      transition: isDragging 
                        ? 'none' 
                        : 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                      touchAction: 'none'
                    }}
                    onMouseDown={!isMobile ? handleMouseDown : undefined}
                    onMouseMove={!isMobile ? handleMouseMove : undefined}
                    onMouseUp={!isMobile ? handleMouseUp : undefined}
                    onMouseLeave={!isMobile ? handleMouseUp : undefined}
                    onTouchStart={isMobile ? handleTouchStart : undefined}
                    onTouchMove={isMobile ? handleTouchMove : undefined}
                    onTouchEnd={isMobile ? handleTouchEnd : undefined}
                  >
                    <div className="p-4 h-full flex flex-col select-none">
                      <div className="flex-1 select-none">
                        <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                          <FaUtensils className="h-6 w-6 text-accent" />
                        </div>
                        <h3 className="text-xl font-bold text-primary mb-2 text-center">{meal.name}</h3>
                        {meal.meal_types && meal.meal_types.length > 0 && (
                          <div className="flex justify-center gap-2 mb-2">
                            {meal.meal_types.map((type, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-accent/10 text-accent rounded-full text-sm"
                              >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {index === 0 && !isMobile && (
                        <div className="flex justify-center gap-6 mt-2 select-none">
                          <button
                            onClick={() => handleSwipe(false, true)}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                          >
                            <FaXmark className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleSwipe(true, true)}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 text-green-500 hover:bg-green-200 transition-colors"
                          >
                            <FaHeart className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                      {currentMeals.length === 1 && index === 0 && (
                        <div className="mt-4 text-center">
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm">
                            <FaDice className="h-3 w-3" />
                            Last card - swipe to reshuffle
                          </span>
                        </div>
                      )}
                    </div>

                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        opacity: Math.min(Math.abs(offsetX) / 75, 1),
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
                          opacity: Math.min(Math.abs(offsetX) / 75, 1),
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
                ))
              ) : (
                <div className="absolute inset-0 bg-white rounded-xl shadow-lg p-8 flex flex-col items-center justify-center text-center pointer-events-none">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FaUtensils className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-2">No More Meals Available</h3>
                  <p className="text-gray-500">
                    You've gone through all your meals. Add more meals to your deck!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Remove the reshuffle button when showing the empty state */}
          {currentMeals.length > 0 && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => shuffleAndSetMeals(meals)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FaDice className="h-4 w-4" />
                Reshuffle Deck
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Liked Meals Panel */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200"
        style={{ zIndex: 1000 }}
      >
        <div className="container mx-auto max-w-4xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaHeart className="text-accent h-5 w-5" />
              <h3 className="text-lg font-semibold">Liked Meals ({likedMeals.length})</h3>
            </div>
            <div className="flex flex-col items-end gap-2">
              {/* Status Messages */}
              {selectedMeal && (
                <div 
                  className={`
                    rounded-lg px-6 py-3 flex items-center gap-3 text-base font-medium
                    ${selectedMeal.id === 'success' || selectedMeal.id === 'redirect'
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : selectedMeal.id === 'temp'
                      ? 'bg-blue-50 text-blue-800 border border-blue-100'
                      : 'bg-blue-50 text-blue-800 border border-blue-100'
                    }
                  `}
                >
                  {selectedMeal.id === 'success' || selectedMeal.id === 'redirect' ? (
                    <div className="text-xl">✨</div>
                  ) : selectedMeal.id === 'temp' ? (
                    <div className="h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="text-xl">✨</div>
                  )}
                  <span>{selectedMeal.name}</span>
                </div>
              )}
              
              {/* Buttons */}
              {likedMeals.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearAll}
                    className="text-gray-500 hover:text-gray-700 flex items-center gap-2 px-3 py-1 rounded-full hover:bg-gray-100"
                  >
                    <FaTrash className="h-4 w-4" />
                    Clear All
                  </button>
                  <button
                    onClick={createMealPlan}
                    disabled={isCreatingPlan}
                    className={`relative px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                      isCreatingPlan 
                        ? 'bg-gray-200 cursor-not-allowed transform scale-95 opacity-70'
                        : 'bg-accent text-white hover:bg-accent/90 active:scale-95 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isCreatingPlan ? (
                      <>
                        <div className="absolute inset-0 bg-gray-100 rounded-lg overflow-hidden">
                          <div className="h-full bg-gray-200 animate-progress" />
                        </div>
                        <div className="h-5 w-5 border-3 border-gray-400 border-t-gray-600 rounded-full animate-spin relative z-10" />
                        <span className="text-gray-600 font-medium relative z-10">Creating Your Plan...</span>
                      </>
                    ) : (
                      <>
                        <FaCalendarPlus className="h-4 w-4" />
                        <span className="font-medium">Create Meal Plan</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {likedMeals.length > 0 ? (
            <div className="mt-4 overflow-x-auto pb-2 hide-scrollbar">
              <div className="flex gap-2 min-w-min">
                {likedMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex-none flex items-center gap-2 bg-gray-100 rounded-full pl-3 pr-2 py-1 whitespace-nowrap"
                  >
                    <span className="text-sm font-medium">{meal.name}</span>
                    <button
                      onClick={() => removeLikedMeal(meal.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <FaXmark className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center mt-2">
              Swipe right or click the heart to add meals to your plan
            </p>
          )}
        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        @keyframes progress {
          0% { width: 0; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 4s linear;
        }
      `}</style>
    </div>
  );
} 