import { notFound } from "next/navigation";
import { getGerotPage } from "@/components/gerot-navigation";
import { redirectTo, type RouteSearchParams } from "@/lib/route-redirect";

export default function GerotKpiPage({
  params,
  searchParams
}: {
  params: { group: string; slug: string };
  searchParams?: RouteSearchParams;
}) {
  const page = getGerotPage(params.group, params.slug);
  if (!page) notFound();

  redirectTo(`/gerot-${page.item.slug}`, searchParams);
}
