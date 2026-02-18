export interface Category {
  id: string;
  title: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  entryCount: number;
}

export interface CreateCategory {
  title: string;
}

export interface UpdateCategory {
  title: string;
}

export interface ReorderItem {
  id: string;
  sortOrder: number;
}
