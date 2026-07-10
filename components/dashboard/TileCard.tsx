"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import type { TileData } from "@/types";

interface TileCardProps {
  tile: TileData;
  onEdit: () => void;
  onDelete: () => void;
  isDragging?: boolean;
}

/** Attempt to get a favicon from the tile's URL domain */
function getFaviconUrl(url: string): string {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return "";
  }
}

export function TileCard({ tile, onEdit, onDelete, isDragging }: TileCardProps) {
  const [imgError, setImgError] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: tile.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  const imageUrl = tile.imageUrl && !imgError ? tile.imageUrl : getFaviconUrl(tile.url);
  const accentStyle = tile.accentColor
    ? { borderTop: `3px solid ${tile.accentColor}` }
    : {};

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, ...accentStyle }}
      className={`
        group relative rounded-xl overflow-hidden cursor-pointer
        transition-all duration-200
        hover:translate-y-[-2px] hover:shadow-lg
        ${isDragging ? "shadow-2xl" : ""}
      `}
      {...attributes}
      {...listeners}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Accent border already handled in style */}
      <div
        className="p-4 h-full flex flex-col gap-2"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: tile.accentColor ? "0 0 0.75rem 0.75rem" : "0.75rem",
          borderTop: tile.accentColor ? "none" : "1px solid var(--color-border)",
        }}
      >
        {/* Top: icon + title */}
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center"
            style={{ background: "var(--color-surface-raised)" }}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt=""
                width={36}
                height={36}
                className="object-contain"
                onError={() => setImgError(true)}
                unoptimized
              />
            ) : (
              <span className="text-xs font-bold" style={{ color: "var(--color-text-muted)" }}>
                {tile.title[0].toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold leading-tight truncate"
              style={{ color: "var(--color-text-primary)" }}
            >
              {tile.title}
            </p>
            {tile.description && (
              <p
                className="text-xs mt-0.5 line-clamp-2"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {tile.description}
              </p>
            )}
          </div>
        </div>

        {/* Open link button */}
        <a
          href={tile.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto text-xs flex items-center gap-1 transition-colors"
          style={{ color: "var(--color-text-muted)" }}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Open ${tile.title} in new tab`}
        >
          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span className="truncate">{new URL(tile.url).hostname.replace("www.", "")}</span>
        </a>
      </div>

      {/* Hover action buttons */}
      <div
        className={`absolute top-2 right-2 flex items-center gap-1 transition-opacity ${
          showActions ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-1 rounded-md backdrop-blur-sm"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
          aria-label="Edit tile"
          title="Edit"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Delete tile "${tile.title}"?`)) onDelete();
          }}
          className="p-1 rounded-md backdrop-blur-sm"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-danger)",
          }}
          aria-label="Delete tile"
          title="Delete"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
