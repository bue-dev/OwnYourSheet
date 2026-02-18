import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Category, CreateCategory, UpdateCategory, ReorderItem } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  constructor(private api: ApiService) {}

  getAll(): Observable<Category[]> {
    return this.api.get<Category[]>('/categories');
  }

  create(dto: CreateCategory): Observable<Category> {
    return this.api.post<Category>('/categories', dto);
  }

  update(id: string, dto: UpdateCategory): Observable<Category> {
    return this.api.put<Category>(`/categories/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.api.delete(`/categories/${id}`);
  }

  reorder(items: ReorderItem[]): Observable<void> {
    return this.api.put<void>('/categories/reorder', items);
  }
}
