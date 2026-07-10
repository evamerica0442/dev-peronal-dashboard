import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  // Rate limit: 10 signups per hour per IP
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`signup:${ip}`, { limit: 10, windowSec: 3600 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many signup attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { username, email, password } = parsed.data;

  // Check uniqueness
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() },
      ],
    },
    select: { username: true, email: true },
  });

  if (existing) {
    const field = existing.email === email.toLowerCase() ? "email" : "username";
    return NextResponse.json(
      { error: `That ${field} is already taken.` },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      hashedPassword,
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
