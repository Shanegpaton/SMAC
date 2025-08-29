import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface PickPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getPick(id: string) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.isAdmin;

    const pick = await prisma.SMACArticle.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!pick) {
      notFound();
    }

    // If not admin and pick is not published, redirect to home
    if (!isAdmin && !pick.published) {
      redirect('/');
    }

    return pick;
  } catch (error) {
    console.error('Error fetching pick:', error);
    notFound();
  }
}

export default async function PickPage({ params }: PickPageProps) {
  const { id } = await params;
  const pick = await getPick(id);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <article className="bg-white rounded-lg shadow-md overflow-hidden">
        {pick.imageUrl && (
          <div className="relative h-96">
            <Image
              src={pick.imageUrl}
              alt={pick.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4 text-black">{pick.title}</h1>
          
          <div className="flex items-center gap-4 mb-6 text-gray-600">
            <span>By {pick.author.name}</span>
            <span>•</span>
            <span>{new Date(pick.gameDate).toLocaleDateString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-lg font-semibold">{pick.homeTeam}</p>
              <p className="text-sm text-gray-500">Home</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-lg font-semibold">{pick.awayTeam}</p>
              <p className="text-sm text-gray-500">Away</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-black">Our Pick</h2>
            <p className="text-xl font-bold text-blue-600 mb-2">{pick.pick}</p>
            <p className="text-gray-700 whitespace-pre-wrap">{pick.reasoning}</p>
          </div>
        </div>
      </article>
    </div>
  );
} 