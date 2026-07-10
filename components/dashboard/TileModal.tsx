"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tileSchema } from "@/lib/validations";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import type { CategoryData, TileData } from "@/types";
import type { z } from "zod";

type TileFormValues = z.infer<typeof tileSchema>;

interface TileModalProps {
  open: boolean;
  onClose: () => void;
  tile: TileData | null;
  categories: CategoryData[];
  defaultCategoryId?: string;
  onCreate: (data: Omit<TileData, "id" | "sortOrder">) => Promise<boolean>;
  onUpdate: (id: string, data: Omit<TileData, "id" | "sortOrder">) => Promise<boolean>;
}

export function TileModal({
  open,
  onClose,
  tile,
  categories,
  defaultCategoryId,
  onCreate,
  onUpdate,
}: TileModalProps) {
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<TileFormValues>({
    resolver: zodResolver(tileSchema),
  });

  useEffect(() => {
    if (open) {
      if (tile) {
        reset({
          title: tile.title,
          url: tile.url,
          imageUrl: tile.imageUrl || "",
          description: tile.description || "",
          accentColor: tile.accentColor || "",
          categoryId: tile.categoryId,
        });
      } else {
        reset({
          title: "",
          url: "",
          imageUrl: "",
          description: "",
          accentColor: "",
          categoryId: defaultCategoryId || categories[0]?.id || "",
        });
      }
    }
  }, [open, tile, defaultCategoryId, categories, reset]);

  const onSubmit = async (data: TileFormValues) => {
    setSubmitting(true);
    const success = tile
      ? await onUpdate(tile.id, {
          ...data,
          imageUrl: data.imageUrl || null,
          description: data.description || null,
          accentColor: data.accentColor || null,
        })
      : await onCreate({
          ...data,
          imageUrl: data.imageUrl || null,
          description: data.description || null,
          accentColor: data.accentColor || null,
        });
    setSubmitting(false);
    if (success) onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const error = await res.json();
        setUploadError(error.error || "Upload failed");
        return;
      }
      const { url } = await res.json();
      setValue("imageUrl", url);
    } catch {
      setUploadError("Upload failed. Try pasting an image URL instead.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tile ? "Edit Tile" : "Add Tile"}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField label="Title" error={errors.title?.message}>
          <input
            {...register("title")}
            type="text"
            placeholder="My Awesome Repo"
            className="input"
            autoFocus
            aria-invalid={!!errors.title}
          />
        </FormField>

        <FormField label="URL" error={errors.url?.message}>
          <input
            {...register("url")}
            type="url"
            placeholder="https://github.com/username/repo"
            className="input"
            aria-invalid={!!errors.url}
          />
        </FormField>

        <FormField label="Category" error={errors.categoryId?.message}>
          <select
            {...register("categoryId")}
            className="input"
            aria-invalid={!!errors.categoryId}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </FormField>

        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Image URL (optional)" error={errors.imageUrl?.message}>
            <input
              {...register("imageUrl")}
              type="url"
              placeholder="https://example.com/icon.png"
              className="input"
              aria-invalid={!!errors.imageUrl}
            />
          </FormField>

          <FormField
            label="Or upload image"
            error={uploadError}
          >
            <label className="input flex items-center gap-2 cursor-pointer">
              <svg className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {uploading ? (
                <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>Uploading…</span>
              ) : (
                <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>Choose file</span>
              )}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </FormField>
        </div>

        <FormField label="Description (optional)" error={errors.description?.message}>
          <textarea
            {...register("description")}
            rows={2}
            placeholder="A brief note about this resource"
            className="input resize-none"
            aria-invalid={!!errors.description}
          />
        </FormField>

        <FormField label="Accent color (optional)" error={errors.accentColor?.message}>
          <div className="flex items-center gap-2">
            <input
              {...register("accentColor")}
              type="color"
              className="w-12 h-10 rounded cursor-pointer"
              style={{
                border: "1px solid var(--color-border)",
                background: "var(--color-surface-raised)",
              }}
            />
            <input
              {...register("accentColor")}
              type="text"
              placeholder="#7c6cfc"
              className="input flex-1"
              aria-invalid={!!errors.accentColor}
            />
          </div>
        </FormField>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={submitting} className="flex-1">
            {tile ? "Save" : "Add Tile"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
