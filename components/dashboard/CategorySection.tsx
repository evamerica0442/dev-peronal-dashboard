"use client";

import { useState } from "react";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import type { CategoryData, TileData } from "@/types";
import { TileCard } from "./TileCard";

interface CategorySectionProps {
  category: CategoryData;
  onAddTile: (categoryId: string) => void;
  onEditTile: (tile: TileData) => void;
  onDeleteTile: (tileId: string, categoryId: string) => void;
  onEditCategory: (category: CategoryData) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export function CategorySection({
  category,
  onAddTile,
  onEditTile,
  onDeleteTile,
  onEditCategory,
  onDeleteCategory,
}: CategorySectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showActions, setShowActions] = useState(false);

  return (
    <section aria-label={category.name}>
      {/* Category header */}
      <div
        className="flex items-center justify-between mb-4 group"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <button
          className="flex items-center gap-2 text-left"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          aria-controls={`category-${category.id}`}
        >
          <svg
            className={`w-4 h-4 transition-transform ${collapsed ? "-rotate-90" : ""}`}
            style={{ color: "var(--color-text-muted)" }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
            {category.name}
          </h2>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full"
            style={{
              background: "var(--color-surface-raised)",
              color: "var(--color-text-muted)",
            }}
          >
            {category.tiles.length}
          </span>
        </button>

        <div
          className={`flex items-center gap-1 transition-opacity ${
            showActions ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={() => onEditCategory(category)}
            className="p-1.5 rounded-lg text-xs transition-colors"
            style={{ color: "var(--color-text-muted)" }}
            title="Rename category"
            aria-label="Rename category"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Delete category "${category.name}"? All tiles inside will be deleted too.`)) {
                onDeleteCategory(category.id);
              }
            }}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--color-text-muted)" }}
            title="Delete category"
            aria-label="Delete category"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tiles grid */}
      {!collapsed && (
        <div
          id={`category-${category.id}`}
          className="grid gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          }}
        >
          <SortableContext
            items={category.tiles.map((t) => t.id)}
            strategy={horizontalListSortingStrategy}
          >
            {category.tiles.map((tile) => (
              <TileCard
                key={tile.id}
                tile={tile}
                onEdit={() => onEditTile(tile)}
                onDelete={() => onDeleteTile(tile.id, category.id)}
              />
            ))}
          </SortableContext>

          {/* Add tile button */}
          <button
            onClick={() => onAddTile(category.id)}
            className="rounded-xl border-2 border-dashed flex items-center justify-center gap-2 p-4 min-h-[88px] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
            }}
            aria-label="Add tile"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">Add tile</span>
          </button>
        </div>
      )}
    </section>
  );
}
