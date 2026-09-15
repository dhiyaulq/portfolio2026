import { client } from "@/lib/sanity";
import { ALL_WORK_QUERY, type WorkListItem } from "@/lib/queries";
import Sidebar from "@/components/Sidebar";
import ShowcaseGL from "@/components/ShowcaseGL";

export const revalidate = 60; // re-fetch from Sanity at most once a minute

export default async function HomePage() {
  const works = await client.fetch<WorkListItem[]>(ALL_WORK_QUERY);

  return (
    <main className="flex min-h-screen w-full flex-col lg:flex-row lg:pl-[457px]">
      <Sidebar />
      <ShowcaseGL works={works} />
    </main>
  );
}
