import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AppError, createErrorResponse } from '@/lib/error'; // <-- thêm dòng này

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
  return content.replace(/Source (\d+)/g, (_, num) => `[${num}]`);
}

// Helper: đọc stream thành string
async function streamToString(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  return result;
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

    // Tạo phiên chat mới nếu chưa có sessionId, nếu có thì tìm phiên hiện có
    const isNewSession = !sessionId;
    const chatSession = isNewSession
      ? await prisma.chatSession.create({
          data: {
            userId: user.id,
            title: messages?.[0]?.content?.slice(0, 50) || 'Untitled Chat',
            summary: messages.map((m: any) => ({
              role: m.role,
              content: m.content,
            })),
          },
        })
      : await prisma.chatSession.findUnique({ where: { id: sessionId } });

    // Lưu các tin nhắn của user
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

    // --- Xử lý stream response và cập nhật database ---
    // Sử dụng tee để chia stream thành 2 nhánh
    if (!response.body) throw new AppError('No response body', 500);
    const [streamForDB, streamForClient] = response.body.tee();

    // Đọc toàn bộ streamForDB để tích lũy botAnswer
    const botResponseText = await streamToString(streamForDB);
    let botAnswer = '';
    try {
      const chunks = botResponseText
        .split('data: ')
        .filter(line => line && !line.includes('[DONE]'))
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (err) {
            console.error('JSON parse error:', err, line);
            return null;
          }
        })
        .filter(chunk => chunk !== null);
      if (model.startsWith('claude')) {
        botAnswer = chunks.map(chunk => chunk?.content?.[0]?.text || '').join('');
      } else if (model.startsWith('gpt') || model.startsWith('deepseek')) {
        botAnswer = chunks.map(chunk => chunk?.choices?.[0]?.delta?.content || '').join('');
      }
    } catch (err) {
      console.warn('Could not parse response body for answer log.', err);
    }
    if (!botAnswer) {
      console.warn('Bot answer is empty. Full response text:', botResponseText);
    }
    // Cập nhật Message: tìm tin nhắn user mới nhất và cập nhật với botAnswer
    const userMsg = userMessages[userMessages.length - 1];
    const responseTime = Date.now() - new Date(userMsg?.createdAt || Date.now()).getTime();
    const latestMessage = await prisma.message.findFirst({
      where: {
        sessionId: chatSession!.id,
        userId: user.id,
        role: 'user',
      },
      orderBy: { createdAt: 'desc' },
    });
    if (latestMessage) {
      await prisma.message.update({
        where: { id: latestMessage.id },
        data: { answer: botAnswer, responseTime },
      });
    }
    // Cập nhật summary: tránh lưu duplicate user message
    const previousSummary = (chatSession?.summary ?? []) as Array<{ role: string; content: string }>;
    let newSummary: Array<{ role: string; content: string }> = [...previousSummary];
    if (
      newSummary.length > 0 &&
      newSummary[newSummary.length - 1].role === 'user' &&
      newSummary[newSummary.length - 1].content === userMsg?.content
    ) {
      newSummary.push({ role: 'assistant', content: botAnswer });
    } else {
      newSummary.push({ role: 'user', content: userMsg?.content || '' });
      newSummary.push({ role: 'assistant', content: botAnswer });
    }
    await prisma.chatSession.update({
      where: { id: chatSession!.id },
      data: {
        summary: newSummary,
        answer: botAnswer,
      },
    });
    // --- Kết thúc xử lý stream và DB update ---

    // Trả về stream response cho client, giữ nguyên stream gốc
    return new Response(
      JSON.stringify({ answer: botAnswer, sessionId: chatSession!.id }),
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
  