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
    
    const fetchTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), 30000);
    });

    const fetchPromise = fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "SavoryCircle",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "anthropic/claude-3-haiku:beta",
        "messages": [
          {
            "role": "user",
            "content": `Please suggest 3 meal ideas based on: "${prompt}". 
            
For each meal, provide the following information in this exact format:
Name: [Meal Name]
Description: [Brief description of the meal]
Ingredients: [List ALL necessary ingredients]
Recipe Instructions: [Numbered steps for preparation]

IMPORTANT REQUIREMENTS:
1. EVERY suggestion MUST include a complete list of ingredients - this is mandatory
2. EVERY suggestion MUST include detailed cooking instructions with complete sentences
3. Format the ingredients as a list with each item on a new line
4. Format the recipe instructions as numbered steps
5. Do not include any introductory or concluding text
6. Only respond with the meal suggestions in the exact format specified above
7. Do not number the meal suggestions themselves
8. Use straightforward formatting (no tables or complex markdown)
9. DO NOT include the user's request text "${prompt}" as an ingredient or instruction
10. Each ingredient should be an actual food item or cooking ingredient, not descriptions
11. Make sure all recipe instructions are complete sentences and not truncated
12. DO NOT use quotes or brackets around recipe instructions`
          }
        ],
        "temperature": 0.7,
        "max_tokens": 1000
      })
    });

    const result = await Promise.race([fetchTimeout, fetchPromise]);

    if (result instanceof Error) {
      console.error('Request timed out:', result.message);
      return NextResponse.json(
        { error: 'Request took too long to complete. Please try again.' },
        { status: 408 }
      );
    }

    const response = result as Response;
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get response from AI service' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('OpenRouter API Response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from AI service');
    }

    return NextResponse.json(data);
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