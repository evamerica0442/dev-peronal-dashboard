import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tileSchema, reorderSchema } from "@/lib/validations";

// POST /api/tiles — create a new tile
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = tileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Verify the category belongs to this user
  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, userId: session.user.id },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const maxOrder = await prisma.tile.aggregate({
    where: { categoryId: parsed.data.categoryId },
    _max: { sortOrder: true },
  });

  const tile = await prisma.tile.create({
    data: {
      categoryId: parsed.data.categoryId,
      title: parsed.data.title,
      url: parsed.data.url,
      imageUrl: parsed.data.imageUrl || null,
      description: parsed.data.description || null,
      accentColor: parsed.data.accentColor || null,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json(tile, { status: 201 });
}

// PATCH /api/tiles — reorder tiles (cross-category supported)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Support both reorder-only and reorder+category-change
  const parsed = z.object({
    items: z.array(
      z.object({
        id: z.string().cuid(),
        sortOrder: z.number().int().min(0),
        categoryId: z.string().cuid().optional(),
      })
    ),
  }).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const ids = parsed.data.items.map((i) => i.id);

  // Verify ownership via category → user
  const tiles = await prisma.tile.findMany({
    where: { id: { in: ids } },
    include: { category: { select: { userId: true } } },
  });

  const allOwned = tiles.every((t) => t.category.userId === session.user!.id);
  if (!allOwned || tiles.length !== ids.length) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.$transaction(
    parsed.data.items.map(({ id, sortOrder, categoryId }) =>
      prisma.tile.update({
        where: { id },
        data: { sortOrder, ...(categoryId ? { categoryId } : {}) },
      })
    )
  );

  return NextResponse.json({ success: true });
}

// Inline z import needed for extended schema
import { z } from "zod";
