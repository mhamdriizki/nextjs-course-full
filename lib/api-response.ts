import { NextResponse } from "next/server";
import { ZodError } from "zod";

// Successs Responses
export const ok = (data: unknown) => NextResponse.json(data, { status: 200 });
export const created = (data: unknown) =>
  NextResponse.json(data, { status: 201 });
export const noContent = () => new NextResponse(null, { status: 204 });

// Error Response
export const badRequest = (msg = "Bad Request") =>
  NextResponse.json({ error: msg }, { status: 400 });
export const unauthorized = (msg = "Unauthorized") =>
  NextResponse.json({ error: msg }, { status: 401 });
export const forbidden = (msg = "Forbidden") =>
  NextResponse.json({ error: msg }, { status: 403 });
export const notFound = (msg = "data Not Found") =>
  NextResponse.json({ error: msg }, { status: 404 });
export const unprocessable = (msg: unknown) =>
  NextResponse.json({ msg }, { status: 422 });
export const serverError = (msg = "Internal Server Error") =>
  NextResponse.json({ error: msg }, { status: 500 });

// Zod error handler
export const zodError = (err: ZodError) =>
  unprocessable(err.flatten().fieldErrors);
