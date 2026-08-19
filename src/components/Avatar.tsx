export function Avatar({ name, color, size = 40 }: { name: string; color: string; size?: number }) {
  return (
    <div
      className="rounded-sm flex items-center justify-center font-bold text-background shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.4 }}
    >
      {name[0]?.toUpperCase()}
    </div>
  );
}
