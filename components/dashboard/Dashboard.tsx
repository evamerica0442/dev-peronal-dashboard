"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import type { CategoryData, TileData } from "@/types";
import { CategorySection } from "./CategorySection";
import { TileCard } from "./TileCard";
import { TileModal } from "./TileModal";
import { CategoryModal } from "./CategoryModal";
import { Button } from "@/components/ui/Button";

export function Dashboard() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal state
  const [tileModalOpen, setTileModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingTile, setEditingTile] = useState<TileData | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>("");

  // DnD active item
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTile, setActiveTile] = useState<TileData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ── Category CRUD ─────────────────────────────────────────────────────────

  const handleCreateCategory = async (name: string) => {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const cat = await res.json();
      setCategories((prev) => [...prev, cat]);
    }
    return res.ok;
  };

  const handleRenameCategory = async (id: string, name: string) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name } : c))
      );
    }
    return res.ok;
  };

  const handleDeleteCategory = async (id: string) => {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
    return res.ok;
  };

  // ── Tile CRUD ─────────────────────────────────────────────────────────────

  const handleCreateTile = async (data: Omit<TileData, "id" | "sortOrder">) => {
    const res = await fetch("/api/tiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const tile = await res.json();
      setCategories((prev) =>
        prev.map((c) =>
          c.id === tile.categoryId
            ? { ...c, tiles: [...c.tiles, tile] }
            : c
        )
      );
    }
    return res.ok;
  };

  const handleUpdateTile = async (id: string, data: Omit<TileData, "id" | "sortOrder">) => {
    const res = await fetch(`/api/tiles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setCategories((prev) =>
        prev.map((c) => ({
          ...c,
          tiles: c.tiles
            .filter((t) => t.id !== id)
            .concat(c.id === updated.categoryId ? [updated] : [])
            .sort((a, b) => a.sortOrder - b.sortOrder),
        }))
      );
    }
    return res.ok;
  };

  const handleDeleteTile = async (tileId: string, categoryId: string) => {
    const res = await fetch(`/api/tiles/${tileId}`, { method: "DELETE" });
    if (res.ok) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId
            ? { ...c, tiles: c.tiles.filter((t) => t.id !== tileId) }
            : c
        )
      );
    }
    return res.ok;
  };

  // ── Drag & Drop ───────────────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id as string);
    // Find the tile being dragged
    for (const cat of categories) {
      const tile = cat.tiles.find((t) => t.id === active.id);
      if (tile) {
        setActiveTile(tile);
        break;
      }
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find source category
    const sourceCat = categories.find((c) => c.tiles.some((t) => t.id === activeId));
    if (!sourceCat) return;

    // Find dest category — could be a category id or a tile id
    const destCat =
      categories.find((c) => c.id === overId) ||
      categories.find((c) => c.tiles.some((t) => t.id === overId));

    if (!destCat || sourceCat.id === destCat.id) return;

    // Move tile to new category (optimistic UI)
    setCategories((prev) => {
      const tile = sourceCat.tiles.find((t) => t.id === activeId)!;
      return prev.map((c) => {
        if (c.id === sourceCat.id) {
          return { ...c, tiles: c.tiles.filter((t) => t.id !== activeId) };
        }
        if (c.id === destCat.id) {
          return { ...c, tiles: [...c.tiles, { ...tile, categoryId: destCat.id }] };
        }
        return c;
      });
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setActiveTile(null);
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which category contains the active tile
    const cat = categories.find((c) => c.tiles.some((t) => t.id === activeId));
    if (!cat) return;

    const oldIdx = cat.tiles.findIndex((t) => t.id === activeId);
    const newIdx = cat.tiles.findIndex((t) => t.id === overId);

    if (oldIdx === -1 || newIdx === -1) return;

    const reordered = arrayMove(cat.tiles, oldIdx, newIdx).map((t, i) => ({
      ...t,
      sortOrder: i,
    }));

    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, tiles: reordered } : c))
    );

    // Persist
    await fetch("/api/tiles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: reordered.map((t) => ({
          id: t.id,
          sortOrder: t.sortOrder,
          categoryId: t.categoryId,
        })),
      }),
    });
  }

  // ── Search filter ─────────────────────────────────────────────────────────

  const filteredCategories = search.trim()
    ? categories
        .map((c) => ({
          ...c,
          tiles: c.tiles.filter(
            (t) =>
              t.title.toLowerCase().includes(search.toLowerCase()) ||
              (t.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
              t.url.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((c) => c.tiles.length > 0)
    : categories;

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" style={{ color: "var(--color-accent)" }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--color-text-muted)" }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tiles…"
            className="input pl-9"
            aria-label="Search tiles"
          />
        </div>
        <Button
          onClick={() => setCategoryModalOpen(true)}
          variant="secondary"
        >
          + Add Category
        </Button>
      </div>

      {/* Empty state */}
      {categories.length === 0 && (
        <div
          className="rounded-2xl p-16 text-center"
          style={{
            border: "2px dashed var(--color-border)",
          }}
        >
          <p className="text-4xl mb-4">📌</p>
          <p className="text-lg font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
            No categories yet
          </p>
          <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>
            Create a category, then add tiles to organize your tools, repos, and docs.
          </p>
          <Button onClick={() => setCategoryModalOpen(true)}>
            Create your first category
          </Button>
        </div>
      )}

      {/* Search empty state */}
      {categories.length > 0 && search && filteredCategories.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
            No results for &quot;{search}&quot;
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Try a different search term
          </p>
        </div>
      )}

      {/* DnD context wrapping all categories */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-8">
          {filteredCategories.map((category) => (
            <SortableContext
              key={category.id}
              items={category.tiles.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <CategorySection
                category={category}
                onAddTile={(catId) => {
                  setDefaultCategoryId(catId);
                  setEditingTile(null);
                  setTileModalOpen(true);
                }}
                onEditTile={(tile) => {
                  setEditingTile(tile);
                  setTileModalOpen(true);
                }}
                onDeleteTile={handleDeleteTile}
                onEditCategory={(cat) => {
                  setEditingCategory(cat);
                  setCategoryModalOpen(true);
                }}
                onDeleteCategory={handleDeleteCategory}
              />
            </SortableContext>
          ))}
        </div>

        <DragOverlay>
          {activeTile && (
            <div style={{ transform: "rotate(2deg)", opacity: 0.85 }}>
              <TileCard tile={activeTile} onEdit={() => {}} onDelete={() => {}} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Modals */}
      <TileModal
        open={tileModalOpen}
        onClose={() => {
          setTileModalOpen(false);
          setEditingTile(null);
        }}
        tile={editingTile}
        categories={categories}
        defaultCategoryId={defaultCategoryId}
        onCreate={handleCreateTile}
        onUpdate={handleUpdateTile}
      />

      <CategoryModal
        open={categoryModalOpen}
        onClose={() => {
          setCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        onCreate={handleCreateCategory}
        onUpdate={handleRenameCategory}
      />
    </>
  );
}
