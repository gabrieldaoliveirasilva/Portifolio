import { redirectTo, type RouteSearchParams } from "@/lib/route-redirect";

export default function GerencialLiveProdHc({ searchParams }: { searchParams?: RouteSearchParams }) {
  redirectTo("/live-prod-hc", searchParams);
}
