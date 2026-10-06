import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export const blockButtonClass =
  "inline-flex min-h-12 items-center justify-center border-[3px] px-5 font-sans text-base font-semibold tracking-wide block-shadow transition-transform";

export const blockButtonVariants = {
  primary:
    "bg-gold text-night border-night hover:translate-x-px hover:translate-y-px active:translate-x-0.5 active:translate-y-0.5",
  ghost: "bg-pitch/80 text-cream border-cream/30",
};

export function Button({
  children,
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${blockButtonClass} ${blockButtonVariants[variant]} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
