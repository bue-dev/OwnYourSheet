export enum EntryType {
  Text = 0,
  Code = 1,
  Prompt = 2,
  Url = 3
}

export interface EntryVariable {
  name: string;
  defaultValue: string;
}

export interface Entry {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  entryType: EntryType;
  language: string | null;
  variables: EntryVariable[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntry {
  categoryId: string;
  title: string;
  content: string;
  entryType: EntryType;
  language?: string | null;
  variables?: EntryVariable[];
}

export interface UpdateEntry {
  title?: string;
  content?: string;
  entryType?: EntryType;
  language?: string | null;
  variables?: EntryVariable[];
}
