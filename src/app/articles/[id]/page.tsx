import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ArticleDetail from "@/components/ArticleDetail";

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

  return <ArticleDetail article={article} />;
} 