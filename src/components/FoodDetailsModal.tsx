'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FaUtensils, FaClock, FaUsers, FaTimes } from 'react-icons/fa';

interface FoodDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  food: {
    name: string;
    meal_type: string;
    ingredients: string[];
    instructions: string[] | string;
    prep_time?: string;
    servings?: number;
  };
}

export default function FoodDetailsModal({ isOpen, onClose, food }: FoodDetailsModalProps) {
  // Process instructions to clean format
  const processInstructions = () => {
    if (!food.instructions) return [];
    
    let steps: string[] = [];
    
    // Handle array of instructions
    if (Array.isArray(food.instructions)) {
      // First attempt to see if we have a stringified array inside the array
      if (food.instructions.length === 1 && 
          typeof food.instructions[0] === 'string' && 
          food.instructions[0].startsWith('[') && 
          food.instructions[0].endsWith(']')) {
        try {
          // If it's a stringified array inside an array, parse it
          const parsed = JSON.parse(food.instructions[0]);
          if (Array.isArray(parsed)) {
            steps = parsed.map(step => {
              if (typeof step !== 'string') return '';
              // Clean quotes and brackets
              return step.trim().replace(/^"|"$/g, '').replace(/^\[|\]$/g, '');
            }).filter(Boolean);
          } else {
            // Fall back to treating as a regular string
            steps = [food.instructions[0].replace(/^\[|\]$/g, '').replace(/"/g, '')];
          }
        } catch {
          // If parsing fails, clean the string manually and try multiple splitting strategies
          const instructionString = food.instructions[0].replace(/^\[|\]$/g, '').replace(/\\"/g, '"').replace(/"/g, '');
          
          // Try to detect and parse different formats
          if (instructionString.includes('","')) {
            // Looks like a flattened JSON array with quotes
            steps = instructionString.split(/","|","/)
              .map(step => step.trim().replace(/^"|"$/g, '').replace(/^\[|\]$/g, ''))
              .filter(step => step.length > 2);
          } else if (/\d+\./.test(instructionString)) {
            // Has numbered steps
            steps = instructionString.split(/(?=\d+\.)/)
              .map(step => step.trim())
              .filter(step => step.length > 2);
          } else if (instructionString.includes('. ')) {
            // Split by periods followed by space (likely sentences)
            steps = instructionString.split(/\. /)
              .map(step => step.trim() + (step.endsWith('.') ? '' : '.'))
              .filter(step => step.length > 5);
          } else if (instructionString.includes(',')) {
            // Split by commas as a last resort for comma-separated lists
            steps = instructionString.split(',')
              .map(step => step.trim())
              .filter(step => step.length > 2);
          } else {
            // Default to the original strategy
            steps = instructionString.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
              .map(step => step.trim().replace(/^"|"$/g, '').replace(/^\[|\]$/g, ''))
              .filter(step => step.length > 2);
          }
        }
      } else {
        // Regular array processing
        steps = food.instructions.map(step => {
          // Clean up any quotes or brackets
          let cleaned = step.trim();
          // Remove surrounding quotes
          if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.substring(1, cleaned.length - 1);
          }
          // Remove any brackets
          cleaned = cleaned.replace(/^\[|\]$/g, '');
          return cleaned;
        });
      }
    }
    // Handle string that looks like JSON array
    else if (typeof food.instructions === 'string') {
      const instructionStr = food.instructions.trim();
      
      // Check if it's a JSON array string
      if (instructionStr.startsWith('[') && instructionStr.endsWith(']')) {
        try {
          const parsed = JSON.parse(instructionStr);
          if (Array.isArray(parsed)) {
            steps = parsed.map(step => {
              if (typeof step !== 'string') return '';
              // Clean quotes and brackets
              return step.trim().replace(/^"|"$/g, '').replace(/^\[|\]$/g, '');
            }).filter(Boolean);
          } else {
            // Fall back to treating as a string
            steps = [instructionStr.replace(/^\[|\]$/g, '').replace(/"/g, '')];
          }
        } catch {
          // If parsing fails, try to clean up the string manually
          // and try multiple splitting strategies for different formats
          const instructionString = instructionStr.replace(/^\[|\]$/g, '').replace(/\\"/g, '"').replace(/"/g, '');
          
          // Try to detect and parse different formats
          if (instructionString.includes('","')) {
            // Looks like a flattened JSON array with quotes
            steps = instructionString.split(/","|","/)
              .map(step => step.trim().replace(/^"|"$/g, '').replace(/^\[|\]$/g, ''))
              .filter(step => step.length > 2);
          } else if (/\d+\./.test(instructionString)) {
            // Has numbered steps
            steps = instructionString.split(/(?=\d+\.)/)
              .map(step => step.trim())
              .filter(step => step.length > 2);
          } else if (instructionString.includes('. ')) {
            // Split by periods followed by space (likely sentences)
            steps = instructionString.split(/\. /)
              .map(step => step.trim() + (step.endsWith('.') ? '' : '.'))
              .filter(step => step.length > 5);
          } else if (instructionString.includes(',')) {
            // Split by commas as a last resort for comma-separated lists
            steps = instructionString.split(',')
              .map(step => step.trim())
              .filter(step => step.length > 2);
          } else {
            // Default to original strategy
            steps = instructionString.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
              .map(step => step.trim().replace(/^"|"$/g, '').replace(/^\[|\]$/g, ''))
              .filter(step => step.length > 2);
          }
        }
      } else {
        // Handle different string formats
        if (instructionStr.includes('","')) {
          // Looks like a flattened JSON array with quotes
          steps = instructionStr.split(/","|","/)
            .map(step => step.trim().replace(/^"|"$/g, '').replace(/^\[|\]$/g, ''))
            .filter(step => step.length > 2);
        } else if (/\d+\./.test(instructionStr)) {
          // Has numbered steps
          steps = instructionStr.split(/(?=\d+\.)/)
            .map(step => step.trim())
            .filter(step => step.length > 2);
        } else if (instructionStr.includes('. ')) {
          // Split by periods followed by space (likely sentences)
          steps = instructionStr.split(/\. /)
            .map(step => step.trim() + (step.endsWith('.') ? '' : '.'))
            .filter(step => step.length > 5);
        } else if (instructionStr.includes('\n')) {
          // Split by newlines
          steps = instructionStr
            .split('\n')
            .map(step => step.trim())
            .filter(step => step.length > 2);
        } else if (instructionStr.includes(',')) {
          // Split by commas as a last resort for comma-separated lists
          steps = instructionStr.split(',')
            .map(step => step.trim())
            .filter(step => step.length > 2);
        } else {
          // Default to splitting by periods or newlines
          steps = instructionStr
            .split(/[\n.]+/)
            .map(step => step.trim())
            .filter(step => step.length > 2);
        }
      }
    }
    
    // Final cleanup to ensure no formatting artifacts remain
    steps = steps.map(step => {
      // Remove surrounding quotes
      let cleaned = step;
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
      }
      // Remove brackets
      cleaned = cleaned.replace(/^\[|\]$/g, '');
      // Remove backslashes
      cleaned = cleaned.replace(/\\/g, '');
      return cleaned;
    });
    
    return steps.filter(step => step.length > 2);
  };

  const instructionSteps = processInstructions();

  // For debugging - this will help identify the instruction format
  console.log('Original instructions format:', 
    Array.isArray(food.instructions) ? 'array' : typeof food.instructions);
  console.log('Original instructions value:', food.instructions);
  console.log('Processed instructions:', instructionSteps);

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
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-xl font-semibold text-[#0F1E0F]">
                    {food.name}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaUtensils className="w-4 h-4" />
                    <span>{food.meal_type || 'Meal'}</span>
                  </div>
                  {food.prep_time && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaClock className="w-4 h-4" />
                      <span>{food.prep_time}</span>
                    </div>
                  )}
                  {food.servings && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaUsers className="w-4 h-4" />
                      <span>{food.servings} servings</span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-[#0F1E0F] mb-2">Ingredients</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {food.ingredients
                        .filter(ingredient => 
                          // Filter out very short items or descriptive-only items
                          ingredient.length > 3 && 
                          !['hearty', 'delicious', 'tasty', 'flavorful', 'savory', 'sweet', 'sour', 'spicy', 'classic'].includes(ingredient.toLowerCase())
                        )
                        .map((ingredient, index) => (
                          <li key={index} className="text-gray-600">{ingredient}</li>
                        ))}
                      {/* Display fallback if no valid ingredients are found */}
                      {food.ingredients.filter(i => i.length > 3).length === 0 && (
                        <li className="text-gray-600">Ingredients not specified</li>
                      )}
                    </ul>
                  </div>

                  {instructionSteps.length > 0 && (
                    <div>
                      <h4 className="font-medium text-[#0F1E0F] mb-4">Recipe Instructions:</h4>
                      <ol className="list-decimal pl-5 space-y-2">
                        {instructionSteps.map((step, index) => (
                          <li key={index} className="text-gray-700">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 