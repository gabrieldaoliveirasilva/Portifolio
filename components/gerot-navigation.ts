// AI maintenance map: source of truth for GEROT groups, labels and canonical slugs.
// Implemented pages live in app/(gerot)/gerot-<slug>; other slugs use the placeholder.
export type GerotNavItem = {
  label: string;
  slug: string;
  hasData?: boolean;
  children?: GerotNavItem[];
};

export type GerotNavGroup = {
  label: string;
  slug: string;
  icon: string;
  items: GerotNavItem[];
};

export const gerotNavigation: GerotNavGroup[] = [
  {
    label: "Cost",
    slug: "cost",
    icon: "$",
    items: [
      { label: "CPT on Time", slug: "cpt-on-time", hasData: true },
      { label: "Conversão de Sacas", slug: "conversao-de-sacas", hasData: true },
      { label: "SPR", slug: "spr", hasData: true },
      { label: "Produção de Saca", slug: "producao-de-saca", hasData: true },
      { label: "% Absenteeism", slug: "absenteeism", hasData: true }
    ]
  },
  {
    label: "Quality & HSE",
    slug: "quality-hse",
    icon: "Q",
    items: [
      { label: "FIFO Broken", slug: "fifo-broken", hasData: true },
      { label: "% Mis-routing", slug: "mis-routing", hasData: true },
      { label: "% Mis-scanning (SoC>LMH)", slug: "mis-scanning-soc-lmh", hasData: true }
    ]
  },
  {
    label: "Speed",
    slug: "speed",
    icon: "S",
    items: [
      {
        label: "LEFTOVER",
        slug: "leftover",
        children: [
          { label: "D0", slug: "leftover-d0", hasData: true },
          { label: "Histórico", slug: "leftover-historico", hasData: true }
        ]
      },
      { label: "Average Waiting Time - LH (FMH + Intersoc) [h]", slug: "average-waiting-time-lh", hasData: true },
      { label: "Lead Time - Received to Packed (by received date)", slug: "lead-time-received-to-packed", hasData: true },
      { label: "Lead Time - Received to Handover - Inter-SoC", slug: "lead-time-received-to-handover", hasData: true },
      { label: "Packed on time", slug: "packed-on-time", hasData: true },
      { label: "% Backlog Inbounded (>= 24h)", slug: "backlog-inbounded", hasData: true }
    ]
  }
];

export function flattenGerotItems(items: GerotNavItem[]): GerotNavItem[] {
  return items.flatMap((item) => item.children?.length ? flattenGerotItems(item.children) : [item]);
}

export function getGerotPage(groupSlug: string, itemSlug: string) {
  const group = gerotNavigation.find((entry) => entry.slug === groupSlug);
  const item = group ? flattenGerotItems(group.items).find((entry) => entry.slug === itemSlug) : undefined;
  return group && item ? { group, item } : null;
}

export function gerotPath(itemSlug: string) {
  return `/gerot-${itemSlug}`;
}

export function getGerotPageByPath(pathname: string) {
  const prefix = "/gerot-";
  if (!pathname.startsWith(prefix)) return null;

  const itemSlug = pathname.slice(prefix.length).replace(/^\/+|\/+$/g, "");
  if (!itemSlug) return null;

  for (const group of gerotNavigation) {
    const item = flattenGerotItems(group.items).find((entry) => entry.slug === itemSlug);
    if (item) return { group, item };
  }

  return null;
}
