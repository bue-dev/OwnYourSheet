import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [FormsModule, CdkDropList, CdkDrag],
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <span>OwnYourSheet</span>
        </div>
      </div>

      <div class="sidebar-content">
        <div class="section-label">
          <span>Categories</span>
          <button class="btn-icon" (click)="startAddCategory()" title="Add category">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        @if (isAddingCategory()) {
          <div class="category-add">
            <input
              class="input"
              [(ngModel)]="newCategoryTitle"
              placeholder="Category name..."
              (keydown.enter)="confirmAddCategory()"
              (keydown.escape)="cancelAddCategory()"
              #addInput
            />
            <div class="category-add-actions">
              <button class="btn btn-primary" (click)="confirmAddCategory()">Add</button>
              <button class="btn btn-ghost" (click)="cancelAddCategory()">Cancel</button>
            </div>
          </div>
        }

        <div class="category-list" cdkDropList (cdkDropListDropped)="onCategoryDrop($event)">
          @for (cat of categories(); track cat.id) {
            <div
              class="category-item"
              cdkDrag
              [class.active]="selectedCategoryId() === cat.id"
              (click)="selectCategory.emit(cat)"
            >
              @if (editingCategoryId() === cat.id) {
                <input
                  class="input category-edit-input"
                  [(ngModel)]="editCategoryTitle"
                  (keydown.enter)="confirmEditCategory(cat)"
                  (keydown.escape)="cancelEditCategory()"
                  (click)="$event.stopPropagation()"
                  #editInput
                />
              } @else {
                <div class="category-info">
                  <span class="category-title">{{ cat.title }}</span>
                  <span class="category-count">{{ cat.entryCount }}</span>
                </div>
                <div class="category-actions" (click)="$event.stopPropagation()">
                  <button class="btn-icon" (click)="startEditCategory(cat)" title="Rename">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button class="btn-icon" (click)="deleteCategory.emit(cat)" title="Delete">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              }
            </div>
          } @empty {
            <div class="empty-state">
              <p>No categories yet</p>
            </div>
          }
        </div>
      </div>

      <div class="sidebar-footer">
        <button class="btn btn-ghost sidebar-footer-btn" (click)="exportData.emit()" title="Export data">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export
        </button>
        <button class="btn btn-ghost sidebar-footer-btn" (click)="importData.emit()" title="Import data">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Import
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      height: 100vh;
      background: var(--bg-secondary);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    .sidebar-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--text-primary);
      font-weight: 700;
      font-size: 15px;
      svg { color: var(--accent); }
    }

    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      padding: 12px 0;
    }

    .section-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 20px 8px;
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    .category-add {
      padding: 0 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .category-add-actions {
      display: flex;
      gap: 4px;
    }

    .category-list {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .category-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 20px;
      cursor: pointer;
      transition: all 0.12s ease;

      &:hover {
        background: var(--bg-tertiary);
        .category-actions { opacity: 1; }
      }

      &.active {
        background: var(--accent-subtle);
        .category-title { color: var(--accent); font-weight: 600; }
        .category-count { background: var(--accent); color: white; }
      }
    }

    .category-info {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 0;
    }

    .category-title {
      color: var(--text-primary);
      font-size: 13px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .category-count {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      background: var(--bg-tertiary);
      padding: 1px 7px;
      border-radius: 10px;
      flex-shrink: 0;
    }

    .category-actions {
      display: flex;
      gap: 2px;
      opacity: 0;
      transition: opacity 0.12s ease;
    }

    .category-edit-input {
      padding: 4px 8px;
      font-size: 13px;
    }

    .empty-state {
      padding: 20px;
      text-align: center;
      color: var(--text-muted);
      font-size: 13px;
    }

    .sidebar-footer {
      border-top: 1px solid var(--border);
      padding: 10px 12px;
      display: flex;
      gap: 4px;
    }

    .sidebar-footer-btn {
      flex: 1;
      font-size: 12px;
      padding: 7px 8px;
      justify-content: center;
    }
  `]
})
export class SidebarComponent {
  categories = input.required<Category[]>();
  selectedCategoryId = input<string | null>(null);

  selectCategory = output<Category>();
  addCategory = output<string>();
  updateCategory = output<{ id: string; title: string }>();
  deleteCategory = output<Category>();
  exportData = output<void>();
  importData = output<void>();
  reorderCategories = output<Category[]>();

  isAddingCategory = signal(false);
  newCategoryTitle = '';

  editingCategoryId = signal<string | null>(null);
  editCategoryTitle = '';

  startAddCategory(): void {
    this.isAddingCategory.set(true);
    this.newCategoryTitle = '';
  }

  confirmAddCategory(): void {
    const title = this.newCategoryTitle.trim();
    if (title) {
      this.addCategory.emit(title);
      this.isAddingCategory.set(false);
      this.newCategoryTitle = '';
    }
  }

  cancelAddCategory(): void {
    this.isAddingCategory.set(false);
    this.newCategoryTitle = '';
  }

  startEditCategory(cat: Category): void {
    this.editingCategoryId.set(cat.id);
    this.editCategoryTitle = cat.title;
  }

  confirmEditCategory(cat: Category): void {
    const title = this.editCategoryTitle.trim();
    if (title && title !== cat.title) {
      this.updateCategory.emit({ id: cat.id, title });
    }
    this.cancelEditCategory();
  }

  cancelEditCategory(): void {
    this.editingCategoryId.set(null);
    this.editCategoryTitle = '';
  }

  onCategoryDrop(event: CdkDragDrop<Category[]>): void {
    const items = [...this.categories()];
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    this.reorderCategories.emit(items);
  }
}
