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
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const apiUrl = process.env.NEXT_PUBLIC_OPENROUTER_API_URL;

    if (!apiKey || !apiUrl) {
      throw new Error('Missing DeepSeek API configuration');
    }

    const prompt = `
      Based on these favorite foods: ${favoriteFoods.join(', ')}, 
      suggest ${count} creative recipe(s) that incorporate some of these ingredients.
      
      For each recipe, provide:
      1. Recipe name
      2. List of ingredients with measurements
      3. Step-by-step cooking instructions
      4. Preparation time
      5. Cooking time
      6. Number of servings
      
      Format your response as a valid JSON array with objects containing:
      {
        "name": "Recipe Name",
        "ingredients": ["ingredient 1", "ingredient 2", ...],
        "instructions": ["step 1", "step 2", ...],
        "prepTime": "X minutes",
        "cookTime": "Y minutes",
        "servings": Z
      }
    `;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1:free',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the content from the response
    const content = data.choices[0].message.content;
    
    // Parse the JSON from the content
    try {
      const recipes = JSON.parse(content) as RecipeSuggestion[];
      return recipes;
    } catch (error) {
      console.error('Failed to parse recipe JSON:', error);
      return [];
    }
  } catch (error) {
    console.error('Error getting recipe suggestions:', error);
    return [];
  }
} 