import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AppError, createErrorResponse } from '@/lib/error';
import { ModelType } from '@/types/types';

const prisma = new PrismaClient();

// API Keys from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

// No initial API key validation - keys will be checked when needed in getModelResponse
// Store available providers based on API keys
const availableProviders = {
  openai: !!OPENAI_API_KEY,
  anthropic: !!ANTHROPIC_API_KEY,
  google: !!GOOGLE_API_KEY,
  deepseek: !!DEEPSEEK_API_KEY,
  mistral: !!MISTRAL_API_KEY,
};

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const MODEL_CONFIGS = {
  // OpenAI Models
  'gpt-4-turbo': { provider: 'openai', model: 'gpt-4-1106-preview' },
  'gpt-4o': { provider: 'openai', model: 'gpt-4-preview' },
  'gpt-4o-mini': { provider: 'openai', model: 'gpt-4' },
  'gpt-3.5-turbo-0125': { provider: 'openai', model: 'gpt-3.5-turbo-0125' },
  'gpt-3.5-turbo-instruct': { provider: 'openai', model: 'gpt-3.5-turbo-instruct' },
  'o1': { provider: 'openai', model: 'gpt-4-0125-preview' }, // Model reasoning không hỗ trợ temperature
  'o1-mini': { provider: 'openai', model: 'gpt-4-preview' }, // Model reasoning không hỗ trợ temperature
  'o1-pro': { provider: 'openai', model: 'gpt-4-0125-preview' }, // Model reasoning không hỗ trợ temperature  
  'o3-mini': { provider: 'openai', model: 'gpt-3.5-turbo-0125' }, // Model reasoning không hỗ trợ temperature

  // Anthropic Models
  'claude-3-opus': { provider: 'anthropic', model: 'claude-3-opus-20240229' },
  'claude-3-sonnet': { provider: 'anthropic', model: 'claude-3-sonnet-20240229' },
  'claude-3-haiku': { provider: 'anthropic', model: 'claude-3-haiku-20240307' },

  // Google Models
  'gemini-pro': { provider: 'google', model: 'gemini-pro' },
  'gemini-pro-vision': { provider: 'google', model: 'gemini-pro-vision' },

  // DeepSeek Models
  'deepseek-coder-33b': { provider: 'deepseek', model: 'deepseek-coder-33b-instruct' },
  'deepseek-coder-6.7b': { provider: 'deepseek', model: 'deepseek-coder-6.7b-instruct' },

  // Mistral Models
  'mixtral-8x7b': { provider: 'mistral', model: 'mixtral-8x7b-instruct' },
  'mistral-medium': { provider: 'mistral', model: 'mistral-medium' },
  'mistral-small': { provider: 'mistral', model: 'mistral-small-latest' },
};

// Provider-specific API endpoints
const API_ENDPOINTS: Record<'openai' | 'anthropic' | 'google' | 'deepseek' | 'mistral', string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  google: 'https://generativelanguage.googleapis.com/v1/models',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  mistral: 'https://api.mistral.ai/v1/chat/completions',
};

const REASONING_MODELS = ['o1', 'o1-mini', 'o1-pro', 'o3-mini'];

async function getModelResponse(model: keyof typeof MODEL_CONFIGS, messages: any[]) {
  const config = MODEL_CONFIGS[model];
  if (!config) {
    throw new Error(`Model ${model} not supported`);
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  let endpoint = API_ENDPOINTS[config.provider as keyof typeof API_ENDPOINTS];
  let body: any = {};

  // Configure request based on provider
  switch (config.provider) {
    case 'openai':
      headers['Authorization'] = `Bearer ${OPENAI_API_KEY}`;
      body = {
        model: config.model,
        messages,
        stream: true,
      };
      
      // Chỉ thêm temperature nếu không phải là reasoning model
      if (!REASONING_MODELS.includes(model)) {
        body.temperature = 0.7;
      }
      break;

    case 'anthropic':
      headers['x-api-key'] = ANTHROPIC_API_KEY!;
      headers['anthropic-version'] = '2023-06-01';
      body = {
        model: config.model,
        messages: messages.map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        })),
        stream: true,
      };
      break;

    case 'google':
      headers['Authorization'] = `Bearer ${GOOGLE_API_KEY}`;
      endpoint = `${endpoint}/${config.model}:generateContent`;
      body = {
        contents: messages.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          temperature: 0.7,
        },
      };
      break;

    case 'deepseek':
      headers['Authorization'] = `Bearer ${DEEPSEEK_API_KEY}`;
      body = {
        model: config.model,
        messages,
        temperature: 0.7,
        stream: true,
      };
      break;

    case 'mistral':
      headers['Authorization'] = `Bearer ${MISTRAL_API_KEY}`;
      body = {
        model: config.model,
        messages,
        temperature: 0.7,
        stream: true,
      };
      break;

    default:
      throw new Error(`Provider ${config.provider} not supported`);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed: ${error}`);
  }

  return response;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new AppError('User not authenticated', 401);
    }

    const { messages, model = 'gpt-3.5-turbo-0125', searchEnabled = false, sessionId } = await req.json();
    const email = session.user.email;
    const name = session.user.name || '';
    const image = session.user.image || '';

    // Validate model
    if (!MODEL_CONFIGS[model as keyof typeof MODEL_CONFIGS]) {
      throw new AppError('Invalid model specified', 400);
    }

    // Create or get user
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, image, lastSeenAt: new Date() },
      create: { email, name, image, lastSeenAt: new Date(), plan: 'FREE' },
    });

    // Create or get chat session
    let chatSession;
    if (!sessionId) {
      chatSession = await prisma.chatSession.create({
        data: {
          userId: user.id,
          title: messages?.[0]?.content?.slice(0, 50) || 'Untitled Chat',
          summary: [],
        },
      });
    } else {
      chatSession = await prisma.chatSession.findUnique({ where: { id: sessionId } });
      if (!chatSession) {
        chatSession = await prisma.chatSession.create({
          data: {
            userId: user.id,
            title: messages?.[0]?.content?.slice(0, 50) || 'Untitled Chat',
            summary: [],
          },
        });
      }
    }

    // Save user messages
    const userMessages = messages.filter((m: any) => m.role === 'user');
    for (const msg of userMessages) {
      await prisma.message.create({
        data: {
          sessionId: chatSession.id,
          userId: user.id,
          role: 'user',
          content: msg.content,
        },
      });
    }

    // Update user's last chat time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastChatAt: new Date() },
    });

    // Get model response
    const response = await getModelResponse(model, messages);

    // Return streaming response
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'x-session-id': chatSession.id,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
