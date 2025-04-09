import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { FaClock, FaUsers, FaUtensils, FaTimes, FaDollarSign, FaFire } from 'react-icons/fa';
import Image from 'next/image';
import DOMPurify from 'isomorphic-dompurify';

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

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
}

export default function RecipeModal({ isOpen, onClose, recipe }: RecipeModalProps) {
  // Get nutrition data
  const calories = recipe.nutrition?.nutrients.find((n: { name: string }) => 
    n.name.toLowerCase() === 'calories'
  )?.amount || 0;
  const protein = recipe.nutrition?.nutrients.find((n: { name: string }) => 
    n.name.toLowerCase() === 'protein'
  )?.amount || 0;
  const fat = recipe.nutrition?.nutrients.find((n: { name: string }) => 
    n.name.toLowerCase() === 'fat'
  )?.amount || 0;

  // Format price to 2 decimal places
  const pricePerServing = (recipe.pricePerServing / 100).toFixed(2);

  // Clean up the summary
  const cleanSummary = DOMPurify.sanitize(recipe.summary, { ALLOWED_TAGS: [] })
    .split('.')
    .filter(sentence => 
      !sentence.toLowerCase().includes('spoonacular score') &&
      !sentence.toLowerCase().includes('try similar recipes') &&
      !sentence.toLowerCase().includes('this recipe serves') &&
      sentence.trim().length > 0
    )
    .join('. ');

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="relative">
                  <div className="relative h-64">
                    <Image
                      src={recipe.image}
                      alt={recipe.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <button
                      onClick={onClose}
                      className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 shadow-md hover:bg-white transition-colors"
                    >
                      <FaTimes className="text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <Dialog.Title as="h3" className="text-2xl font-bold mb-2">
                    {recipe.title}
                  </Dialog.Title>
                  <div className="text-gray-600 flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-1">
                      <FaClock className="text-gray-400" />
                      <span>{recipe.readyInMinutes} minutes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaUsers className="text-gray-400" />
                      <span>{recipe.servings} servings</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaDollarSign className="text-gray-400" />
                      <span>${pricePerServing} per serving</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-gray-700">{cleanSummary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <FaFire className="text-orange-500" />
                        Nutrition (per serving)
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Calories: {calories.toFixed(0)}</p>
                        <p className="text-sm text-gray-600">Protein: {protein.toFixed(0)}g</p>
                        <p className="text-sm text-gray-600">Fat: {fat.toFixed(0)}g</p>
                      </div>
                    </div>

                    {recipe.diets && recipe.diets.length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Dietary Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {recipe.diets.map((diet) => (
                            <span
                              key={diet}
                              className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded"
                            >
                              {diet}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <FaUtensils className="text-gray-400" />
                        Ingredients
                      </h4>
                      <ul className="list-disc list-inside space-y-2">
                        {recipe.extendedIngredients.map((ingredient) => (
                          <li key={ingredient.id} className="text-gray-700">
                            {ingredient.original}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4">Instructions</h4>
                      {recipe.analyzedInstructions && recipe.analyzedInstructions[0]?.steps ? (
                        <ol className="list-decimal list-inside space-y-4">
                          {recipe.analyzedInstructions[0].steps.map((step, index) => (
                            <li key={index} className="text-gray-700">
                              {step.step}
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-gray-500 italic">No instructions available</p>
                      )}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 