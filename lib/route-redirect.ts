import { permanentRedirect } from "next/navigation";

export type RouteSearchParams = Record<string, string | string[] | undefined>;

export function redirectTo(pathname: string, searchParams?: RouteSearchParams) {
  const query = new URLSearchParams();

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => query.append(key, entry));
      return;
    }

    if (typeof value === "string") query.set(key, value);
  });

  const suffix = query.toString();
  permanentRedirect(suffix ? `${pathname}?${suffix}` : pathname);
}
