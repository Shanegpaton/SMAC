import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export default async function ArticlesPage() {
  const articles = await prisma.sMACArticle.findMany({
    where: {
      published: true,
    },
    include: {
      author: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Articles</h1>
      <div className="grid gap-8">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.id}`}
            className="block group"
          >
            <article className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              {article.imageUrl && (
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-64 object-cover"
                />
              )}
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                  {article.title}
                </h2>
                <div className="flex items-center gap-4 text-gray-500 mb-4">
                  <span>By {article.author.name}</span>
                  <span>•</span>
                  <span>
                    {format(new Date(article.createdAt), 'MMMM d, yyyy')}
                  </span>
                </div>
                <p className="text-gray-600 line-clamp-3">
                  {article.excerpt}
                </p>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
} 