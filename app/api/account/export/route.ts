import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/account/export — export all user data as JSON
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
        select: {
          id: true,
          title: true,
          url: true,
          imageUrl: true,
          description: true,
          accentColor: true,
          sortOrder: true,
          createdAt: true,
          categoryId: true,
          updatedAt: true,
        },
      },
    },
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    categories,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="dev-hub-export-${Date.now()}.json"`,
    },
  });
}
