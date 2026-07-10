"use client";

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  loading,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const baseClass = `
    px-5 py-2.5 rounded-lg font-medium transition-all 
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-offset-2
  `;

  let variantClass = "";
  switch (variant) {
    case "primary":
      variantClass = `bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] 
        text-white focus:ring-[var(--color-accent)]`;
      break;
    case "secondary":
      variantClass = `bg-[var(--color-surface-raised)] hover:bg-[var(--color-border)] 
        text-[var(--color-text-primary)] border border-[var(--color-border)]
        focus:ring-[var(--color-border)]`;
      break;
    case "danger":
      variantClass = `bg-[var(--color-danger)] hover:brightness-110 
        text-white focus:ring-[var(--color-danger)]`;
      break;
    case "ghost":
      variantClass = `hover:bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]
        focus:ring-[var(--color-border)]`;
      break;
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${baseClass} ${variantClass} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
