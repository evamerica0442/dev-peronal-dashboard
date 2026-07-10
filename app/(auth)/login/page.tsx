import { LoginForm } from "@/components/auth/LoginForm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Sign In — Dev Hub" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="text-3xl">⚡</span>
          <span className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Dev Hub
          </span>
        </div>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Sign in to your dashboard
        </p>
      </div>
      <LoginForm />
      <p className="mt-6 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Don&apos;t have an account?{" "}
        <a
          href="/signup"
          className="font-medium transition-colors"
          style={{ color: "var(--color-accent)" }}
        >
          Sign up
        </a>
      </p>
    </div>
  );
}
