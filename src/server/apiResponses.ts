import { NextResponse } from "next/server";

export function ok<T>(body: T): NextResponse<T> {
  return NextResponse.json(body);
}

export function badRequest(message: string): NextResponse<{ error: string }> {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Not found"): NextResponse<{ error: string }> {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(error: unknown): NextResponse<{ error: string }> {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  return NextResponse.json({ error: message }, { status: 500 });
}
