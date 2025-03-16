import { useState } from 'react';
import { FaLightbulb, FaPlus, FaSpinner, FaCheck } from 'react-icons/fa';

interface AISuggestionsProps {
  onAddToFavorites: (meal: { name: string; description: string; recipe: string }) => void;
}

export default function AISuggestions({ onAddToFavorites }: AISuggestionsProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{
    name: string;
    description: string;
    ingredients: string[];
    recipe: string[];
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [addedMeals, setAddedMeals] = useState<Set<string>>(new Set());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      console.log('Sending request to AI...');
      const response = await fetch('/api/ai-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get suggestions');
      }

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from AI service');
      }

      console.log('Received AI response:', data);

      // Parse the AI response to extract structured meal suggestions
      const content = data.choices[0].message.content;
      const suggestions = parseSuggestions(content);

      if (suggestions.length === 0) {
        throw new Error('Could not parse any meal suggestions from the AI response');
      }

      setSuggestions(suggestions);
    } catch (err) {
      console.error('Error getting AI suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to get suggestions');
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

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      if (trimmedLine.startsWith('Name:')) {
        if (currentSuggestion.name) {
          currentSuggestion.recipe = recipeSteps;
          suggestions.push({ ...currentSuggestion });
          currentSuggestion = {};
          recipeSteps = [];
          isParsingRecipe = false;
        }
        currentSuggestion.name = trimmedLine.substring(5).trim();
      } else if (trimmedLine.startsWith('Description:')) {
        currentSuggestion.description = trimmedLine.substring(12).trim();
      } else if (trimmedLine.startsWith('Ingredients:')) {
        currentSuggestion.ingredients = trimmedLine
          .substring(12)
          .split(',')
          .map((i: string) => i.trim())
          .filter(Boolean);
      } else if (trimmedLine.startsWith('Recipe Instructions:')) {
        isParsingRecipe = true;
      } else if (isParsingRecipe && /^\d+\./.test(trimmedLine)) {
        // This line starts with a number and period, so it's a recipe step
        recipeSteps.push(trimmedLine.replace(/^\d+\.\s*/, '').trim());
      }
    }

    if (currentSuggestion.name) {
      currentSuggestion.recipe = recipeSteps;
      suggestions.push(currentSuggestion);
    }

    console.log('Parsed suggestions:', suggestions);
    return suggestions;
  };

  const handleAddToFavorites = (suggestion: { 
    name: string; 
    ingredients: string[]; 
    recipe: string[] 
  }) => {
    onAddToFavorites({
      name: suggestion.name,
      description: suggestion.ingredients.join(', '),
      recipe: suggestion.recipe.join('\n')
    });
    setAddedMeals(prev => new Set([...Array.from(prev), suggestion.name]));
    setTimeout(() => {
      setAddedMeals(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(suggestion.name);
        return newSet;
      });
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-text-secondary mb-2">
            What kind of meal are you looking for?
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., 'I want a healthy vegetarian dinner that's quick to prepare' or 'Suggest a spicy Asian dish with chicken'"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 min-h-[100px]"
          />
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

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border-l-4 border-red-500">
          <p className="font-medium">Error getting suggestions</p>
          <p className="text-sm mt-1">{error}</p>
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
                          {suggestion.ingredients.map((ingredient, i) => (
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
                  <button
                    onClick={() => handleAddToFavorites(suggestion)}
                    disabled={addedMeals.has(suggestion.name)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors duration-200 ml-4 ${
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 