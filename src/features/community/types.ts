import type { CommunityCategory } from "./schema";

export interface CommunityPost {
  id: string;
  authorId: string;
  displayName: string;
  category: CommunityCategory;
  locale: string;
  title: string;
  body: string;
  createdAt: string;
  commentCount: number;
  supportCount: number;
  /** Whether the current viewer has supported this post. */
  supported: boolean;
}

export interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  displayName: string;
  body: string;
  createdAt: string;
}
