"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema } from "@/lib/validations";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import type { UserProfile } from "@/types";
import type { z } from "zod";

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export function AccountPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  useEffect(() => {
    fetch("/api/account")
      .then((r) => r.json())
      .then(setUser);
  }, []);

  const onChangePassword = async (values: ChangePasswordValues) => {
    setSaving(true);
    setPwError("");
    setPwSuccess(false);

    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    setSaving(false);

    if (res.ok) {
      setPwSuccess(true);
      reset();
    } else {
      const data = await res.json();
      setPwError(data.error || "Failed to update password.");
    }
  };

  const handleExport = async () => {
    setExporting(true);
    const res = await fetch("/api/account/export");
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dev-hub-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setExporting(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
        Account
      </h1>

      {/* Profile info */}
      <section
        className="rounded-2xl p-6"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--color-text-secondary)" }}>
          Profile
        </h2>
        {user ? (
          <dl className="space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Username</dt>
              <dd className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                {user.username}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Email</dt>
              <dd className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                {user.email}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Member since</dt>
              <dd className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                {new Date(user.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Loading…</p>
        )}
      </section>

      {/* Change password */}
      <section
        className="rounded-2xl p-6"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--color-text-secondary)" }}>
          Change Password
        </h2>
        <form onSubmit={handleSubmit(onChangePassword)} className="space-y-5">
          <FormField label="Current Password" error={errors.currentPassword?.message}>
            <input
              {...register("currentPassword")}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="input"
              aria-invalid={!!errors.currentPassword}
            />
          </FormField>
          <FormField label="New Password" error={errors.newPassword?.message}>
            <input
              {...register("newPassword")}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className="input"
              aria-invalid={!!errors.newPassword}
            />
          </FormField>
          <FormField label="Confirm New Password" error={errors.confirmNewPassword?.message}>
            <input
              {...register("confirmNewPassword")}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className="input"
              aria-invalid={!!errors.confirmNewPassword}
            />
          </FormField>

          {pwError && (
            <p className="text-sm" style={{ color: "var(--color-danger)" }} role="alert">
              {pwError}
            </p>
          )}
          {pwSuccess && (
            <p className="text-sm" style={{ color: "var(--color-success)" }} role="status">
              Password updated successfully.
            </p>
          )}

          <Button type="submit" loading={saving}>
            Update Password
          </Button>
        </form>
      </section>

      {/* Data export */}
      <section
        className="rounded-2xl p-6"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-secondary)" }}>
          Export Data
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
          Download all your categories and tiles as a JSON file.
        </p>
        <Button variant="secondary" onClick={handleExport} loading={exporting}>
          Export as JSON
        </Button>
      </section>
    </div>
  );
}
