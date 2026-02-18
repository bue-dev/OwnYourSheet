import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Entry, CreateEntry, UpdateEntry } from '../models/entry.model';
import { ReorderItem } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class EntryService {
  constructor(private api: ApiService) {}

  getByCategory(categoryId: string): Observable<Entry[]> {
    return this.api.get<Entry[]>('/entries', { categoryId });
  }

  getById(id: string): Observable<Entry> {
    return this.api.get<Entry>(`/entries/${id}`);
  }

  create(dto: CreateEntry): Observable<Entry> {
    return this.api.post<Entry>('/entries', dto);
  }

  update(id: string, dto: UpdateEntry): Observable<Entry> {
    return this.api.put<Entry>(`/entries/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.api.delete(`/entries/${id}`);
  }

  reorder(items: ReorderItem[]): Observable<void> {
    return this.api.put<void>('/entries/reorder', items);
  }
}
