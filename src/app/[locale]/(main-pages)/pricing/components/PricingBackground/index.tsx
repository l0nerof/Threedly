function PricingBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_36%),radial-gradient(circle_at_86%_28%,color-mix(in_oklch,var(--chart-3)_12%,transparent),transparent_34%),radial-gradient(circle_at_12%_70%,color-mix(in_oklch,var(--primary)_8%,transparent),transparent_34%)]" />
      <div className="absolute inset-0 [background-image:linear-gradient(to_right,color-mix(in_oklch,var(--primary)_24%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--primary)_22%,transparent)_1px,transparent_1px)] [background-size:72px_72px] opacity-80 dark:opacity-65" />
      <div className="absolute inset-0 [background-image:linear-gradient(to_right,color-mix(in_oklch,var(--foreground)_9%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--foreground)_8%,transparent)_1px,transparent_1px)] [background-size:144px_144px] opacity-45 dark:opacity-35" />
      <div className="bg-background/90 pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_28%,black_92%)]" />
      <div className="from-background via-background/64 absolute inset-x-0 top-0 h-56 bg-linear-to-b to-transparent" />
      <div className="from-background/5 via-background/45 to-background absolute inset-x-0 bottom-0 h-96 bg-linear-to-b" />
    </div>
  );
}

export default PricingBackground;
