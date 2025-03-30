import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const apiUrl = process.env.NEXT_PUBLIC_OPENROUTER_API_URL;

    if (!apiKey || !apiUrl) {
      return NextResponse.json(
        { error: 'API configuration missing' },
        { status: 500 }
      );
    }

    const { favoriteFoods, count = 1 } = await request.json();

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
      return NextResponse.json(
        { error: `API request failed with status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const recipes = JSON.parse(content);
      return NextResponse.json(recipes);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to parse recipe JSON' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 