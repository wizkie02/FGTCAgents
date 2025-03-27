import { NextResponse } from 'next/server';

export class AppError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public provider?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

interface ErrorResponse {
  message: string;
  provider?: string;
  status: number;
}

export function handleProviderError(error: any, provider: string): AppError {
  // Common rate limit status codes and patterns
  const rateLimitStatuses = [429, 451];
  const rateLimitPatterns = [
    /rate limit/i,
    /too many requests/i,
    /quota exceeded/i
  ];

  // Provider-specific error handling
  switch (provider) {
    case 'openai':
      if (error.response?.status === 401) {
        return new AppError('Invalid OpenAI API key', 401, provider);
      }
      break;

    case 'anthropic':
      if (error.response?.status === 401) {
        return new AppError('Invalid Anthropic API key', 401, provider);
      }
      break;

    case 'google':
      if (error.response?.status === 403) {
        return new AppError('Invalid Google AI API key', 403, provider);
      }
      break;

    case 'deepseek':
      if (error.response?.status === 401) {
        return new AppError('Invalid DeepSeek API key', 401, provider);
      }
      break;

    case 'meta':
      if (error.response?.status === 401) {
        return new AppError('Invalid Meta AI API key', 401, provider);
      }
      break;

    case 'mistral':
      if (error.response?.status === 401) {
        return new AppError('Invalid Mistral API key', 401, provider);
      }
      break;
  }

  // Generic rate limit detection
  if (
    rateLimitStatuses.includes(error.response?.status) ||
    rateLimitPatterns.some(pattern => pattern.test(error.message))
  ) {
    return new AppError(
      `Rate limit exceeded for ${provider}. Please try again later.`,
      429,
      provider
    );
  }

  // Default error
  return new AppError(
    error.message || 'An unexpected error occurred',
    error.response?.status || 500,
    provider
  );
}

export function createErrorResponse(error: unknown): NextResponse {
  const response: ErrorResponse = {
    message: 'Internal Server Error',
    status: 500
  };

  if (error instanceof AppError) {
    response.message = error.message;
    response.status = error.status;
    if (error.provider) {
      response.provider = error.provider;
    }
  } else if (error instanceof Error) {
    response.message = error.message;
  }

  return NextResponse.json(response, { status: response.status });
}
