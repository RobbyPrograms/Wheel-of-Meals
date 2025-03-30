'use client';

export type RecipeSuggestion = {
  name: string;
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  cookTime: string;
  servings: number;
};

export async function getRecipeSuggestions(
  favoriteFoods: string[],
  count: number = 1
): Promise<RecipeSuggestion[]> {
  try {
    const response = await fetch('/api/recipe-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ favoriteFoods, count })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const recipes = await response.json();
    return recipes as RecipeSuggestion[];
  } catch (error) {
    console.error('Error getting recipe suggestions:', error);
    return [];
  }
} 