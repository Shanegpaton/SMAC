import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { notFound } from "next/navigation";

interface ArticlePageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getArticle(id: string) {
  try {
    const article = await prisma.sMACArticle.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!article) {
      notFound();
    }

    return article;
  } catch (error) {
    console.error('Error fetching article:', error);
    notFound();
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const article = await getArticle(id);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <article className="bg-white rounded-lg shadow-md overflow-hidden">
        {article.imageUrl && (
          <div className="relative h-96">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
          
          <div className="flex items-center gap-4 mb-6 text-gray-600">
            <span>By {article.author.name}</span>
            <span>•</span>
            <span>{new Date(article.gameDate).toLocaleDateString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-lg font-semibold">{article.homeTeam}</p>
              <p className="text-sm text-gray-500">Home</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-lg font-semibold">{article.awayTeam}</p>
              <p className="text-sm text-gray-500">Away</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Our Pick</h2>
            <p className="text-xl font-bold text-blue-600 mb-2">{article.pick}</p>
            <p className="text-gray-700 whitespace-pre-wrap">{article.reasoning}</p>
          </div>
        </div>
      </article>
    </div>
  );
} 