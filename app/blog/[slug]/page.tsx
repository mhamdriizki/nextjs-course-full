const POSTS = [
  {
    slug: 'first-post',
    title: 'First Post',
    content: 'Ini adalah post pertama'
  },
  {
    slug: 'second-post',
    title: 'Second Post',
    content: 'Ini adalah post kedua'
  },
  {
    slug: 'third-post',
    title: 'Third Post',
    content: 'Ini adalah post ketiga'
  }
]

export default async function BlogPostPage({ 
  params 
}: { 
  params: { slug: string } }) {
    const {slug} = await params;
    const post = POSTS.find((p) => p.slug === slug);

    if (!post) {
      return <div>Post not found</div>
    }

    return (
      <article style={{ padding: '2rem' }}>
        <h2>{post.title}</h2>
        <p>{post.content}</p>
        <p>URL Saat ini adalah <strong>{slug}</strong></p>
      </article>
    )
}