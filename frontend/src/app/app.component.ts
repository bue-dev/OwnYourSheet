import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { EntryCardComponent } from './components/entry-card/entry-card.component';
import { EntryEditorComponent } from './components/entry-editor/entry-editor.component';
import { CategoryService } from './services/category.service';
import { EntryService } from './services/entry.service';
import { ClipboardService } from './services/clipboard.service';
import { SearchService, SearchResult } from './services/search.service';
import { Category } from './models/category.model';
import { Entry, CreateEntry, UpdateEntry, EntryType } from './models/entry.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, SidebarComponent, EntryCardComponent, EntryEditorComponent, CdkDropList, CdkDrag],
  template: `
    <div class="app-layout">
      <app-sidebar
        [categories]="categories()"
        [selectedCategoryId]="selectedCategory()?.id ?? null"
        (selectCategory)="onSelectCategory($event)"
        (addCategory)="onAddCategory($event)"
        (updateCategory)="onUpdateCategory($event)"
        (deleteCategory)="onDeleteCategory($event)"
        (exportData)="onExport()"
        (importData)="triggerImport()"
        (reorderCategories)="onReorderCategories($event)"
      />

      <main class="main-content">
        <div class="search-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            class="search-input"
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
            placeholder="Search all entries..."
          />
          @if (searchQuery) {
            <button class="btn-icon" (click)="clearSearch()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          }
        </div>

        @if (isSearching()) {
          <div class="main-header">
            <div>
              <h1 class="main-title">Search Results</h1>
              <span class="entry-count">{{ searchResults().length }} found</span>
            </div>
          </div>
          <div class="entries-list">
            @for (result of searchResults(); track result.id) {
              <div class="search-result-card" (click)="goToResult(result)">
                <div class="search-result-header">
                  <span class="entry-type-badge" [attr.data-type]="result.entryType">
                    {{ getTypeLabel(result.entryType) }}
                  </span>
                  <span class="search-result-title">{{ result.title }}</span>
                  <span class="search-result-category">{{ result.categoryTitle }}</span>
                  <button class="btn-copy" (click)="copyResult(result, $event)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Copy
                  </button>
                </div>
                <pre class="search-result-preview">{{ result.content }}</pre>
              </div>
            } @empty {
              <div class="empty-main">
                <p>No entries match your search.</p>
              </div>
            }
          </div>
        } @else if (selectedCategory()) {
          <div class="main-header">
            <div>
              <h1 class="main-title">{{ selectedCategory()!.title }}</h1>
              <span class="entry-count">{{ entries().length }} entries</span>
            </div>
            <button class="btn btn-primary" (click)="openEditor(null)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Entry
            </button>
          </div>

          <div class="entries-list" cdkDropList (cdkDropListDropped)="onEntryDrop($event)">
            @for (entry of entries(); track entry.id) {
              <div cdkDrag>
                <app-entry-card
                  [entry]="entry"
                  (edit)="openEditor($event)"
                  (remove)="onDeleteEntry($event)"
                />
              </div>
            } @empty {
              <div class="empty-main">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <p>No entries yet</p>
                <button class="btn btn-primary" (click)="openEditor(null)">Create your first entry</button>
              </div>
            }
          </div>
        } @else {
          <div class="empty-main welcome">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <h2>Welcome to OwnYourSheet</h2>
            <p>Create a category to get started, or select one from the sidebar.</p>
          </div>
        }
      </main>
    </div>

    @if (showEditor()) {
      <app-entry-editor
        [categoryId]="selectedCategory()!.id"
        [entry]="editingEntry()"
        (save)="onSaveEntry($event)"
        (close)="closeEditor()"
      />
    }

    @if (clipboard.showToast()) {
      <div class="toast">{{ clipboard.toastMessage() }}</div>
    }

    <input
      type="file"
      accept=".json"
      style="display:none"
      #importInput
      (change)="onImportFile($event)"
    />
  `,
  styles: [`
    .app-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px 32px;
      display: flex;
      flex-direction: column;
    }

    .search-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      margin-bottom: 20px;
      flex-shrink: 0;
      color: var(--text-muted);
      transition: border-color 0.15s ease;

      &:focus-within {
        border-color: var(--accent);
        color: var(--text-secondary);
      }
    }

    .search-input {
      flex: 1;
      background: none;
      border: none;
      color: var(--text-primary);
      font-family: var(--font-body);
      font-size: 14px;
      outline: none;
      &::placeholder { color: var(--text-muted); }
    }

    .search-result-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 14px 16px;
      cursor: pointer;
      transition: all 0.12s ease;

      &:hover {
        border-color: var(--border-hover);
        box-shadow: var(--shadow-sm);
        .btn-copy { opacity: 1; }
      }
    }

    .search-result-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .search-result-title {
      font-weight: 600;
      font-size: 14px;
      flex: 1;
    }

    .search-result-category {
      font-size: 11px;
      color: var(--text-muted);
      background: var(--bg-tertiary);
      padding: 2px 8px;
      border-radius: 8px;
    }

    .search-result-preview {
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--text-secondary);
      background: var(--bg-input);
      border-radius: var(--radius-sm);
      padding: 10px;
      max-height: 80px;
      overflow: hidden;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .btn-copy {
      opacity: 0;
      transition: opacity 0.12s ease;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border: none;
      border-radius: var(--radius-sm);
      background: var(--accent);
      color: white;
      font-family: var(--font-body);
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      &:hover { background: var(--accent-hover); }
    }

    .entry-type-badge {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 3px 8px;
      border-radius: 4px;
      flex-shrink: 0;
      &[data-type="0"] { background: var(--accent-subtle); color: var(--accent); }
      &[data-type="1"] { background: var(--success-subtle); color: var(--success); }
      &[data-type="2"] { background: rgba(255, 192, 72, 0.12); color: var(--warning); }
      &[data-type="3"] { background: rgba(116, 185, 255, 0.12); color: #74b9ff; }
    }

    .main-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      flex-shrink: 0;
    }

    .main-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .entry-count {
      font-size: 13px;
      color: var(--text-muted);
    }

    .entries-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .empty-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: var(--text-muted);
      text-align: center;

      p { font-size: 14px; }

      &.welcome {
        h2 {
          font-size: 20px;
          color: var(--text-primary);
          margin-top: 8px;
        }
      }
    }
  `]
})
export class AppComponent implements OnInit {
  categories = signal<Category[]>([]);
  selectedCategory = signal<Category | null>(null);
  entries = signal<Entry[]>([]);

