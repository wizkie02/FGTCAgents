import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; import { AppError, createErrorResponse } from '@/lib/error'; // <-- thêm dòng này


const prisma = new PrismaClient();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const GPT_API_KEY = process.env.OPENAI_API_KEY;
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const GPT_API_URL = 'https://api.openai.com/v1/chat/completions';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

if (!DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY is not set in environment variables');
if (!GPT_API_KEY) throw new Error('GPT_API_KEY is not set in environment variables');
if (!CLAUDE_API_KEY) throw new Error('CLAUDE_API_KEY is not set in environment variables');

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

function processCitation(content: string, urls: { [key: string]: string }) {
  return content.replace(/Source (\d+)/g, (_, num) => '[${num}]');
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new AppError('User not authenticated', 401);
    }

    const { messages, model = 'gpt-3.5-turbo', searchEnabled = false, sessionId } = await req.json();

    const email = session.user.email;
    const name = session.user.name || '';
    const image = session.user.image || '';

    const user = await prisma.user.upsert({
      where: { email },
      update: { name, image, lastSeenAt: new Date() },
      create: { email, name, image, lastSeenAt: new Date(), plan: 'FREE' },
    });

    const isNewSession = !sessionId;
    const chatSession = isNewSession
      ? await prisma.chatSession.create({
        data: {
          userId: user.id,
          title: messages?.[0]?.content?.slice(0, 50) || 'Untitled Chat',
          summary: [], // tạo trống, cập nhật sau
        },
      })
      : await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          summary: {
            set: messages.map((m: any) => ({
              role: m.role,
              content: m.content,
            })),
          },
        },
      });


    const userMessages = messages.filter((m: any) => m.role === 'user');
    for (const msg of userMessages) {
      await prisma.message.create({
        data: {
          sessionId: chatSession!.id,
          userId: user.id,
          role: 'user',
          content: msg.content,
        },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastChatAt: new Date() },
    });

    const validModels = [
      'deepseek-chat', 'deepseek-reasoner', 'deepseek-coder',
      'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo',
      'claude-3-opus', 'claude-3-sonnet', 'claude-2',
      'gpt-4o-mini', 'gpt-4o',
    ];
    if (!validModels.includes(model)) {
      throw new AppError('Invalid model specified', 400);
    }

    let urls: { [key: string]: string } = {};
    if (searchEnabled) {
      const reasoningInput = messages[messages.length - 1].content;
      const sourceMatches = reasoningInput.matchAll(/\[Source (\d+)\]:.+\nURL: (.+?)(?=\n|$)/g);
      for (const match of sourceMatches) {
        urls[match[1]] = match[2].trim();
      }
    }

    let API_URL: string;
    let API_KEY: string;
    let requestBody: any;

    if (model.startsWith('deepseek')) {
      API_URL = DEEPSEEK_API_URL;
      API_KEY = DEEPSEEK_API_KEY as string;
      requestBody = { model, messages, stream: true, max_tokens: 4000, temperature: 0.7 };
    } else if (model.startsWith('claude')) {
      API_URL = CLAUDE_API_URL;
      API_KEY = CLAUDE_API_KEY as string;
      requestBody = {
        model,
        messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
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
    const responseStartTime = Date.now();
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        ...(model.startsWith('claude') ? { 'anthropic-version': '2023-06-01' } : {}),
      },
      body: JSON.stringify(requestBody),
    });

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
      throw new AppError(`API error: ${errorMsg}`, response.status);
    }
    // Đọc toàn bộ response nội dung (full answer từ LLM)
    const botResponseText = await response.clone().text();
    let botAnswer = '';

    // Giải đáp từ từng model có thể nằm khác nhau, đơn giản lấy lại đoạn cuối cùng:
    try {
      const chunks = botResponseText
        .split('data: ')
        .filter(line => line && !line.includes('[DONE]'))
        .map(line => JSON.parse(line));

      const lastChunk = chunks[chunks.length - 1];
      if (model.startsWith('claude')) {
        botAnswer = chunks
          .map((chunk) => chunk?.choices?.[0]?.delta?.content || '')
          .join('');
      } else if (model.startsWith('gpt') || model.startsWith('deepseek')) {
        botAnswer = lastChunk?.choices?.[0]?.delta?.content || '';
      }
    } catch (err) {
      console.warn('Could not parse response body for answer log.');
    }

    const responseEndTime = Date.now();

    // Cập nhật dòng Message mới nhất (giả định là câu cuối từ user trong session này)

    // Ghi botAnswer và thời gian phản hồi vào bảng Message
    const userMsg = userMessages[userMessages.length - 1];
    const responseTime = new Date().getTime() - new Date(userMsg?.createdAt || Date.now()).getTime();
    const latestMessage = await prisma.message.findFirst({
      where: {
        sessionId: chatSession!.id,
        userId: user.id,
        role: 'user',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (latestMessage) {
      await prisma.message.update({
        where: { id: latestMessage.id },
        data: {
          answer: botAnswer,
          responseTime,
        },
      });
    }

    // Cập nhật summary log
    const previousSummary = (chatSession?.summary ?? []) as Array<{ role: string; content: string }>;
    const newSummaryItem = [
      { role: 'user', content: userMsg?.content || '' },
      { role: 'assistant', content: botAnswer },
    ];
    await prisma.chatSession.update({
      where: { id: chatSession!.id },
      data: {
        summary: [...previousSummary, ...newSummaryItem],
        answer: botAnswer,
      },
    });


    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    return createErrorResponse(error); // <-- thay vì dùng NextResponse trực tiếp
  }
}