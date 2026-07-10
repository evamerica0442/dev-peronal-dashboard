"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { loginSchema } from "@/lib/validations";
import type { z } from "zod";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginValues) => {
    setLoading(true);
    setServerError("");

    const result = await signIn("credentials", {
      identifier: values.identifier,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setServerError("Invalid username/email or password.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
        <FormField
          label="Username or Email"
          error={errors.identifier?.message}
        >
          <input
            {...register("identifier")}
            type="text"
            autoComplete="username"
            placeholder="you@example.com"
            className="input"
            aria-invalid={!!errors.identifier}
          />
        </FormField>

        <FormField label="Password" error={errors.password?.message}>
          <input
            {...register("password")}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="input"
            aria-invalid={!!errors.password}
          />
        </FormField>

        {serverError && (
          <p className="text-sm" style={{ color: "var(--color-danger)" }} role="alert">
            {serverError}
          </p>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Sign In
        </Button>
      </form>
    </div>
  );
}