  showEditor = signal(false);
  editingEntry = signal<Entry | null>(null);

  searchQuery = '';
  searchResults = signal<SearchResult[]>([]);
  isSearching = signal(false);
  private searchTimeout: any;

  private importInputEl?: HTMLInputElement;

  constructor(
    private categoryService: CategoryService,
    private entryService: EntryService,
    public clipboard: ClipboardService,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  // === Categories ===

  loadCategories(): void {
    this.categoryService.getAll().subscribe(cats => {
      this.categories.set(cats);
      // Reselect if current still exists
      const sel = this.selectedCategory();
      if (sel) {
        const updated = cats.find(c => c.id === sel.id);
        if (updated) this.selectedCategory.set(updated);
        else {
          this.selectedCategory.set(null);
          this.entries.set([]);
        }
      }
    });
  }

  onSelectCategory(cat: Category): void {
    this.selectedCategory.set(cat);
    this.loadEntries(cat.id);
  }

  onAddCategory(title: string): void {
    this.categoryService.create({ title }).subscribe(cat => {
      this.loadCategories();
      this.onSelectCategory(cat);
    });
  }

  onUpdateCategory(event: { id: string; title: string }): void {
    this.categoryService.update(event.id, { title: event.title }).subscribe(() => {
      this.loadCategories();
    });
  }

  onDeleteCategory(cat: Category): void {
    if (!confirm(`Delete category "${cat.title}" and all its entries?`)) return;
    this.categoryService.delete(cat.id).subscribe(() => {
      if (this.selectedCategory()?.id === cat.id) {
        this.selectedCategory.set(null);
        this.entries.set([]);
      }
      this.loadCategories();
    });
  }

  onReorderCategories(categories: Category[]): void {
    this.categories.set(categories);
    const reorderItems = categories.map((c, i) => ({ id: c.id, sortOrder: i }));
    this.categoryService.reorder(reorderItems).subscribe();
  }

  // === Entries ===

  loadEntries(categoryId: string): void {
    this.entryService.getByCategory(categoryId).subscribe(entries => {
      this.entries.set(entries);
    });
  }

  openEditor(entry: Entry | null): void {
    this.editingEntry.set(entry);
    this.showEditor.set(true);
  }

  closeEditor(): void {
    this.showEditor.set(false);
    this.editingEntry.set(null);
  }

  onSaveEntry(dto: CreateEntry | UpdateEntry): void {
    const editing = this.editingEntry();
    if (editing) {
      this.entryService.update(editing.id, dto as UpdateEntry).subscribe(() => {
        this.closeEditor();
        this.loadEntries(this.selectedCategory()!.id);
        this.loadCategories();
      });
    } else {
      this.entryService.create(dto as CreateEntry).subscribe(() => {
        this.closeEditor();
        this.loadEntries(this.selectedCategory()!.id);
        this.loadCategories();
      });
    }
  }

  onDeleteEntry(entry: Entry): void {
    if (!confirm(`Delete "${entry.title}"?`)) return;
    this.entryService.delete(entry.id).subscribe(() => {
      this.loadEntries(this.selectedCategory()!.id);
      this.loadCategories();
    });
  }

  onEntryDrop(event: CdkDragDrop<Entry[]>): void {
    const items = [...this.entries()];
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    this.entries.set(items);
    const reorderItems = items.map((e, i) => ({ id: e.id, sortOrder: i }));
    this.entryService.reorder(reorderItems).subscribe();
  }

  // === Search ===

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    if (!this.searchQuery || this.searchQuery.length < 2) {
      this.isSearching.set(false);
      this.searchResults.set([]);
      return;
    }
    this.searchTimeout = setTimeout(() => {
      this.isSearching.set(true);
      this.searchService.search(this.searchQuery).subscribe(results => {
        this.searchResults.set(results);
      });
    }, 250);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.isSearching.set(false);
    this.searchResults.set([]);
  }

  goToResult(result: SearchResult): void {
    this.clearSearch();
    const cat = this.categories().find(c => c.id === result.categoryId);
    if (cat) {
      this.onSelectCategory(cat);
    }
  }

  copyResult(result: SearchResult, event: Event): void {
    event.stopPropagation();
    this.clipboard.copyText(result.content);
  }

  getTypeLabel(type: number): string {
    const labels: Record<number, string> = { 0: 'Text', 1: 'Code', 2: 'Prompt', 3: 'URL' };
    return labels[type] ?? 'Text';
  }

  // === Export/Import ===

  onExport(): void {
    const url = '/api/export';
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `ownyoursheet-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
  }

  triggerImport(): void {
    if (!this.importInputEl) {
      this.importInputEl = document.querySelector('input[type="file"]') as HTMLInputElement;
    }
    this.importInputEl?.click();
  }

  onImportFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const data = JSON.parse(reader.result as string);
      fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(() => {
        this.loadCategories();
        this.selectedCategory.set(null);
        this.entries.set([]);
        this.clipboard.copyText('').then(); // just to reuse flash
        alert('Import completed successfully!');
      });
    };
    reader.readAsText(file);
    // Reset input
    (event.target as HTMLInputElement).value = '';
  }
}
