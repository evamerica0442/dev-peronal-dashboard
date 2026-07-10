"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { signupSchema } from "@/lib/validations";
import type { z } from "zod";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

type SignupValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (values: SignupValues) => {
    setLoading(true);
    setServerError("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const data = await res.json();
      setServerError(data.error || "Signup failed. Please try again.");
      setLoading(false);
      return;
    }

    // Signup successful — redirect to login
    router.push("/login?newAccount=true");
  };

  return (
    <div
      className="rounded-2xl p-8"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormField label="Username" error={errors.username?.message}>
          <input
            {...register("username")}
            type="text"
            autoComplete="username"
            placeholder="yourhandle"
            className="input"
            aria-invalid={!!errors.username}
          />
        </FormField>

        <FormField label="Email" error={errors.email?.message}>
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="input"
            aria-invalid={!!errors.email}
          />
        </FormField>

        <FormField label="Password" error={errors.password?.message}>
          <input
            {...register("password")}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="input"
            aria-invalid={!!errors.password}
          />
        </FormField>

        <FormField label="Confirm Password" error={errors.confirmPassword?.message}>
          <input
            {...register("confirmPassword")}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="input"
            aria-invalid={!!errors.confirmPassword}
          />
        </FormField>

        {serverError && (
          <p className="text-sm" style={{ color: "var(--color-danger)" }} role="alert">
            {serverError}
          </p>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Create Account
        </Button>
      </form>
    </div>
  );
}
