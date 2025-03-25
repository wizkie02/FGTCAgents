export class AppError extends Error {
    status: number;
  
    constructor(message: string, status: number = 500) {
      super(message);
      this.name = 'AppError';
      this.status = status;
    }
  }
  
  export function createErrorResponse(error: unknown) {
    const isAppError = error instanceof AppError;
  
    const message = isAppError
      ? error.message
      : error instanceof Error
      ? error.message
      : 'Unknown error occurred';
  
    const status = isAppError ? error.status : 500;
  
    console.error('[ERROR]', error);
  
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  