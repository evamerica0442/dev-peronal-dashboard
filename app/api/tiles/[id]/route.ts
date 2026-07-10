import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tileSchema } from "@/lib/validations";
import { deleteFromR2, keyFromR2Url } from "@/lib/r2";

async function getOwnedTile(tileId: string, userId: string) {
  return prisma.tile.findFirst({
    where: {
      id: tileId,
      category: { userId },
    },
  });
}

// PUT /api/tiles/[id] — update a tile
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tile = await getOwnedTile(id, session.user.id);
  if (!tile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  // If the image URL changed and the old one was an R2 upload, clean it up
  if (tile.imageUrl && tile.imageUrl !== parsed.data.imageUrl) {
    const r2Key = keyFromR2Url(tile.imageUrl);
    if (r2Key) {
      try {
        await deleteFromR2(r2Key);
      } catch {
        // Non-fatal — log and continue
        console.error("Failed to delete old R2 image:", r2Key);
      }
    }
  }

  const updated = await prisma.tile.update({
    where: { id },
    data: {
      title: parsed.data.title,
      url: parsed.data.url,
      imageUrl: parsed.data.imageUrl || null,
      description: parsed.data.description || null,
      accentColor: parsed.data.accentColor || null,
      categoryId: parsed.data.categoryId,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/tiles/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tile = await getOwnedTile(id, session.user.id);
  if (!tile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete R2 image if present
  if (tile.imageUrl) {
    const r2Key = keyFromR2Url(tile.imageUrl);
    if (r2Key) {
      try {
        await deleteFromR2(r2Key);
      } catch {
        console.error("Failed to delete R2 image on tile delete:", r2Key);
      }
    }
  }

  await prisma.tile.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
