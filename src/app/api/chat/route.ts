import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const GPT_API_KEY = process.env.OPENAI_API_KEY;
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const GPT_API_URL = 'https://api.openai.com/v1/chat/completions';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// Bỏ runtime edge để tránh lỗi với next-auth
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, model = 'gpt-3.5-turbo', sessionId } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    const lastMessage = messages[messages.length - 1];

    const API_URL = model.startsWith('claude') ? CLAUDE_API_URL : model.startsWith('deepseek') ? DEEPSEEK_API_URL : GPT_API_URL;
    const API_KEY = model.startsWith('claude') ? CLAUDE_API_KEY : model.startsWith('deepseek') ? DEEPSEEK_API_KEY : GPT_API_KEY;

    const requestBody = model.startsWith('claude')
      ? {
          model,
          messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
          stream: false,
          max_tokens: 4000,
        }
      : {
          model,
          messages,
          stream: false,
          max_tokens: 4000,
          temperature: 0.7,
        };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        ...(model.startsWith('claude') ? { 'anthropic-version': '2023-06-01' } : {}),
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    const botMessage = model.startsWith('claude')
      ? data.content?.[0]?.text || ''
      : data.choices?.[0]?.message?.content || '';

    let sessionRecord;
    if (sessionId) {
      sessionRecord = await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          answer: botMessage,
          messages: {
            create: {
              role: 'user',
              content: lastMessage.content,
              userId: user.id,
              answer: botMessage,
            },
          },
        },
      });
    } else {
      sessionRecord = await prisma.chatSession.create({
        data: {
          userId: user.id,
          answer: botMessage,
          messages: {
            create: {
              role: 'user',
              content: lastMessage.content,
              userId: user.id,
              answer: botMessage,
            },
          },
        },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastChatAt: new Date() },
    });

    return new Response(
      JSON.stringify({ answer: botMessage, sessionId: sessionRecord.id }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Chat Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
