'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { FaPlus, FaTrash, FaUtensils, FaTimes, FaEdit, FaSave, FaChevronLeft, FaBook, FaStar as FaStarSolid, FaEye, FaEyeSlash, FaChevronRight, FaCompass, FaUserFriends, FaLightbulb, FaSearch, FaFilter, FaChevronUp, FaChevronDown } from 'react-icons/fa';
import { FaRegStar as FaStarOutline } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import React from 'react';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';

type Food = {
  id: string;
  name: string;
  ingredients: string[] | string;
  recipe: string[] | string;
  rating: number;
  meal_types: MealType[];
};

interface FoodsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodAdded?: () => void;
}

/**
 * Z-index hierarchy for proper modal stacking:
 * - Base Panel (My Meals): z-80
 * - Add Food Modal: z-95
 * - Food Details Modal: z-90
 * - Edit Food Modal: z-100
 * - Notifications: z-110
 * 
 * This ensures that modals properly stack on top of each other
 * and are visible above other page elements.
 */

// Fix the processInstructions function to better handle escaped characters and nested arrays
const processInstructions = (recipeData: string[] | string): string[] => {
  // If empty, return empty array
  if (!recipeData) return [];
  
  let steps: string[] = [];

  try {
    // Handle array of instructions
    if (Array.isArray(recipeData)) {
      // Handle case where the array contains JSON strings or nested arrays
      steps = recipeData
        .flatMap(step => {
          // Handle sub-arrays (flatten them)
          if (Array.isArray(step)) {
            return step;
          }

          // Handle JSON string that might be an array
          if (typeof step === 'string' && step.trim().startsWith('[') && step.trim().endsWith(']')) {
            try {
              const parsed = JSON.parse(step);
              if (Array.isArray(parsed)) {
                return parsed;
              }
            } catch {
              // Not valid JSON, continue
            }
          }

          // Regular string
          return step;
        })
        .filter(step => typeof step === 'string' && step.trim().length > 0)
        .map(step => {
          if (typeof step !== 'string') return '';
          
          const cleaned = step.trim()
            .replace(/^"|"$/g, '')         // Remove surrounding quotes
            .replace(/^\[|\]$/g, '')       // Remove brackets
            .replace(/\\"/g, '"')          // Replace escaped quotes
            .replace(/\\n/g, ' ')          // Replace escaped newlines
            .replace(/\\t/g, ' ')          // Replace escaped tabs
            .replace(/\\+/g, '\\')         // Fix multiple backslashes
            .replace(/\\([^"\\])/g, '$1'); // Remove unnecessary escapes
          
          return cleaned;
        })
        .filter(step => step.length > 0);
    } 
    // Handle string that might be a stringified array or comma-separated string
    else if (typeof recipeData === 'string') {
      const trimmed = recipeData.trim();
      
      // First, check if it's a stringified JSON array
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            // Recursively process the parsed array
            return processInstructions(parsed);
          }
        } catch (e) {
          console.log('Failed to parse JSON recipe:', e);
          // Not valid JSON, continue with other parsing strategies
        }
      }
      
      // Handle strings with quotes and commas which might be a flattened array
      if (trimmed.includes('","') || trimmed.includes('", "')) {
        steps = trimmed
          .replace(/^\[|\]$/g, '')  // remove outer brackets
          .replace(/\\"/g, '"')     // replace escaped quotes
          .split(/",\s*"/)          // split on quotes with comma
          .map(s => s.replace(/^"|"$/g, '').trim()) // remove surrounding quotes
          .filter(s => s.length > 0);
      }
      // If it contains numbers followed by periods (like "1. Step one"), split on numbered steps
      else if (/\d+\./.test(trimmed)) {
        steps = trimmed
          .replace(/^\[|\]$/g, '')    // remove brackets
          .replace(/\\"/g, '"')       // replace escaped quotes
          .replace(/^"|"$/g, '')      // remove outer quotes
          .replace(/\\+/g, '\\')      // fix multiple backslashes
          .split(/(?=\d+\.)/)         // split before numbered steps
          .map(s => s.trim())
          .filter(s => s.length > 0);
      }
      // If it has escaped quotes followed by commas (like \"Step one\",\"Step two\")
      else if (trimmed.includes('\\"') || trimmed.includes('\\\\"')) {
        steps = trimmed
          .replace(/^\[|\]$/g, '')        // remove brackets
          .replace(/\\\\"/g, '"')         // replace double-escaped quotes
          .replace(/\\"/g, '"')           // replace escaped quotes
          .replace(/^"|"$/g, '')          // remove outer quotes
          .split(/",\s*"/)                // split on quotes with comma
          .map(s => s.replace(/^"|"$/g, '').trim()) // clean up quotes
          .filter(s => s.length > 0);
      }
      // If it has backslashes in the text (like with escaped characters)
      else if (trimmed.includes('\\')) {
        steps = trimmed
          .replace(/^\[|\]$/g, '')        // remove brackets
          .replace(/\\"/g, '"')           // replace escaped quotes
          .replace(/\\n/g, ' ')           // replace escaped newlines
          .replace(/\\t/g, ' ')           // replace escaped tabs
          .replace(/\\+/g, '\\')          // fix multiple backslashes
          .replace(/\\([^"\\])/g, '$1')   // remove unnecessary escapes
          .replace(/^"|"$/g, '')          // remove outer quotes
          .split(/",\s*"/)                // split on quotes with comma
          .map(s => s.replace(/^"|"$/g, '').trim()) // clean up quotes
          .filter(s => s.length > 0);
        
        // If still no steps, try splitting by other means
        if (steps.length <= 1) {
          steps = trimmed
            .replace(/\\"/g, '"')
            .replace(/^\[|\]$/g, '')
            .replace(/^"|"$/g, '')
            .split(/[\r\n]+|\\n+|","|",\s*"/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
        }
      }
      // If it has newlines, split by newlines
      else if (trimmed.includes('\n')) {
        steps = trimmed
          .replace(/^\[|\]$/g, '')  // remove brackets
          .replace(/\\"/g, '"')     // replace escaped quotes
          .replace(/^"|"$/g, '')    // remove outer quotes
          .split('\n')              // split by newlines
          .map(s => s.trim())
          .filter(s => s.length > 0);
      }
      // As a last resort, split by commas
      else {
        steps = trimmed
          .replace(/^\[|\]$/g, '')  // remove brackets
          .replace(/\\"/g, '"')     // replace escaped quotes
          .replace(/^"|"$/g, '')    // remove outer quotes
          .split(',')               // split by commas
          .map(s => s.trim())
          .filter(s => s.length > 0);
      }
    }
    
    // Final cleanup - make sure we don't have any corrupted items
    return steps
      .filter(Boolean)
      .map(step => {
        if (typeof step !== 'string') return '';
      
        let cleaned = step;
        // Remove any remaining quotes and brackets
        cleaned = cleaned.replace(/^"|"$/g, '');
        cleaned = cleaned.replace(/^\[|\]$/g, '');
        
        // Handle escaped quotes, newlines, backslashes again in case previous steps missed any
        cleaned = cleaned.replace(/\\"/g, '"');
        cleaned = cleaned.replace(/\\n/g, ' ');
        cleaned = cleaned.replace(/\\t/g, ' ');
        cleaned = cleaned.replace(/\\+/g, '\\');
        cleaned = cleaned.replace(/\\([^"\\])/g, '$1');
        
        return cleaned;
      })
      .filter(step => step && step.length > 0);
  } catch (error) {
    console.error("Error processing recipe instructions:", error, recipeData);
    // If processing fails, return the original data as a string
    if (Array.isArray(recipeData)) {
      return recipeData.map(r => typeof r === 'string' ? r : '').filter(Boolean);
    }
    if (typeof recipeData === 'string') {
      return recipeData.split('\n').filter(line => line.trim().length > 0);
    }
    return [];
  }
};

export default function FoodsPanel({ isOpen, onClose, onFoodAdded }: FoodsPanelProps) {
  const { user, refreshSession } = useAuth();
  const [foods, setFoods] = useState<Food[]>([]);
  const [newFood, setNewFood] = useState({ 
    name: '', 
    ingredients: '', 
    recipe: '',
    rating: 0,
    meal_types: [] as MealType[],
    visibility: 'public' as 'public' | 'private'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(210);
  const [filters, setFilters] = useState({
    mealTypes: [] as MealType[],
    minRating: 0
  });
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: '' });
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [successNotification, setSuccessNotification] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: '' });

  useEffect(() => {
    if (isOpen && user) {
      fetchFoods();
    }
  }, [isOpen, user]);

  // Add useEffect to prevent background scrolling when panel is open
  useEffect(() => {
    if (isOpen) {
      // Don't lock the body scroll on mobile or desktop
      document.body.style.overflow = 'auto';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Add useEffect to handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        // Always maintain scrollability
        document.body.style.overflow = 'auto';
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Add useEffect to clear error notification after 3 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  // Update header height when filters visibility changes
  useEffect(() => {
    if (headerRef.current && contentRef.current) {
      // Use setTimeout to measure after the animation completes
      setTimeout(() => {
        const height = headerRef.current?.getBoundingClientRect().height || 0;
        if (height > 0 && contentRef.current) {
          setHeaderHeight(height);
          contentRef.current.style.paddingTop = `${height}px`;
        }
      }, 300); // Wait for animation to complete
    }
  }, [filtersVisible]);

  // Measure header on mount and window resize
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current && contentRef.current) {
        const height = headerRef.current?.getBoundingClientRect().height || 0;
        if (height > 0) {
          setHeaderHeight(height);
          contentRef.current.style.paddingTop = `${height}px`;
        }
      }
    };

    // Initial measurement
    updateHeaderHeight();
    
    // Measurement after a short delay (for layout to stabilize)
    setTimeout(updateHeaderHeight, 100);

    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

  // Completely different approach: reset body scroll
  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, []);

  // Add useEffect to handle success notification timeout
  useEffect(() => {
    if (successNotification.show) {
      const timer = setTimeout(() => {
        setSuccessNotification({ show: false, message: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successNotification.show]);

  const fetchFoods = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('favorite_foods')
        .select('id, name, ingredients, recipe, rating, meal_types')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      setFoods(data || []);
    } catch (err) {
      console.error('Error fetching foods:', err);
      setError('Failed to fetch foods. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotification({ show: false, message: '' });

    // Convert comma-separated ingredients to array
    const ingredientsArray = newFood.ingredients
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    // Convert recipe instructions from newline-separated to array
    const recipeArray = newFood.recipe
      .split('\n')
      .map(step => step.trim())
      .filter(step => step.length > 0);

    // Convert meal types to array
    const mealTypesArray = newFood.meal_types.length > 0 ? newFood.meal_types : [];

    try {
      const { error } = await supabase
        .from('favorite_foods')
        .insert([
          {
            user_id: user?.id,
            name: newFood.name,
            ingredients: ingredientsArray,
            recipe: recipeArray, // Store as array, not string
            rating: newFood.rating,
            meal_types: mealTypesArray,
            visibility: newFood.visibility
          }
        ]);

      if (error) {
        console.error('Error adding food:', error);
        if (error.code === '23505') {
          setNotification({
            show: true,
            message: `"${newFood.name}" already exists in your food collection`
          });
        } else {
          setNotification({
            show: true,
            message: 'Failed to add food. Please try again.'
          });
        }
        return;
      }

      // Clear form and close modal
      setNewFood({ 
        name: '', 
        ingredients: '', 
        recipe: '', 
        rating: 0, 
        meal_types: [],
        visibility: 'public'
      });
      setIsAddingFood(false);
      
      // Refresh foods list
      fetchFoods();
      if (onFoodAdded) onFoodAdded();
    } catch (error) {
      console.error('Error adding food:', error);
      setNotification({
        show: true,
        message: 'Failed to add food. Please try again.'
      });
    }
  };

  const handleUpdateFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFood) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('favorite_foods')
        .update({
          name: editingFood.name,
          ingredients: editingFood.ingredients,
          recipe: editingFood.recipe
        })
        .eq('id', editingFood.id)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error updating food:', error);
        setError(`Failed to update food: ${error.message}`);
        return;
      }

      setSuccess('Food updated successfully!');
      setEditingFood(null);
      await fetchFoods();
      if (onFoodAdded) onFoodAdded();
    } catch (err: any) {
      console.error('Unexpected error updating food:', err);
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFood = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const { error } = await supabase
        .from('favorite_foods')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error deleting food:', error);
        setError(`Failed to delete food: ${error.message}`);
        return;
      }

      setSuccess('Food deleted successfully!');
      await fetchFoods();
      if (onFoodAdded) onFoodAdded();
    } catch (err: any) {
      console.error('Unexpected error deleting food:', err);
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredFoods = foods.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (Array.isArray(food.ingredients) 
        ? food.ingredients.some(ingredient => ingredient.toLowerCase().includes(searchTerm.toLowerCase()))
        : typeof food.ingredients === 'string' && food.ingredients.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesMealType = filters.mealTypes.length === 0 || 
      (food.meal_types && food.meal_types.some(type => filters.mealTypes.includes(type)));
    
    const matchesRating = filters.minRating === 0 ? true : food.rating >= filters.minRating;

    return matchesSearch && matchesMealType && matchesRating;
  });

  const startEditing = (food: Food) => {
    // When starting to edit, close the detail view first
    setSelectedFood(null);
    
    // Short delay before opening the edit modal for better UX
    setTimeout(() => {
      // Create a clean copy of the food object with all recipe steps properly formatted
      let formattedRecipe = '';
      
      // Format recipe instructions for editing - ensure all steps are visible
      if (Array.isArray(food.recipe)) {
        // Process array of steps into newline-separated text
        formattedRecipe = food.recipe
          .map(step => typeof step === 'string' ? step.trim() : '')
          .filter(Boolean)
          .join('\n');
      } else if (typeof food.recipe === 'string') {
        // Process string instructions - try to parse as JSON or split by newlines
        try {
          if (food.recipe.trim().startsWith('[') && food.recipe.trim().endsWith(']')) {
            const parsed = JSON.parse(food.recipe);
            if (Array.isArray(parsed)) {
              formattedRecipe = parsed
                .map(step => typeof step === 'string' ? step.trim() : '')
                .filter(Boolean)
                .join('\n');
            } else {
              formattedRecipe = food.recipe;
            }
          } else {
            // Split by newlines if they exist, or commas otherwise
            formattedRecipe = food.recipe.includes('\n') 
              ? food.recipe 
              : food.recipe.split(',').map(s => s.trim()).join('\n');
          }
        } catch (e) {
          console.log('Error parsing recipe:', e);
          formattedRecipe = food.recipe;
        }
      }
      
      // Format ingredients as well
      const formattedIngredients = Array.isArray(food.ingredients)
        ? food.ingredients.join(', ')
        : typeof food.ingredients === 'string'
          ? food.ingredients
          : '';
      
      const foodToEdit = {
        ...food,
        ingredients: formattedIngredients,
        recipe: formattedRecipe
      };
      
      setEditingFood(foodToEdit);
    }, 100);
  };

  const cancelEditing = () => {
    setEditingFood(null);
  };

  const mealTypeOptions: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];

  const handleMealTypeToggle = (type: MealType) => {
    setNewFood(prev => {
      const types = prev.meal_types.includes(type)
        ? prev.meal_types.filter(t => t !== type)
        : [...prev.meal_types, type];
      return { ...prev, meal_types: types };
    });
  };

  const handleRatingChange = (rating: number) => {
    setNewFood(prev => ({ ...prev, rating }));
  };

  const StarRating = ({ rating, onRatingChange }: { rating: number; onRatingChange: (rating: number) => void }) => {
    const ratingId = Math.random().toString(36).substring(2, 9);
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={`rating-${ratingId}-${star}`}
            type="button"
            onClick={() => onRatingChange(star)}
            className="text-xl focus:outline-none"
          >
            {star <= rating ? (
              <FaStarSolid className="text-yellow-400" />
            ) : (
              <FaStarOutline className="text-gray-300 hover:text-yellow-400" />
            )}
          </button>
        ))}
      </div>
    );
  };

  const handleEditFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingFood) return;

    try {
      setLoading(true);
      setError(null);

      // Convert comma-separated string to array before saving
      const ingredientsArray = typeof editingFood.ingredients === 'string'
        ? editingFood.ingredients.split(',').map(item => item.trim()).filter(item => item.length > 0)
        : editingFood.ingredients;

      // Find the originally selected food to compare what's missing
      const originalFood = foods.find(f => f.id === editingFood.id);
      
      // Process recipe instructions - clean and normalize steps
      let recipeInstructions: string[] = [];
      
      if (typeof editingFood.recipe === 'string') {
        // Simply use the edited steps from the textarea as they are
        const editedStepsText = editingFood.recipe.trim();
        const editedSteps = editedStepsText
          .split('\n')
          .map(step => step.trim())
          .filter(step => step.length > 0);
        
        // Use the exact steps the user has edited, preserving their order and content
        recipeInstructions = editedSteps;
        
        // No need to try to merge with previous steps - the user should see all steps in the edit form
        console.log("Using recipe steps directly from the edit form:", recipeInstructions);
      } else if (Array.isArray(editingFood.recipe)) {
        // Clean each step in the array
        recipeInstructions = editingFood.recipe
          .filter(step => typeof step === 'string' && step.trim().length > 0)
          .map(step => {
            if (typeof step !== 'string') return '';
            return step.trim()
              .replace(/^"|"$/g, '')         // Remove surrounding quotes
              .replace(/^\[|\]$/g, '')       // Remove brackets 
              .replace(/\\"/g, '"')          // Replace escaped quotes
              .replace(/\\n/g, ' ')          // Replace escaped newlines
              .replace(/\\([^"\\])/g, '$1'); // Remove unnecessary escapes
          })
          .filter(Boolean);
      }

      // Log the clean instructions for debugging
      console.log("Clean recipe instructions to save:", recipeInstructions);

      // Create the updated food object with all changes
      const updatedFood: Food = {
        ...editingFood,
        ingredients: ingredientsArray,
        recipe: recipeInstructions,
      };

      const { error: updateError } = await supabase
        .from('favorite_foods')
        .update({
          name: editingFood.name,
          ingredients: ingredientsArray,
          recipe: recipeInstructions, // Store as array, not as string
          rating: editingFood.rating,
          meal_types: editingFood.meal_types,
        })
        .eq('id', editingFood.id);

      if (updateError) throw updateError;

      // Show success notification
      setSuccessNotification({
        show: true,
        message: 'Meal updated successfully!'
      });
      
      // Clear editing state
      setEditingFood(null);
      
      // IMPORTANT: Update the selectedFood with the updated data immediately 
      // so the user sees the changes without having to navigate away and back
      setSelectedFood(updatedFood);
      
      // Also refresh foods list in the background for consistency
      fetchFoods();
      
    } catch (err) {
      console.error('Error updating food:', err);
      setError('Failed to update food. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMealTypeToggle = (type: MealType) => {
    if (!editingFood) return;
    
    setEditingFood(prev => {
      if (!prev) return prev;
      const types = prev.meal_types.includes(type)
        ? prev.meal_types.filter(t => t !== type)
        : [...prev.meal_types, type];
      return { ...prev, meal_types: types };
    });
  };

  const handleEditRatingChange = (rating: number) => {
    if (!editingFood) return;
    setEditingFood(prev => prev ? { ...prev, rating } : prev);
  };

  // Helper component to render recipe instructions with proper error handling
  const RecipeInstructions: React.FC<{ recipe: string[] | string }> = ({ recipe }) => {
    try {
      const processedSteps = processInstructions(recipe);
      
      // If we failed to get any steps or the data is corrupted, show a warning
      if (processedSteps.length === 0) {
        return (
          <p className="text-amber-600">
            The recipe instructions appear to be in an unsupported format. Please edit this meal to update the instructions.
          </p>
        );
      }
      
      // Return nicely formatted instructions
      return (
        <>
          {processedSteps.map((step: string, index: number) => (
            <div key={index} className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-medium">
                {index + 1}
              </div>
              <p className="text-gray-600 sm:text-base flex-1">{step}</p>
            </div>
          ))}
        </>
      );
    } catch (err) {
      console.error("Error displaying recipe steps:", err);
      return (
        <p className="text-amber-600">
          There was an error displaying the recipe instructions. Please edit this meal to update the instructions.
        </p>
      );
    }
  };

  return (
    <>
      {/* Error Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-110 bg-red-50 text-red-600 px-4 py-3 rounded-xl shadow-lg border border-red-100 flex items-center gap-2"
          >
            <div className="text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      <AnimatePresence>
        {successNotification.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-110 bg-green-50 text-green-600 px-4 py-3 rounded-xl shadow-lg border border-green-100 flex items-center gap-2"
          >
            <div className="text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            {successNotification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="foods-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-80 flex items-start justify-center overflow-hidden"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-b-2xl sm:rounded-2xl shadow-xl w-full max-w-2xl h-[100vh] sm:h-[90vh] flex flex-col my-0 sm:mt-4 relative z-10"
              ref={panelRef}
            >
              {/* Fixed Header */}
              <div 
                ref={headerRef}
                className="absolute top-0 left-0 right-0 bg-white z-30 rounded-t-2xl shadow-sm"
                style={{ zIndex: 30 }}
              >
                <div className="p-4 flex justify-between items-center border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <FaUtensils className="text-[#319141] text-xl" />
                    <h2 className="text-2xl font-bold text-[#0F1E0F]">My Meals</h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-[#0F1E0F] transition-colors p-2"
                    aria-label="Close panel"
                  >
                    ✕
                  </button>
                </div>

                {/* Add New Meal Button - Always visible */}
                <div className="px-4 py-4">
                  <button
                    onClick={() => setIsAddingFood(true)}
                    className="w-full bg-[#319141] text-white p-3 rounded-xl hover:bg-[#0F1E0F] transition-colors flex items-center justify-center gap-2"
                  >
                    <FaPlus className="text-sm" />
                    Add New Meal
                  </button>
                </div>

                {/* Search and Filters - Fixed position */}
                <div className="px-4 py-2 border-t border-b border-gray-100 bg-white">
                  {/* Search Bar - Always visible */}
                  <div className="relative mb-3">
                    <input
                      type="text"
                      placeholder="Search meals by name or ingredient"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-3 pr-10 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-[#319141] focus:ring-1 focus:ring-[#319141]"
                    />
                    <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>

                  {/* Filters Toggle Button */}
                  <button
                    onClick={() => setFiltersVisible(!filtersVisible)}
                    className="w-full mb-2 flex items-center justify-between p-2 text-[#319141] font-medium rounded-lg bg-[#319141]/5 hover:bg-[#319141]/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FaFilter className="text-sm" />
                      <span>Filters</span>
                    </div>
                    <div className="text-sm">
                      {filtersVisible ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                  </button>

                  {/* Collapsible Filters */}
                  <AnimatePresence>
                    {filtersVisible && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden mb-2"
                      >
                        <div className="flex flex-col gap-3 py-2">
                          <div>
                            <label className="block text-sm font-medium text-[#0F1E0F] mb-2">
                              Filter by Meal Type
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {mealTypeOptions.map((type) => (
                                <button
                                  key={type}
                                  onClick={() => {
                                    setFilters(prev => ({
                                      ...prev,
                                      mealTypes: prev.mealTypes.includes(type)
                                        ? prev.mealTypes.filter(t => t !== type)
                                        : [...prev.mealTypes, type]
                                    }));
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    filters.mealTypes.includes(type)
                                      ? 'bg-[#319141] text-white'
                                      : 'bg-[#319141]/10 text-[#319141] hover:bg-[#319141]/20'
                                  }`}
                                >
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#0F1E0F] mb-2">
                              Minimum Rating
                            </label>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {[0, 1, 2, 3, 4, 5].map((rating) => (
                                <button
                                  key={rating}
                                  onClick={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                                  className={`min-w-[40px] px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    filters.minRating === rating
                                      ? 'bg-[#319141] text-white'
                                      : 'bg-[#319141]/10 text-[#319141] hover:bg-[#319141]/20'
                                  }`}
                                >
                                  {rating === 0 ? 'All' : `${rating}★`}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Scrollable Content Area with padding to account for fixed header */}
              <div 
                ref={contentRef}
                className="h-full overflow-y-auto overscroll-contain"
                style={{
                  paddingTop: `${headerHeight || 0}px`,
                  paddingBottom: '32px'
                }}
              >
                {/* Meal List */}
                <div className="p-4 pb-32">
                  {loading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="w-8 h-8 border-4 border-[#319141] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : foods.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {filteredFoods.map((food) => (
                        <div 
                          key={food.id}
                          className="bg-[#319141]/5 rounded-xl p-4 hover:bg-[#319141]/10 transition-colors cursor-pointer"
                          onClick={() => setSelectedFood(food)}
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium text-[#0F1E0F] mb-1">{food.name}</h3>
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {food.meal_types?.length > 0 ? (
                                    food.meal_types.map((type: string, index: number) => (
                                      <span 
                                        key={index}
                                        className="px-2 py-0.5 bg-[#319141]/10 text-[#319141] rounded text-xs"
                                      >
                                        {type}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-gray-500 text-xs italic">No meal type</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {food.rating > 0 && (
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <FaStarSolid
                                        key={star}
                                        className={`w-3.5 h-3.5 ${star <= food.rating ? "text-yellow-400" : "text-gray-200"}`}
                                      />
                                    ))}
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditing(food);
                                    }}
                                    className="p-1.5 text-gray-500 hover:text-[#319141] transition-colors"
                                    aria-label="Edit meal"
                                  >
                                    <FaEdit />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteFood(food.id);
                                    }}
                                    className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                                    aria-label="Delete meal"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {Array.isArray(food.ingredients) 
                                ? food.ingredients.join(', ') 
                                : food.ingredients || 'No ingredients listed'
                              }
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-[#319141]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FaUtensils className="text-[#319141] text-2xl" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#0F1E0F] mb-2">No meals added yet</h3>
                      <p className="text-gray-600 mb-4">Start building your collection of favorite meals</p>
                      <button
                        onClick={() => setIsAddingFood(true)}
                        className="px-5 py-2 rounded-xl bg-[#319141] text-white hover:bg-[#0F1E0F] transition-colors inline-flex items-center gap-2"
                      >
                        <FaPlus className="text-sm" />
                        Add Your First Meal
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Meal Modal */}
      <AnimatePresence>
        {isAddingFood && (
          <motion.div
            key="add-food-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-65 z-95 flex items-start justify-center sm:items-center pt-4 sm:p-4"
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col mb-4 sm:my-2">
              <div className="sticky top-0 bg-white z-10 border-b border-gray-100 p-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-[#319141]">Add New Meal</h3>
                <button
                  onClick={() => setIsAddingFood(false)}
                  className="text-gray-500 hover:text-[#0F1E0F] transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleAddFood} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={newFood.name}
                    onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="ingredients" className="block text-sm font-medium text-text-secondary mb-2">
                    Ingredients (comma-separated)
                  </label>
                  <textarea
                    id="ingredients"
                    value={newFood.ingredients}
                    onChange={(e) => setNewFood({ ...newFood, ingredients: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 min-h-[100px]"
                    required
                    placeholder="Example: 
Ground beef, 
Hamburger buns, 
Cheddar cheese, 
Lettuce"
                  />
                </div>

                <div>
                  <label htmlFor="recipe" className="block text-sm font-medium text-text-secondary mb-2">
                    Recipe Instructions (separate steps with line breaks)
                  </label>
                  <textarea
                    id="recipe"
                    value={newFood.recipe}
                    onChange={(e) => setNewFood({ ...newFood, recipe: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 min-h-[200px]"
                    required
                    placeholder="Enter each step on a new line:
1. Preheat the oven
2. Mix ingredients
3. Cook for 30 minutes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Rating
                  </label>
                  <StarRating rating={newFood.rating} onRatingChange={handleRatingChange} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Meal Types
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {mealTypeOptions.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleMealTypeToggle(type)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                          newFood.meal_types.includes(type)
                            ? 'bg-accent text-white'
                            : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Visibility
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setNewFood({ ...newFood, visibility: 'public' })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        newFood.visibility === 'public'
                          ? 'bg-accent text-white'
                          : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                      }`}
                    >
                      <FaEye /> Public
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewFood({ ...newFood, visibility: 'private' })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        newFood.visibility === 'private'
                          ? 'bg-accent text-white'
                          : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                      }`}
                    >
                      <FaEyeSlash /> Private
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 pb-6">
                  <button
                    type="button"
                    onClick={() => setIsAddingFood(false)}
                    className="px-6 py-2 rounded-xl border border-gray-200 text-text-secondary hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-accent text-white hover:bg-highlight transition-colors"
                  >
                    Add Meal
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Food Details Modal */}
      {selectedFood && (
        <motion.div
          key="food-details-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-60 z-90 flex items-start sm:items-start justify-center sm:overflow-auto pt-4 sm:pt-20 p-0 sm:pb-20"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl sm:max-w-3xl h-[90vh] sm:h-auto sm:max-h-none overflow-hidden flex flex-col mb-4 sm:my-0 relative">
            <div className="sticky top-0 bg-white border-b border-gray-100 flex justify-between items-center p-4 sm:p-5 z-10">
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold text-[#319141] mb-1">{selectedFood.name}</h3>
                {selectedFood.rating > 0 && (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStarSolid
                        key={star}
                        className={`${star <= selectedFood.rating ? "text-yellow-400" : "text-gray-200"} sm:text-lg`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedFood(null)}
                className="text-gray-500 hover:text-[#0F1E0F] transition-colors p-2"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 pb-6">
              <div>
                <h4 className="font-medium text-[#0F1E0F] mb-2 sm:text-lg">Meal Types</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedFood.meal_types?.length > 0 ? (
                    selectedFood.meal_types.map((type: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#319141]/10 text-[#319141] rounded text-sm sm:text-base"
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm italic">No meal types selected</span>
                  )}
                </div>
              </div>
              
              <div className="sm:grid sm:grid-cols-2 sm:gap-6 space-y-5 sm:space-y-0">
                <div>
                  <h4 className="font-medium text-[#0F1E0F] mb-2 sm:text-lg">Ingredients</h4>
                  <ul className="list-disc list-outside ml-5 space-y-1.5">
                    {Array.isArray(selectedFood.ingredients) && selectedFood.ingredients.length > 0
                      ? selectedFood.ingredients.map((ingredient, index) => (
                          <li key={index} className="text-gray-600 sm:text-base pl-1">{ingredient}</li>
                        ))
                      : typeof selectedFood.ingredients === 'string' && selectedFood.ingredients
                        ? selectedFood.ingredients.split(',')
                            .map(i => i.trim())
                            .filter(i => i.length > 0)
                            .map((ingredient, index) => (
                              <li key={index} className="text-gray-600 sm:text-base pl-1">{ingredient}</li>
                            ))
                        : <li className="text-gray-600 sm:text-base">No ingredients listed</li>
                    }
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-[#0F1E0F] mb-2 sm:text-lg">Recipe Instructions:</h4>
                  {selectedFood.recipe && 
                    (typeof selectedFood.recipe === 'string' ? 
                      selectedFood.recipe.trim() !== '' : 
                      Array.isArray(selectedFood.recipe) && selectedFood.recipe.length > 0) ? (
                    <div className="space-y-3">
                      <RecipeInstructions recipe={selectedFood.recipe} />
                    </div>
                  ) : (
                    <p className="text-gray-600 sm:text-base">No cooking instructions provided.</p>
                  )}
                </div>
              </div>
              
              <div className="pt-3 sm:hidden">
                <button
                  onClick={() => startEditing(selectedFood)}
                  className="w-full bg-[#319141] text-white p-3 rounded-xl hover:bg-[#0F1E0F] transition-colors flex items-center justify-center gap-2"
                >
                  <FaEdit className="text-sm" />
                  Edit Meal
                </button>
              </div>
              
              <div className="hidden sm:flex justify-end gap-3 pt-3">
                <button
                  onClick={() => setSelectedFood(null)}
                  className="px-5 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => startEditing(selectedFood)}
                  className="px-5 py-2 rounded-xl bg-[#319141] text-white hover:bg-[#0F1E0F] transition-colors flex items-center gap-2"
                >
                  <FaEdit />
                  Edit Meal
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Edit Meal Modal */}
      {editingFood && (
        <motion.div
          key="edit-food-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-70 z-100 flex items-start justify-center sm:items-center pt-4 sm:p-4"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col mb-4 sm:my-2">
            <div className="sticky top-0 bg-white z-10 border-b border-gray-100 p-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-[#319141]">Edit Meal</h3>
              <button
                onClick={() => setEditingFood(null)}
                className="text-gray-500 hover:text-[#0F1E0F] transition-colors p-2"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleEditFood} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-text-secondary mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="edit-name"
                  value={editingFood.name}
                  onChange={(e) => setEditingFood({ ...editingFood, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-ingredients" className="block text-sm font-medium text-text-secondary mb-2">
                  Ingredients (comma-separated)
                </label>
                <textarea
                  id="edit-ingredients"
                  value={Array.isArray(editingFood.ingredients) ? editingFood.ingredients.join(', ') : editingFood.ingredients || ''}
                  onChange={(e) => setEditingFood({ ...editingFood, ingredients: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 min-h-[100px]"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-recipe" className="block text-sm font-medium text-text-secondary mb-2">
                  Recipe Instructions (separate steps with line breaks)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Edit recipe steps below, each step on a new line. All your changes will be saved immediately after clicking Save.
                </p>
                <textarea
                  id="edit-recipe"
                  value={(() => {
                    // Format recipe in a user-friendly way for editing
                    const recipe = editingFood.recipe;
                    
                    // If it's already a string, just return it
                    if (typeof recipe === 'string') {
                      // Check if it looks like a JSON array
                      if (typeof recipe === 'string' && (recipe as string).trim().startsWith('[') && (recipe as string).trim().endsWith(']')) {
                        try {
                          // Try to parse it and format as line-separated steps
                          const parsed = JSON.parse(recipe);
                          if (Array.isArray(parsed)) {
                            return parsed
                              .map((step: any) => {
                                if (typeof step !== 'string') return '';
                                // Clean any quotes or brackets
                                let cleaned = step.trim();
                                if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                                  cleaned = cleaned.substring(1, cleaned.length - 1);
                                }
                                cleaned = cleaned.replace(/^\[|\]$/g, '');
                                return cleaned;
                              })
                              .filter(Boolean)
                              .join('\n');
                          }
                        } catch {
                          // If parsing fails, just clean up the string manually
                          return recipe
                            .replace(/^\[|\]$/g, '')
                            .replace(/\\"/g, '')
                            .replace(/","/g, '\n')
                            .replace(/^"|"$/g, '');
                        }
                      }
                      return recipe; // Return as is if not a JSON array
                    }
                    
                    // If it's an array, join with newlines
                    if (Array.isArray(recipe)) {
                      // Cast recipe to string array to satisfy TypeScript
                      const recipeArray = recipe as string[];
                      return recipeArray
                        .map((step: string) => {
                          if (typeof step !== 'string') return '';
                          // Clean any quotes or brackets
                          let cleaned = step.trim();
                          if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                            cleaned = cleaned.substring(1, cleaned.length - 1);
                          }
                          cleaned = cleaned.replace(/^\[|\]$/g, '');
                          return cleaned;
                        })
                        .filter(Boolean)
                        .join('\n');
                    }
                    
                    return ''; // Fallback
                  })()}
                  onChange={(e) => setEditingFood({ ...editingFood, recipe: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 min-h-[200px]"
                  required
                  placeholder="Enter each step on a new line:
1. Preheat the oven
2. Mix ingredients
3. Cook for 30 minutes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Rating
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={`edit-food-${editingFood.id}-star-${star}`}
                      type="button"
                      onClick={() => handleEditRatingChange(star)}
                      className="text-xl focus:outline-none"
                    >
                      {star <= editingFood.rating ? (
                        <FaStarSolid className="text-yellow-400" />
                      ) : (
                        <FaStarOutline className="text-gray-300 hover:text-yellow-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Meal Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {mealTypeOptions.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleEditMealTypeToggle(type)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        editingFood.meal_types.includes(type)
                          ? 'bg-accent text-white'
                          : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 pb-6">
                <button
                  type="button"
                  onClick={() => setEditingFood(null)}
                  className="px-6 py-2 rounded-xl border border-gray-200 text-text-secondary hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-accent text-white hover:bg-highlight transition-colors"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </>
  );
} 