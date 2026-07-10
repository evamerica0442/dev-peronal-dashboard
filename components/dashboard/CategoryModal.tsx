"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema } from "@/lib/validations";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import type { CategoryData } from "@/types";
import type { z } from "zod";

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  category: CategoryData | null;
  onCreate: (name: string) => Promise<boolean>;
  onUpdate: (id: string, name: string) => Promise<boolean>;
}

export function CategoryModal({
  open,
  onClose,
  category,
  onCreate,
  onUpdate,
}: CategoryModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
  });

  useEffect(() => {
    if (open) {
      reset({ name: category?.name || "" });
    }
  }, [open, category, reset]);

  const onSubmit = async ({ name }: CategoryFormValues) => {
    setSubmitting(true);
    const success = category
      ? await onUpdate(category.id, name)
      : await onCreate(name);
    setSubmitting(false);
    if (success) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? "Rename Category" : "New Category"}
      maxWidth="max-w-sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField label="Category Name" error={errors.name?.message}>
          <input
            {...register("name")}
            type="text"
            placeholder="GitHub Repos"
            className="input"
            autoFocus
            aria-invalid={!!errors.name}
          />
        </FormField>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={submitting} className="flex-1">
            {category ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
