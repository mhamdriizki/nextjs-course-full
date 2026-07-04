export default function BlogPage() {
  const posts = [
    {
      id: 1,
      title: "My First Blog Post",
      content: "This is the content of my first blog post.",
    },
    {
      id: 2,
      title: "Another Blog Post",
      content: "This is the content of another blog post.",
    }
  ]
  
  return (
    <div>
      <h2>My Blog</h2>
        {/* isinya adalah semua post yang ada di blog */}
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}