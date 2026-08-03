import "dotenv/config";
import { db } from "@/lib/db";

async function main () {
  // hapus data existing
  await db.notification.deleteMany();
  await db.follow.deleteMany();
  await db.comment.deleteMany();
  await db.post.deleteMany();
  await db.userPreferences.deleteMany();
  await db.user.deleteMany();

  // buat user baru
  const admin = await db.user.create({
    data: { email: "admin@example.com", name: "Admin", role: "ADMIN" }
  });

  const author1 = await db.user.create({
    data: { email: "author1@example.com", name: "Author 1", role: "AUTHOR" }
  });

  const author2 = await db.user.create({
    data: { email: "author2@example.com", name: "Author 2", role: "AUTHOR" }
  });

  // admin & author2 follow author1
  await db.follow.createMany({
    data: [
      { followerId: admin.id, followingId: author1.id },
      { followerId: author2.id, followingId: author1.id }
    ]
  });

  const categories = ["Technology", "Lifestyle", "Travel", "Food", "Education"];

  // buat 10 post untuk tersebar ke author1 dan author2 menggunakn 3 kategori
  const posts = await Promise.all(
    Array.from({ length: 10 }).map((_, i) =>
      db.post.create({
        data: {
          title: `Post ${i + 1}`,
          slug: `post-${i + 1}`,
          excerpt: `This is the excerpt for post ${i + 1}.`,
          content: `This is the content for post ${i + 1}.`,
          published: true,
          category: categories[i % categories.length],
          authorId: i % 2 === 0 ? author1.id : author2.id
        }
      })
    )
  );

  // menambahkan 20 komentar
  const comments = [admin, author1, author2];
  await db.comment.createMany({
    data: Array.from({ length: 20 }).map((_, i) => ({
      content: `This is comment ${i + 1}.`,
      postId: posts[i % posts.length].id,
      authorId: comments[i % comments.length].id
    }))
  });

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });