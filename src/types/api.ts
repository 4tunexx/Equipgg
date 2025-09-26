import { NextRequest } from 'next/server';

// Route Context Types for Next.js App Router
export interface RouteContext {
  params?: { [key: string]: string | string[] };
  searchParams?: { [key: string]: string | string[] };
}

// Route Handler Types
export type RouteHandler = (
  req: NextRequest,
  context: RouteContext
) => Promise<Response>;

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

// API Error Types
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API Handler Factory with Error Handling
export function createApiHandler(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, context: RouteContext) => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof ApiError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message,
            code: error.code
          }),
          { status: error.statusCode }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Internal server error'
        }),
        { status: 500 }
      );
    }
  };
}

// Helper function to validate request method
export function validateMethod(
  req: NextRequest,
  allowedMethods: string[]
): void {
  if (!allowedMethods.includes(req.method)) {
    throw new ApiError(
      `Method ${req.method} Not Allowed`,
      405,
      'METHOD_NOT_ALLOWED'
    );
  }
}