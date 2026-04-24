type CatalogResultsMessageProps = {
  ariaLabel: string;
  message: string;
};

function CatalogResultsMessage({
  ariaLabel,
  message,
}: CatalogResultsMessageProps) {
  return (
    <section
      aria-label={ariaLabel}
      className="border-border/60 bg-surface/95 flex flex-col items-center justify-center gap-4 rounded-4xl border p-12 text-center shadow-[0_28px_100px_hsl(var(--foreground)/0.08)] backdrop-blur-xl"
    >
      <p className="text-muted-foreground text-sm">{message}</p>
    </section>
  );
}

export default CatalogResultsMessage;
