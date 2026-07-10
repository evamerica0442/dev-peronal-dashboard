import { SignupForm } from "@/components/auth/SignupForm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Create Account — Dev Hub" };

export default async function SignupPage() {
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
          Create your private dev resource hub
        </p>
      </div>
      <SignupForm />
      <p className="mt-6 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Already have an account?{" "}
        <a
          href="/login"
          className="font-medium transition-colors"
          style={{ color: "var(--color-accent)" }}
        >
          Sign in
        </a>
      </p>
    </div>
  );
}
