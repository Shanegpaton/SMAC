import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RecentPicks from "@/components/RecentPicks";

export default async function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <section>
          <h1 className="text-3xl font-bold mb-4">Recent Articles</h1>
          <RecentPicks />
        </section>
      </div>
    </div>
  );
}
