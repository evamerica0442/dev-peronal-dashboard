import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorySchema, reorderSchema } from "@/lib/validations";

// GET /api/categories — fetch all categories with tiles for the current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    orderBy: { sortOrder: "asc" },
    include: {
      tiles: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return NextResponse.json(categories);
}

// POST /api/categories — create a new category
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

  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Place new category at the end
  const maxOrder = await prisma.category.aggregate({
    where: { userId: session.user.id },
    _max: { sortOrder: true },
  });

  const category = await prisma.category.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
    include: { tiles: true },
  });

  return NextResponse.json(category, { status: 201 });
}

// PATCH /api/categories — reorder categories
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

  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  // Verify all IDs belong to this user
  const ids = parsed.data.items.map((i) => i.id);
  const owned = await prisma.category.findMany({
    where: { id: { in: ids }, userId: session.user.id },
    select: { id: true },
  });

  if (owned.length !== ids.length) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.$transaction(
    parsed.data.items.map(({ id, sortOrder }) =>
      prisma.category.update({ where: { id }, data: { sortOrder } })
    )
  );

  return NextResponse.json({ success: true });
}
