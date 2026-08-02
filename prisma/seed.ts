import "dotenv/config";
import { db } from "../lib/db";

async function main() {
  console.log("Seeding database...");

  // Hapus data lama (urutan: child dulu, parent belakangan)
  await db.notification.deleteMany();
  await db.follow.deleteMany();
  await db.comment.deleteMany();
  await db.post.deleteMany();
  await db.userPreferences.deleteMany();
  await db.user.deleteMany();

  // Buat users — 1 admin, 2 authors
  const admin = await db.user.create({
    data: { email: "admin@example.com", name: "Admin", role: "ADMIN" },
  });
  const authorOne = await db.user.create({
    data: { email: "author1@example.com", name: "Author One", role: "AUTHOR" },
  });
  const authorTwo = await db.user.create({
    data: { email: "author2@example.com", name: "Author Two", role: "AUTHOR" },
  });
  const authors = [authorOne, authorTwo];

  // admin & authorTwo follow authorOne — dipakai buat demo transaction notifikasi
  await db.follow.createMany({
    data: [
      { followerId: admin.id, followingId: authorOne.id },
      { followerId: authorTwo.id, followingId: authorOne.id },
    ],
  });

  const categories = ["Tutorial", "Tips & Trick", "Berita"];

  // Buat 10 posts, tersebar ke 2 authors & 3 category
  const posts = await Promise.all(
    Array.from({ length: 10 }).map((_, i) =>
      db.post.create({
        data: {
          title: `Artikel ke-${i + 1}`,
          slug: `artikel-ke-${i + 1}`,
          excerpt: `Ringkasan singkat artikel ke-${i + 1}`,
          content: `Konten lengkap artikel ke-${i + 1}...`,
          category: categories[i % categories.length],
          published: true,
          authorId: authors[i % authors.length].id,
        },
      })
    )
  );

  // 20 comments tersebar ke posts, dari ketiga user
  const commenters = [admin, authorOne, authorTwo];
  await db.comment.createMany({
    data: Array.from({ length: 20 }).map((_, i) => ({
      content: `Komentar ke-${i + 1}`,
      postId: posts[i % posts.length].id,
      authorId: commenters[i % commenters.length].id,
    })),
  });

  console.log("Seeding complete!");
  console.log(`  users: 3, posts: ${posts.length}, comments: 20, follows: 2`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
