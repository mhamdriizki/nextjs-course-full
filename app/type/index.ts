export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  viewCount: number;
  createdAt: Date;
}

export type PostPreview = Pick<BlogPost, "id" | "title" | "slug" | "published">

// optional
export type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string }