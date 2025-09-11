import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RecentPicks from "@/components/RecentPicks";

export default async function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Google Drive Section */}
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-blue-900">SMAC Resources</h2>
              <p className="text-blue-700 text-sm">Access our shared resources, datasets, and meeting materials</p>
            </div>
            <a 
              href="https://drive.google.com/drive/folders/18dPv4LVnO7PGOygHmTr9BTVU9jMuOuyg"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center sm:whitespace-nowrap sm:w-auto w-full"
            >
              Find the Google Drive here
            </a>
          </div>
        </section>

        <section>
          <h1 className="text-3xl font-bold mb-4 text-black">Recent Articles</h1>
          <RecentPicks />
        </section>
      </div>
    </div>
  );
}
