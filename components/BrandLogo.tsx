import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  priority,
  size = "md",
}: {
  className?: string;
  priority?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: { height: 28, width: 96 },
    md: { height: 36, width: 124 },
    lg: { height: 52, width: 180 },
  };
  const s = sizes[size];
  return (
    <Image
      src="/logo.png"
      alt="EVAM"
      width={s.width}
      height={s.height}
      priority={priority}
      unoptimized
      className={cn("h-auto w-auto max-w-full object-contain object-left", className)}
      style={{ maxHeight: s.height }}
    />
  );
}
