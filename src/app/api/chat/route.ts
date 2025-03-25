import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AppError, createErrorResponse } from '@/lib/error';

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
    // Xác thực người dùng
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new AppError('User not authenticated', 401);
    }

    // Lấy dữ liệu từ request body
    const { messages, model = 'gpt-3.5-turbo', searchEnabled = false, sessionId } = await req.json();
    const email = session.user.email;
    const name = session.user.name || '';
    const image = session.user.image || '';

    // Upsert user vào DB
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, image, lastSeenAt: new Date() },
      create: { email, name, image, lastSeenAt: new Date(), plan: 'FREE' },
    });

    // Quản lý Chat Session:
    // Nếu không có sessionId, tạo phiên chat mới (summary khởi tạo là rỗng)
    // Nếu có sessionId, load phiên chat cũ; nếu không tìm thấy thì tạo mới
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

    // Lưu tin nhắn của người dùng vào DB
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

    // Cập nhật thời gian chat mới nhất cho user
    await prisma.user.update({
      where: { id: user.id },
      data: { lastChatAt: new Date() },
    });

    // Kiểm tra model hợp lệ
    const validModels = [
      'deepseek-chat', 'deepseek-reasoner', 'deepseek-coder',
      'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo',
      'claude-3-opus', 'claude-3-sonnet', 'claude-2',
      'gpt-4o-mini', 'gpt-4o',
    ];
    if (!validModels.includes(model)) {
      throw new AppError('Invalid model specified', 400);
    }

    // Nếu searchEnabled, xử lý các URL tham chiếu
    let urls: { [key: string]: string } = {};
    if (searchEnabled) {
      const reasoningInput = messages[messages.length - 1].content;
      const sourceMatches = reasoningInput.matchAll(/\[Source (\d+)\]:.+\nURL: (.+?)(?=\n|$)/g);
      for (const match of sourceMatches) {
        urls[match[1]] = match[2].trim();
      }
    }

    // Xác định API URL, API KEY và requestBody dựa trên model
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

    // Gửi request tới API LLM
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

    // --- Xử lý stream response sử dụng TransformStream ---
    if (!response.body) throw new AppError('No response body', 500);
    let accumulated = "";
    const transformer = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk, { stream: true });
        accumulated += text;
        controller.enqueue(chunk);
      },
      flush(controller) {
        let botAnswer = "";
        try {
          const chunks = accumulated
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
          console.warn('Could not parse accumulated stream for answer log.', err);
        }
        if (!botAnswer) {
          console.warn('Bot answer is empty. Full accumulated text:', accumulated);
        }
        // Sau khi stream kết thúc, cập nhật DB với botAnswer và nối thêm vào summary của phiên chat cũ
        (async () => {
          const userMsg = userMessages[userMessages.length - 1];
          const responseTime = Date.now() - new Date(userMsg?.createdAt || Date.now()).getTime();
          const latestMessage = await prisma.message.findFirst({
            where: {
              sessionId: chatSession.id,
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
          const previousSummary = (chatSession?.summary ?? []) as Array<{ role: string; content: string }>;
          const newSummary = [
            ...previousSummary,
            { role: 'user', content: userMsg?.content || '' },
            { role: 'assistant', content: botAnswer }
          ];
          await prisma.chatSession.update({
            where: { id: chatSession.id },
            data: { summary: newSummary, answer: botAnswer },
          });
        })();
      }
    });
    const transformedStream = response.body.pipeThrough(transformer);

    // --- Trả về stream response cho client, kèm header "x-session-id" ---
    // Client sẽ dùng header này để điều hướng URL thành https://fgtc-agents.vercel.app/c/{chatSession.id}
    return new Response(transformedStream, {
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
