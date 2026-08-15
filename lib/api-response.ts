import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// Success responses
export const ok = (data: unknown) => NextResponse.json(data, { status: 200 });
export const created = (data: unknown) => NextResponse.json(data, { status: 201 });
export const noContent = () => new NextResponse(null, { status: 204 });

// Error responses
export const badRequest = (msg = 'Bad request') => NextResponse.json({ error: msg }, { status: 400 });
export const unauthorized = (msg = 'Unauthorized') => NextResponse.json({ error: msg }, { status: 401 });
export const forbidden = (msg = 'Forbidden') => NextResponse.json({ error: msg }, { status: 403 });
export const notFound = (resource = 'Resource') => NextResponse.json({ error: `${resource} not found` }, { status: 404 });
export const unprocessable = (errors: unknown) => NextResponse.json({ errors }, { status: 422 });
export const serverError = (msg = 'Internal server error') => NextResponse.json({ error: msg }, { status: 500 });

// Zod error handler
export const zodError = (err: ZodError) => unprocessable(err.flatten().fieldErrors);
