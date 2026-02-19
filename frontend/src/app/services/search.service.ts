import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from './api.service';

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  entryType: number;
  language: string | null;
  categoryId: string;
  categoryTitle: string;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  constructor(private api: ApiService) {}

  search(query: string): Observable<SearchResult[]> {
    if (!query || query.length < 2) return of([]);
    return this.api.get<SearchResult[]>('/search', { q: query });
  }
}
