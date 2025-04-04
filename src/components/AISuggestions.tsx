import { useState, useEffect } from 'react';
import { FaLightbulb, FaPlus, FaSpinner, FaCheck, FaEye, FaEyeSlash, FaExclamationCircle } from 'react-icons/fa';

interface AISuggestionsProps {
  onAddMeal: (meal: any) => void;
}

export function AISuggestions({ onAddMeal }: AISuggestionsProps) {
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addedMeals, setAddedMeals] = useState<Set<string>>(new Set());
  const [mealVisibility, setMealVisibility] = useState<{ [key: string]: 'public' | 'private' }>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [responseReceived, setResponseReceived] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError('');
    setSuggestions([]);
    setAddedMeals(new Set());
    setResponseReceived(false);

    try {
      const response = await fetch('/api/ai-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to get suggestions');
      }

      const data = await response.json();
      
      // Call the parseSuggestions helper function
      const suggestions = parseSuggestions(data?.choices?.[0]?.message?.content || '');
      
      setSuggestions(suggestions);
      setResponseReceived(true);
    } catch (err) {
      console.error('Error getting AI suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to get suggestions');
      setResponseReceived(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to parse AI response into structured suggestions
  const parseSuggestions = (content: string) => {
    console.log('Parsing AI response:', content);
    const suggestions = [];
    const lines = content.split('\n');
    let currentSuggestion: any = {};
    let isParsingRecipe = false;
    let recipeSteps: string[] = [];
    let isParsingIngredients = false;
    let ingredientsList: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      if (trimmedLine.startsWith('Name:')) {
        if (currentSuggestion.name) {
          // Clean up the recipe steps before adding to currentSuggestion
          if (recipeSteps.length > 0) {
            currentSuggestion.recipe = recipeSteps.map(step => {
              // Remove any quotes or brackets
              let cleaned = step.trim();
              if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                cleaned = cleaned.substring(1, cleaned.length - 1);
              }
              cleaned = cleaned.replace(/^\[|\]$/g, '');
              return cleaned;
            });
          } else {
            currentSuggestion.recipe = recipeSteps;
          }
          
          // If we have ingredients from a multi-line list, use those
          if (ingredientsList.length > 0) {
            currentSuggestion.ingredients = ingredientsList;
          }
          
          // Only add suggestions that have both ingredients and recipe instructions
          if (
            currentSuggestion.ingredients && 
            currentSuggestion.ingredients.length > 0 &&
            currentSuggestion.recipe && 
            currentSuggestion.recipe.length > 0
          ) {
            suggestions.push({ ...currentSuggestion });
          }
          
          currentSuggestion = {};
          recipeSteps = [];
          ingredientsList = [];
          isParsingRecipe = false;
          isParsingIngredients = false;
        }
        currentSuggestion.name = trimmedLine.substring(5).trim();
      } else if (trimmedLine.startsWith('Description:')) {
        currentSuggestion.description = trimmedLine.substring(12).trim();
      } else if (trimmedLine.startsWith('Ingredients:')) {
        isParsingIngredients = true;
        // Reset any previously collected ingredients
        ingredientsList = [];
        
        // Check if there are inline ingredients (comma-separated)
        const inlineIngredients = trimmedLine.substring(12).trim();
        if (inlineIngredients && !inlineIngredients.includes(prompt.trim())) {
          currentSuggestion.ingredients = inlineIngredients
            .split(',')
            .map((i: string) => i.trim())
            .filter(Boolean);
        }
      } else if (isParsingIngredients && (trimmedLine.startsWith('-') || trimmedLine.startsWith('•'))) {
        // Handle bullet-point style ingredients
        const ingredient = trimmedLine.substring(1).trim();
        // Filter out pure descriptive lines and very short ingredients
        if (ingredient && 
            !ingredient.includes(prompt.trim()) && 
            ingredient.length > 3 && 
            !isJustDescriptive(ingredient)) {
          ingredientsList.push(ingredient);
        }
      } else if (isParsingIngredients && /^\d+\./.test(trimmedLine)) {
        // Handle numbered ingredients list
        const ingredient = trimmedLine.replace(/^\d+\.\s*/, '').trim();
        // Filter out pure descriptive lines and very short ingredients
        if (ingredient && 
            !ingredient.includes(prompt.trim()) && 
            ingredient.length > 3 && 
            !isJustDescriptive(ingredient)) {
          ingredientsList.push(ingredient);
        }
      } else if (isParsingIngredients && !trimmedLine.startsWith('Recipe') && !trimmedLine.startsWith('Instructions')) {
        // Add other lines as ingredients until we hit Recipe Instructions
        // Only add if the line doesn't contain the user's prompt
        if (!trimmedLine.includes(prompt.trim()) && 
            trimmedLine.length > 3 &&
            !isJustDescriptive(trimmedLine)) {
          ingredientsList.push(trimmedLine);
        }
      } else if (trimmedLine.startsWith('Recipe Instructions:') || trimmedLine.startsWith('Instructions:')) {
        isParsingIngredients = false;
        isParsingRecipe = true;
        
        // If we have collected ingredients, set them in the suggestion object
        if (ingredientsList.length > 0) {
          currentSuggestion.ingredients = ingredientsList;
        }
      } else if (isParsingRecipe && /^\d+\./.test(trimmedLine)) {
        // This line starts with a number and period, so it's a recipe step
        
        // Clean up the step by removing number prefix and trimming
        const step = trimmedLine.replace(/^\d+\.\s*/, '').trim();
        if (step.length > 2) {
          // Remove any quotes or brackets from the step
          let cleanedStep = step;
          if (cleanedStep.startsWith('"') && cleanedStep.endsWith('"')) {
            cleanedStep = cleanedStep.substring(1, cleanedStep.length - 1);
          }
          cleanedStep = cleanedStep.replace(/^\[|\]$/g, '');
          recipeSteps.push(cleanedStep);
        }
      } else if (isParsingRecipe && (trimmedLine.startsWith('-') || trimmedLine.startsWith('•'))) {
        // Handle bullet-point style recipe steps
        const step = trimmedLine.substring(1).trim();
        if (step.length > 2) {
          // Remove any quotes or brackets from the step
          let cleanedStep = step;
          if (cleanedStep.startsWith('"') && cleanedStep.endsWith('"')) {
            cleanedStep = cleanedStep.substring(1, cleanedStep.length - 1);
          }
          cleanedStep = cleanedStep.replace(/^\[|\]$/g, '');
          recipeSteps.push(cleanedStep);
        }
      } else if (isParsingRecipe) {
        // Add any line while parsing recipe section as long as it's not too short
        if (trimmedLine.length > 2) {
          // Remove any quotes or brackets from the step
          let cleanedStep = trimmedLine;
          if (cleanedStep.startsWith('"') && cleanedStep.endsWith('"')) {
            cleanedStep = cleanedStep.substring(1, cleanedStep.length - 1);
          }
          cleanedStep = cleanedStep.replace(/^\[|\]$/g, '');
          recipeSteps.push(cleanedStep);
        }
      }
    }

    if (currentSuggestion.name) {
      // Clean up the recipe steps before adding to currentSuggestion
      if (recipeSteps.length > 0) {
        currentSuggestion.recipe = recipeSteps.map(step => {
          // Remove any quotes or brackets
          let cleaned = step.trim();
          if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.substring(1, cleaned.length - 1);
          }
          cleaned = cleaned.replace(/^\[|\]$/g, '');
          return cleaned;
        });
      } else {
        currentSuggestion.recipe = recipeSteps;
      }
      
      // If we have ingredients from a multi-line list, use those
      if (ingredientsList.length > 0) {
        currentSuggestion.ingredients = ingredientsList;
      }
      
      // Clean ingredients as a final check
      if (currentSuggestion.ingredients) {
        currentSuggestion.ingredients = currentSuggestion.ingredients.filter(
          (ingredient: string) => !ingredient.includes(prompt.trim()) && ingredient.length > 2
        );
      }
      
      // Clean recipe steps - make sure we don't have incomplete steps
      if (currentSuggestion.recipe) {
        // Remove any recipe steps that are just a single letter or very short
        currentSuggestion.recipe = currentSuggestion.recipe.filter(
          (step: string) => step.length > 3
        );
      }
      
      // Only add suggestions that have both ingredients and recipe instructions
      if (
        currentSuggestion.ingredients && 
        currentSuggestion.ingredients.length > 0 &&
        currentSuggestion.recipe && 
        currentSuggestion.recipe.length > 0
      ) {
        suggestions.push(currentSuggestion);
      }
    }

    console.log('Parsed suggestions:', suggestions);
    return suggestions;
  };
  
  // Add a helper function to handle adding a meal to favorites
  const handleAddToFavorites = (meal: any) => {
    if (addedMeals.has(meal.name)) return;
    
    // Add to the local set of added meals
    setAddedMeals(new Set(addedMeals).add(meal.name));
    
    // Determine visibility
    const visibility = mealVisibility[meal.name] || 'public';
    
    // Call the parent callback to add the meal
    onAddMeal({
      ...meal,
      visibility,
    });
  };
  
  const toggleVisibility = (mealName: string) => {
    setMealVisibility({
      ...mealVisibility,
      [mealName]: mealVisibility[mealName] === 'public' ? 'private' : 'public',
    });
  };
  
  useEffect(() => {
    if (loading) {
      setErrorMessage('');
    }
  }, [loading]);

  useEffect(() => {
    if (suggestions && suggestions.length > 0) {
      setErrorMessage('');
    } else if (suggestions && suggestions.length === 0 && responseReceived) {
      setErrorMessage('No valid meal suggestions found. Please try again with more specific details about what kind of meal you want.');
    }
  }, [suggestions, responseReceived]);

  // Helper function to check if a string is just descriptive without actual ingredients
  const isJustDescriptive = (text: string): boolean => {
    // Skip single adjectives or descriptive-only terms
    const descriptiveTerms = ['hearty', 'delicious', 'tasty', 'flavorful', 'savory', 'sweet', 'sour', 'spicy', 'classic'];
    
    // If it's just a single descriptive term, return true
    if (descriptiveTerms.includes(text.toLowerCase())) {
      return true;
    }
    
    // If it contains measurable quantities or common food items, it's likely a real ingredient
    const hasMeasurement = /\b(\d+\s*(oz|g|kg|lb|cup|tbsp|tsp|ml|l))\b/i.test(text);
    const hasFoodItem = /\b(beef|chicken|pork|fish|pasta|rice|potato|onion|garlic|tomato|cheese|butter|oil|salt|pepper|sugar|flour|egg|milk)\b/i.test(text);
    
    // If it has food items or measurements, it's a valid ingredient
    if (hasMeasurement || hasFoodItem) {
      return false;
    }
    
    // If it's very short and doesn't have specific food terms, it might just be descriptive
    if (text.length < 8 && !text.includes(',')) {
      return true;
    }
    
    // If it's a very long sentence without commas, it's likely descriptive
    if (text.length > 40 && !text.includes(',')) {
      return true;
    }
    
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationCircle className="text-red-400" size={20} />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {errorMessage}
              </h3>
              {errorMessage.includes('No valid meal suggestions') && (
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Include specific cuisines (Italian, Mexican, Asian, etc.)</li>
                    <li>Mention dietary preferences (vegetarian, gluten-free, etc.)</li>
                    <li>Specify meal types (breakfast, lunch, dinner, snack)</li>
                    <li>List ingredients you have or want to use</li>
                    <li>Mention cooking methods you prefer (grilled, baked, etc.)</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-text-secondary mb-2">
            What kind of meal are you looking for?
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., 'Suggest a healthy dinner with chicken and vegetables' or 'I need a pasta recipe with tomatoes and garlic'"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 min-h-[100px]"
          />
          <p className="mt-1 text-xs text-gray-500">
            Tip: For best results, mention specific ingredients you'd like to use in your request. Be specific about cuisine type, dietary restrictions, or cooking methods.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="w-full bg-accent hover:bg-highlight text-white font-medium py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <FaSpinner className="animate-spin" />
              Getting AI Suggestions...
            </div>
          ) : (
            'Get Suggestions'
          )}
        </button>
      </form>

      {error && !errorMessage && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border-l-4 border-red-500">
          <p className="font-medium">Error getting suggestions</p>
          <div className="text-sm mt-1 whitespace-pre-line">{error}</div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <FaSpinner className="animate-spin text-3xl text-accent mx-auto mb-4" />
          <p className="text-text-secondary">Our AI chef is cooking up some suggestions...</p>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-primary">Suggested Meals</h3>
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-accent/30 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div>
                      <h4 className="text-lg font-medium text-primary">{suggestion.name}</h4>
                      <p className="text-text-secondary mt-1">{suggestion.description}</p>
                    </div>
                    {suggestion.ingredients && suggestion.ingredients.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-primary mb-2">Key Ingredients:</h5>
                        <div className="flex flex-wrap gap-2">
                          {suggestion.ingredients.map((ingredient: string, i: number) => (
                            <span
                              key={i}
                              className="inline-block px-2 py-1 bg-white rounded-lg text-xs text-text-secondary border border-gray-200"
                            >
                              {ingredient}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {!addedMeals.has(suggestion.name) && (
                      <button
                        onClick={() => toggleVisibility(suggestion.name)}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        {mealVisibility[suggestion.name] === 'public' ? (
                          <>
                            <FaEye className="text-sm" />
                            <span className="text-sm">Public</span>
                          </>
                        ) : (
                          <>
                            <FaEyeSlash className="text-sm" />
                            <span className="text-sm">Private</span>
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleAddToFavorites(suggestion)}
                      disabled={addedMeals.has(suggestion.name)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors duration-200 ${
                        addedMeals.has(suggestion.name)
                          ? 'bg-green-100 text-green-600'
                          : 'bg-accent/10 hover:bg-accent/20 text-accent'
                      }`}
                    >
                      {addedMeals.has(suggestion.name) ? (
                        <>
                          <FaCheck className="text-sm" />
                          <span className="text-sm">Added</span>
                        </>
                      ) : (
                        <>
                          <FaPlus className="text-sm" />
                          <span className="text-sm">Add</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 