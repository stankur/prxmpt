import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { APIError } from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, model, prompts, temperature = 0.7 } = await request.json();

    if (!apiKey || !model || !prompts || !Array.isArray(prompts)) {
      return NextResponse.json(
        { error: 'Missing required fields: apiKey, model, or prompts (array)' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });

    // Create parallel API calls for all prompts
    const chatPromises = prompts.map(async (userPrompt: string) => {
      try {
        const completion = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          temperature: temperature,
        });

        const result = completion.choices[0]?.message?.content || 'No response content';
        return { prompt: userPrompt, result };
      } catch (apiError) {
        console.error(`API call failed for prompt "${userPrompt}":`, apiError);
        return { 
          prompt: userPrompt, 
          error: apiError instanceof APIError ? apiError.message : 'API request failed'
        };
      }
    });

    // Wait for all API calls to complete
    const results = await Promise.all(chatPromises);

    return NextResponse.json({ 
      results: results,
      totalPrompts: prompts.length
    });

  } catch (error) {
    console.error('API route error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        { 
          error: error.message || 'OpenRouter API request failed',
          details: `Status: ${error.status}, Code: ${error.code}, Type: ${error.type}`
        },
        { status: error.status || 500 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    return NextResponse.json(
      { 
        error: `${errorName}: ${errorMessage}`,
        details: 'Check server logs for more information'
      },
      { status: 500 }
    );
  }
}