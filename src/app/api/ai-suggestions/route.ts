import { NextResponse } from 'next/server';

const OPENROUTER_API_KEY = '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';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('Sending request to OpenRouter API...');
    
    // Create an AbortController to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "SavoryCircle",
          "Content-Type": "application/json"
        },
        signal: controller.signal,
        body: JSON.stringify({
          "model": "mistralai/mistral-7b-instruct:free",  // Using Mistral instead as it's often faster
          "messages": [
            {
              "role": "system",
              "content": `You are a helpful culinary AI assistant. When suggesting meals, always format your response in the following structure:

Name: [Meal Name]
Description: [Brief description of the meal]
Ingredients:
- [ingredient 1]
- [ingredient 2]
- [ingredient 3]
- [continue listing all ingredients]
Recipe Instructions:
1. [First step]
2. [Second step]
3. [Continue with remaining steps]

IMPORTANT: You MUST include a comprehensive list of ingredients for each meal suggestion. List ingredients on separate lines using bullet points. For simpler queries (like "meal for dinner"), suggest popular, well-known dishes with common ingredients.

Even for basic requests like "I want a meal" or "suggest dinner ideas", always include a complete set of ingredients. Never leave the ingredients section empty or incomplete.

Provide 3 meal suggestions that match the user's request.`
            },
            {
              "role": "user",
              "content": prompt
            }
          ],
          "temperature": 0.7,
          "max_tokens": 500
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('OpenRouter API Error:', errorData);
        throw new Error(errorData?.error?.message || 'Failed to get response from AI service');
      }

      const data = await response.json();
      console.log('OpenRouter API Response:', data);

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from AI service');
      }

      return NextResponse.json(data);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: unknown) {
    console.error('AI Suggestion Error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request took too long to complete. Please try again.' },
          { status: 408 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to get AI suggestions' },
      { status: 500 }
    );
  }
} 