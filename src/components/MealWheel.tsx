import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPlus, FaCheck, FaSave } from 'react-icons/fa';
import type { FavoriteFood } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface MealWheelProps {
  foods: FavoriteFood[];
}

export default function MealWheel({ foods }: MealWheelProps) {
  const { user } = useAuth();
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FavoriteFood | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [keepInWheel, setKeepInWheel] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<FavoriteFood[]>([]);
  const [savingPlan, setSavingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const spinWheel = () => {
    if (isSpinning || foods.length === 0) return;

    setIsSpinning(true);
    setSelectedFood(null);
    setKeepInWheel(true);

    // Calculate random rotation (between 5 and 10 full rotations) plus offset for selected food
    const baseRotation = (Math.floor(Math.random() * 5) + 5) * 360;
    const selectedIndex = Math.floor(Math.random() * foods.length);
    const segmentAngle = 360 / foods.length;
    const offset = segmentAngle * selectedIndex;
    const finalRotation = baseRotation + offset;

    // Set the new rotation angle
    setRotationAngle(finalRotation);

    // After animation completes, show the selected food
    setTimeout(() => {
      setIsSpinning(false);
      setSelectedFood(foods[selectedIndex]);
    }, 3000);
  };

  const handleAddToMealPlan = () => {
    if (!selectedFood) return;
    setCurrentPlan(prev => [...prev, selectedFood]);
    if (!keepInWheel) {
      const newFoods = foods.filter(f => f.id !== selectedFood.id);
      // You'll need to implement this prop if you want to update the parent's food list
      // onFoodsUpdate?.(newFoods);
    }
    setSuccess('Added to current plan!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSavePlan = async () => {
    if (!user || currentPlan.length === 0) return;

    try {
      setSavingPlan(true);
      setError(null);

      const { error: insertError } = await supabase
        .from('meal_plans')
        .insert([{
          user_id: user.id,
          meals: currentPlan,
          duration: 'one_week'
        }]);

      if (insertError) throw insertError;

      setSuccess('Meal plan saved successfully!');
      setCurrentPlan([]);
    } catch (err) {
      console.error('Error saving meal plan:', err);
      setError('Failed to save meal plan. Please try again.');
    } finally {
      setSavingPlan(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        {/* Wheel Section */}
        <div className="w-full md:w-1/2 flex flex-col items-center">
          <div className="relative">
            {/* Wheel Container */}
            <div className="relative w-64 h-64 md:w-72 md:h-72">
              {/* Spinner Arrow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 w-4 h-8 bg-accent z-10 clip-arrow" />
              
              {/* Wheel */}
              <motion.div
                ref={wheelRef}
                className="w-full h-full rounded-full border-4 border-accent overflow-hidden shadow-lg"
                style={{
                  transform: `rotate(${rotationAngle}deg)`,
                  transition: 'transform 3s cubic-bezier(0.17, 0.67, 0.83, 0.67)'
                }}
              >
                {/* Wheel Segments */}
                {foods.map((food, index) => {
                  const segmentAngle = 360 / foods.length;
                  const rotation = index * segmentAngle;
                  return (
                    <div
                      key={food.id}
                      className="absolute top-0 left-0 w-full h-full origin-center"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                      }}
                    >
                      <div
                        className="absolute top-0 left-0 w-1/2 h-full origin-right flex items-center justify-start pl-4"
                        style={{
                          transform: `rotate(${segmentAngle / 2}deg)`,
                          backgroundColor: index % 2 === 0 ? '#34D399' : '#6EE7B7',
                        }}
                      >
                        <span
                          className="text-sm font-medium text-white truncate max-w-[80px]"
                          style={{
                            transform: `rotate(${-rotation - segmentAngle / 2}deg)`,
                          }}
                        >
                          {food.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </div>

            {/* Spin Button */}
            <button
              onClick={spinWheel}
              disabled={isSpinning || foods.length === 0}
              className="mt-8 px-8 py-3 bg-accent text-white rounded-full font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isSpinning ? 'Spinning...' : 'Spin the Wheel'}
            </button>
          </div>
        </div>

        {/* Selected Food Section */}
        <div className="w-full md:w-1/2">
          {selectedFood ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-primary">Selected Meal</h2>
                <button
                  onClick={() => setSelectedFood(null)}
                  className="text-text-secondary hover:text-primary transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-primary mb-2">{selectedFood.name}</h3>
                
                {selectedFood.meal_types && selectedFood.meal_types.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedFood.meal_types.map((type) => (
                      <span
                        key={type}
                        className="px-2 py-1 bg-accent/10 text-accent rounded-full text-xs"
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                    ))}
                  </div>
                )}
                
                <p className="text-text-secondary mb-4">{selectedFood.ingredients}</p>
                {selectedFood.recipe && (
                  <div className="mt-4">
                    <h4 className="font-medium text-primary mb-2">Recipe Instructions:</h4>
                    <p className="text-text-secondary whitespace-pre-line">{selectedFood.recipe}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="keepInWheel"
                    checked={keepInWheel}
                    onChange={(e) => setKeepInWheel(e.target.checked)}
                    className="rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <label htmlFor="keepInWheel" className="text-sm text-text-secondary">
                    Keep this meal in the wheel for future spins
                  </label>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleAddToMealPlan}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors shadow-sm"
                  >
                    <FaPlus className="text-sm" />
                    <span>Add to Current Plan</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-center text-text-secondary">
                <p className="mb-2">Spin the wheel to get a random meal suggestion!</p>
                <p className="text-sm">Your selected meal will appear here.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current Plan Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-primary">Current Plan</h2>
          {currentPlan.length > 0 && (
            <button
              onClick={handleSavePlan}
              disabled={savingPlan}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors shadow-sm disabled:opacity-50"
            >
              {savingPlan ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FaSave className="text-sm" />
                  <span>Save Plan</span>
                </>
              )}
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border-l-4 border-red-500">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg border-l-4 border-green-500">
            {success}
          </div>
        )}

        {currentPlan.length === 0 ? (
          <div className="text-center text-text-secondary py-8">
            <p>Add meals from the wheel to create your plan!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentPlan.map((meal, index) => (
              <div
                key={`${meal.id}-${index}`}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium text-primary">{meal.name}</span>
                <button
                  onClick={() => setCurrentPlan(prev => prev.filter((_, i) => i !== index))}
                  className="text-text-secondary hover:text-red-500 transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .clip-arrow {
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }
      `}</style>
    </div>
  );
} 