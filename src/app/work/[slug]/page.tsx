import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { client, urlFor } from "@/lib/sanity";
import { WORK_BY_SLUG_QUERY, type WorkDetail } from "@/lib/queries";

export const revalidate = 60;

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const work = await client.fetch<WorkDetail | null>(WORK_BY_SLUG_QUERY, {
    slug,
  });

  if (!work) notFound();

  const gallery = work.gallery && work.gallery.length > 0
    ? work.gallery
    : [work.coverImage];

  return (
    <main className="mx-auto max-w-4xl px-6 py-16 sm:px-10">
      <Link href="/" className="text-xs text-muted hover:underline">
        ← Back
      </Link>

      <h1 className="mt-6 text-2xl font-semibold text-heading">{work.title}</h1>
      <div className="mt-1 flex gap-3 text-xs text-muted">
        {work.category && <span>{work.category}</span>}
        {work.year && <span>{work.year}</span>}
      </div>
      {work.description && (
        <p className="mt-4 max-w-2xl text-sm text-foreground/80">
          {work.description}
        </p>
      )}

      <div className="mt-10 flex flex-col gap-8">
        {gallery.map((image, i) => (
          <div key={i} className="relative w-full overflow-hidden rounded-lg">
            <Image
              src={urlFor(image).width(2000).quality(95).url()}
              alt={`${work.title} — image ${i + 1}`}
              width={2000}
              height={1333}
              className="h-auto w-full object-cover"
              sizes="(min-width: 1024px) 800px, 100vw"
            />
          </div>
        ))}
      </div>
    </main>
  );
}
