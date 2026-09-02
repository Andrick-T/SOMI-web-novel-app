interface MiniBarChartProps {
  values: number[];
  labels: string[];
  color?: string;
  labelColor?: string;
  height?: number;
}

export default function MiniBarChart({
  values,
  labels,
  color = "var(--color-accent-primary)",
  labelColor = "var(--color-text-muted)",
  height = 48,
}: MiniBarChartProps) {
  const max = Math.max(...values, 1);

  return (
    <div
      className="flex items-end gap-1"
      style={{ minHeight: `${height + 16}px` }}
      aria-label="Bar chart"
    >
      {values.map((value, index) => (
        <div
          key={`${labels[index] ?? "bar"}-${index}`}
          className="flex flex-1 flex-col items-center gap-1"
        >
          <div
            className="w-full rounded-sm"
            style={{
              height: `${(value / max) * height}px`,
              background: color,
              opacity: 0.85,
            }}
          />
          <span className="text-[8px]" style={{ color: labelColor }}>
            {labels[index]}
          </span>
        </div>
      ))}
    </div>
  );
}
