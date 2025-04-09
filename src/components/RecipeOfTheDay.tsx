import { useEffect, useState } from 'react';
import { FaClock, FaUsers, FaUtensils, FaDollarSign, FaFire } from 'react-icons/fa';
import Image from 'next/image';
import DOMPurify from 'isomorphic-dompurify';
import RecipeModal from './RecipeModal';

interface ExtendedIngredient {
  id: number;
  original: string;
}

interface Recipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  summary: string;
  instructions: string;
  pricePerServing: number;
  nutrition?: {
    nutrients: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
  };
  extendedIngredients: ExtendedIngredient[];
  diets?: string[];
  analyzedInstructions?: Array<{
    name: string;
    steps: Array<{
      number: number;
      step: string;
    }>;
  }>;
}

export default function RecipeOfTheDay() {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchRecipeOfTheDay = async () => {
      try {
        const cachedRecipe = localStorage.getItem('recipeOfTheDay');
        const lastFetchDate = localStorage.getItem('recipeOfTheDayDate');
        const today = new Date().toDateString();

        console.log('Cache check:', {
          hasCachedRecipe: !!cachedRecipe,
          lastFetchDate,
          today,
          isCacheValid: cachedRecipe && lastFetchDate === today
        });

        if (cachedRecipe && lastFetchDate === today) {
          console.log('Using cached recipe');
          setRecipe(JSON.parse(cachedRecipe));
          setLoading(false);
          return;
        }

        console.log('Fetching new recipe...');
        const response = await fetch('/api/recipe-of-the-day');
        
        if (!response.ok) {
          console.error('API Error:', {
            status: response.status,
            statusText: response.statusText
          });
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to fetch recipe: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Received recipe:', {
          id: data.id,
          title: data.title,
          hasNutrition: !!data.nutrition,
          hasIngredients: Array.isArray(data.extendedIngredients)
        });

        setRecipe(data);
        localStorage.setItem('recipeOfTheDay', JSON.stringify(data));
        localStorage.setItem('recipeOfTheDayDate', today);
      } catch (err) {
        console.error('Detailed error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load recipe of the day');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipeOfTheDay();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
        <div className="h-48 bg-gray-100 rounded-lg mb-4"></div>
        <div className="h-6 bg-gray-100 rounded w-3/4 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-100 rounded w-full"></div>
          <div className="h-4 bg-gray-100 rounded w-5/6"></div>
          <div className="h-4 bg-gray-100 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <FaUtensils className="text-red-500 text-xl" />
        </div>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  // Get calories and nutrition info
  const protein = recipe.nutrition?.nutrients.find(
    n => n.name.toLowerCase() === 'protein' || n.name === 'Protein'
  )?.amount || 0;
  
  const fat = recipe.nutrition?.nutrients.find(
    n => n.name.toLowerCase() === 'fat' || n.name === 'Fat'
  )?.amount || 0;

  // Format price to 2 decimal places
  const pricePerServing = (recipe.pricePerServing / 100).toFixed(2);

  // Create a concise description
  const createDescription = () => {
    const dietInfo = recipe.diets?.length 
      ? `This is a ${recipe.diets.join(', ')} recipe. `
      : '';
    
    const priceInfo = `Cost: $${pricePerServing} per serving.`;
    
    return dietInfo + priceInfo;
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="relative h-48 w-full">
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-xl font-bold text-white mb-2">{recipe.title}</h3>
            <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
              <div className="flex items-center gap-1">
                <FaClock className="text-[#319141]" />
                <span>{recipe.readyInMinutes} minutes</span>
              </div>
              <div className="flex items-center gap-1">
                <FaUsers className="text-[#319141]" />
                <span>{recipe.servings} servings</span>
              </div>
              <div className="flex items-center gap-1">
                <FaDollarSign className="text-[#319141]" />
                <span>${pricePerServing}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <div className="prose prose-sm max-w-none mb-4">
            <p className="text-gray-600 text-sm">{createDescription()}</p>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold text-[#0F1E0F] mb-2 flex items-center gap-2">
              <FaUtensils className="text-[#319141]" />
              Ingredients
            </h4>
            <ul className="space-y-1">
              {recipe.extendedIngredients.slice(0, 5).map((ingredient, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#319141]/60" />
                  {ingredient.original}
                </li>
              ))}
              {recipe.extendedIngredients.length > 5 && (
                <li className="text-sm text-[#319141] font-medium">
                  +{recipe.extendedIngredients.length - 5} more ingredients
                </li>
              )}
            </ul>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button 
              className="w-full bg-[#319141] text-white rounded-lg py-2 px-4 text-sm font-medium hover:bg-[#0F1E0F] transition-colors duration-300 flex items-center justify-center gap-2"
              onClick={() => setIsModalOpen(true)}
            >
              View Full Recipe
              <FaUtensils className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <RecipeModal
        recipe={recipe}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
} 