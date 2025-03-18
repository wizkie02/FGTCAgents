import { NextResponse } from 'next/server';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const GPT_API_KEY = process.env.OPENAI_API_KEY;
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const GPT_API_URL = 'https://api.openai.com/v1/chat/completions';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

if (!DEEPSEEK_API_KEY) {
  throw new Error('DEEPSEEK_API_KEY is not set in environment variables');
}
if (!GPT_API_KEY) {
  throw new Error('GPT_API_KEY is not set in environment variables');
}
if (!CLAUDE_API_KEY) {
  throw new Error('CLAUDE_API_KEY is not set in environment variables');
}

// Set response timeout to 30 seconds
export const maxDuration = 30;

// Configure the runtime to use edge for better streaming support
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Hàm xử lý citation: thay thế "Source X" bằng "[X]"
function processCitation(content: string, urls: { [key: string]: string }) {
  return content.replace(/Source (\d+)/g, (_, num) => `[${num}]`);
}

export async function POST(req: Request) {
  try {
    const { messages, model = 'gpt-3.5-turbo', searchEnabled = false } = await req.json();

    const validModels = [
      'deepseek-chat', 'deepseek-reasoner', 'deepseek-coder',
      'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo',
      'claude-3-opus', 'claude-3-sonnet', 'claude-2',
      'gpt-4o-mini', 'gpt-4o'
    ];

    if (!validModels.includes(model)) {
      throw new Error('Invalid model specified');
    }

    // Chỉ xử lý citations khi searchEnabled = true
    let urls: { [key: string]: string } = {};
    if (searchEnabled) {
      const reasoningInput = messages[messages.length - 1].content;
      const sourceMatches = reasoningInput.matchAll(/\[Source (\d+)\]:.+\nURL: (.+?)(?=\n|$)/g);
      for (const match of sourceMatches) {
        urls[match[1]] = match[2].trim();
      }
    }

    // Determine which API to use
    let API_URL: string;
    let API_KEY: string;
    let requestBody: any;

    if (model.startsWith('deepseek')) {
      API_URL = DEEPSEEK_API_URL;
      API_KEY = DEEPSEEK_API_KEY as string;
      requestBody = {
        model,
        messages,
        stream: true,
        max_tokens: 4000,
        temperature: 0.7,
      };
    } else if (model.startsWith('claude')) {
      API_URL = CLAUDE_API_URL;
      API_KEY = CLAUDE_API_KEY as string;
      requestBody = {
        model,
        messages: messages.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        })),
        stream: true,
        max_tokens: 4000,
      };
    } else {
      API_URL = GPT_API_URL;
      API_KEY = GPT_API_KEY as string;
      requestBody = {
        model: model === 'gpt-4o-mini' ? 'gpt-4' : model,
        messages,
        stream: true,
        max_tokens: 4000,
        temperature: 0.7,
      };
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        ...(model.startsWith('claude') ? {
          'anthropic-version': '2023-06-01'
        } : {})
      },
      body: JSON.stringify(requestBody),
    });

    // Nếu API trả về lỗi, in ra chi tiết lỗi từ API
    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg: string;
      try {
        const errorObj = JSON.parse(errorText);
        errorMsg = errorObj.message || errorText;
      } catch (err) {
        errorMsg = errorText;
      }
      console.error('API error:', errorMsg);
      throw new Error(`API error: ${errorMsg}`);
    }

    // Trả về stream trực tiếp từ API
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
}
