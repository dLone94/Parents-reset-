import Link from "next/link";
import "./globals.css";

/**
 * Root not-found for paths outside any locale (the proxy normally redirects
 * these). Intentionally minimal and locale-neutral.
 */
export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center p-6">
        <div className="space-y-3 text-center">
          <p className="font-display text-3xl">Parent Reset</p>
          <Link href="/en" className="underline">
            /en
          </Link>
        </div>
      </body>
    </html>
  );
}
