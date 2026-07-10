export interface TileData {
  id: string;
  categoryId: string;
  title: string;
  url: string;
  imageUrl: string | null;
  description: string | null;
  accentColor: string | null;
  sortOrder: number;
}

export interface CategoryData {
  id: string;
  name: string;
  sortOrder: number;
  tiles: TileData[];
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}
