export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  viewCount: number;
  createdAt: Date;
  liked: boolean;
  likeCount: number;
}

export type PostPreview = Pick<BlogPost, "id" | "title" | "slug" | "published" | "liked" | "likeCount">

// optional
export type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string }