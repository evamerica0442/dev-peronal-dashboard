export interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
        {label}
      </label>
      {children}
      {error && (
        <p className="text-sm" style={{ color: "var(--color-danger)" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
