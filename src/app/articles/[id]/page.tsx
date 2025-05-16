import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { notFound } from "next/navigation";

interface ArticlePageProps {
  params: {
    id: string;
  };
}

async function getArticle(id: string) {
  try {
    const article = await prisma.article.findUnique({
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
  const article = await getArticle(params.id);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <article className="prose lg:prose-xl">
        <h1 className="text-4xl font-bold mb-6">{article.title}</h1>
        
        {article.imageUrl && (
          <div className="relative w-full h-96 mb-8">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover rounded-lg"
            />
          </div>
        )}

        <div className="flex items-center gap-4 mb-8 text-gray-600">
          <span>By {article.author.name}</span>
          <span>•</span>
          <span>{new Date(article.createdAt).toLocaleDateString()}</span>
        </div>

        <div className="prose lg:prose-xl">
          {article.content.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </div>
  );
} 