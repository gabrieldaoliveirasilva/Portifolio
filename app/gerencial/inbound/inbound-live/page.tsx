import { redirectTo, type RouteSearchParams } from "@/lib/route-redirect";

export default function GerencialInboundLive({ searchParams }: { searchParams?: RouteSearchParams }) {
  redirectTo("/inbound-live", searchParams);
}
