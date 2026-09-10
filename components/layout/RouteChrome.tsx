"use client";

import { usePathname } from "next/navigation";

/**
 * Hides marketing chrome on routes that own their full viewport — the auth
 * split screen and the dashboard shell. Keeping the check here lets Footer
 * stay a server component, since its markup is passed in as children.
 */
export function HideOnRoutes({
  prefixes,
  children,
}: {
  prefixes: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (prefixes.some((prefix) => pathname?.startsWith(prefix))) return null;
  return <>{children}</>;
}
