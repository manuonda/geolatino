"use client";

type ConfirmToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function ConfirmToggle({ checked, onChange }: ConfirmToggleProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3 font-display text-base text-cream">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span className="flex h-7 w-7 items-center justify-center border-[3px] border-gold bg-night text-gold peer-checked:bg-gold peer-checked:text-night">
        {checked ? "✓" : ""}
      </span>
      Confirmar antes de bloquear
    </label>
  );
}
