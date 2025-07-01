import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { APIError } from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, model, prompt, temperature = 0.7 } = await request.json();

    if (!apiKey || !model || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: apiKey, model, or prompt' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: temperature,
    });

    const result = completion.choices[0]?.message?.content || 'No response content';

    return NextResponse.json({ result });
  } catch (error) {
    console.error('API route error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message || 'OpenRouter API request failed' },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
