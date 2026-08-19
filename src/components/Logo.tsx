export function Logo({ size = 32 }: { size?: number }) {
  const inner = size / 2;
  return (
    <div
      className="bg-primary rounded-sm flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <div className="bg-background rotate-45" style={{ width: inner, height: inner }} />
    </div>
  );
}
