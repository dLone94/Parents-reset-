import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

export function Container({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-5xl px-5 sm:px-8", className)} {...rest} />;
}

export function Narrow({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-xl px-5 sm:px-8", className)} {...rest} />;
}
