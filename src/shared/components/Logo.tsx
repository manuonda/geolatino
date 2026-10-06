type LogoProps = {
  size?: "sm" | "lg";
};

export function Logo({ size = "sm" }: LogoProps) {
  const headingClass = size === "lg" ? "text-5xl sm:text-7xl" : "text-xl";

  return (
    <span className={`font-display leading-none text-gold ${headingClass}`}>
      GeoLatino
    </span>
  );
}
