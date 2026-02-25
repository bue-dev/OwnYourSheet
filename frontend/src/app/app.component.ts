import { Component, signal, computed, effect } from '@angular/core';
import { CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { EntryCardComponent } from './components/entry-card/entry-card.component';
import { EntryEditorComponent } from './components/entry-editor/entry-editor.component';
import { ApiService } from './services/api.service';
import { AuthService } from './services/auth.service';
import { CategoryService } from './services/category.service';
import { EntryService } from './services/entry.service';
import { ClipboardService } from './services/clipboard.service';
import { Category } from './models/category.model';
import { Entry, CreateEntry, UpdateEntry } from './models/entry.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SidebarComponent, EntryCardComponent, EntryEditorComponent, CdkDropList, CdkDrag],
  template: `
    <div class="app-layout">
      <app-sidebar
        [categories]="categories()"
        [selectedCategoryId]="selectedCategory()?.id ?? null"
        [isAuthenticated]="authService.isAuthenticated()"
        [userName]="authService.userName()"
        [userEmail]="authService.userEmail()"
        (selectCategory)="onSelectCategory($event)"
        (addCategory)="onAddCategory($event)"
        (updateCategory)="onUpdateCategory($event)"
        (deleteCategory)="onDeleteCategory($event)"
        (exportData)="onExport()"
        (importData)="triggerImport()"
        (reorderCategories)="onReorderCategories($event)"
        (login)="authService.login()"
        (logout)="authService.logout()"
      />

      <main class="main-content">
        <div class="search-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            class="search-input"
            [value]="searchQuery()"
            (input)="searchQuery.set(getValue($event))"
            placeholder="Filter entries..."
          />
          @if (searchQuery()) {
            <button class="btn-icon" (click)="searchQuery.set('')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          }
        </div>

        @if (selectedCategory()) {
          <div class="main-header">
            <div>
              <h1 class="main-title">{{ selectedCategory()!.title }}</h1>
              <span class="entry-count">{{ filteredEntries().length }} of {{ entries().length }} entries</span>
            </div>
            <button class="btn btn-primary" (click)="openEditor(null)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Entry
            </button>
          </div>

          <div class="entries-list" cdkDropList (cdkDropListDropped)="onEntryDrop($event)">
            @for (entry of filteredEntries(); track entry.id) {
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
export class AppComponent {
  categories = signal<Category[]>([]);
  selectedCategory = signal<Category | null>(null);
  entries = signal<Entry[]>([]);

  showEditor = signal(false);
  editingEntry = signal<Entry | null>(null);

  searchQuery = signal('');

  filteredEntries = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const all = this.entries();
    if (!q) return all;
    return all.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.content.toLowerCase().includes(q)
    );
  });

  private importInputEl?: HTMLInputElement;

  constructor(
    public authService: AuthService,
    private api: ApiService,
    private categoryService: CategoryService,
    private entryService: EntryService,
    public clipboard: ClipboardService
  ) {
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.loadCategories();
      } else {
        this.categories.set([]);
        this.selectedCategory.set(null);
        this.entries.set([]);
      }
    });
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
    this.searchQuery.set('');
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

  // === Helpers ===

  getValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  // === Export/Import ===

  onExport(): void {
    this.api.get<object>('/export').subscribe(data => {
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
      this.api.post<void>('/import', data).subscribe(() => {
        this.loadCategories();
        this.selectedCategory.set(null);
        this.entries.set([]);
        alert('Import completed successfully!');
      });
    };
    reader.readAsText(file);
    (event.target as HTMLInputElement).value = '';
  }
}
