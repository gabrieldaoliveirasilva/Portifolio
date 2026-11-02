import { notFound } from "next/navigation";
import GerotPlaceholder from "@/components/gerot-placeholder";
import {
  flattenGerotItems,
  gerotNavigation,
  getGerotPageByPath,
  gerotPath
} from "@/components/gerot-navigation";

export function generateStaticParams() {
  return gerotNavigation.flatMap((group) =>
    flattenGerotItems(group.items)
      .filter((item) => !item.hasData)
      .map((item) => ({ slug: gerotPath(item.slug).slice(1) }))
  );
}

export default function GerotDirectPage({ params }: { params: { slug: string } }) {
  const page = getGerotPageByPath(`/${params.slug}`);
  if (!page) notFound();
  if (page.item.hasData) notFound();

  return <GerotPlaceholder title={page.item.label} section={page.group.label} />;
}
