import { Component, input, output, signal, computed, AfterViewInit, OnChanges, ElementRef, ViewChild } from '@angular/core';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { Entry, EntryType, EntryVariable } from '../../models/entry.model';
import { ClipboardService } from '../../services/clipboard.service';

declare const Prism: any;

@Component({
  selector: 'app-entry-card',
  standalone: true,
  imports: [FormsModule, CdkDragHandle],
  template: `
    <div class="card" [class.expanded]="isExpanded()">
      <div class="card-header" (click)="toggleExpand()">
        <div class="card-header-left">
          <span class="drag-handle" cdkDragHandle (click)="$event.stopPropagation()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/>
              <circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/>
              <circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>
            </svg>
          </span>
          <span class="entry-type-badge" [attr.data-type]="entry().entryType">
            {{ getTypeLabel(entry().entryType) }}
          </span>
          <h3 class="card-title">{{ entry().title }}</h3>
        </div>
        <div class="card-header-right">
          <button class="btn-copy" (click)="onCopy($event)" title="Copy to clipboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copy
          </button>
          <button class="btn-icon" (click)="onEdit($event)" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn-icon" (click)="onDelete($event)" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="card-content">
        @if (entry().entryType === 1 && entry().language) {
          <pre class="content-preview code"><code #codeBlock [class]="'language-' + getPrismLanguage(entry().language)" [innerHTML]="highlightedContent()"></code></pre>
        } @else {
          <pre class="content-preview" [class.code]="entry().entryType === 1">{{ entry().content }}</pre>
        }
      </div>

      @if (entry().variables.length > 0) {
        <div class="card-variables">
          <div class="variables-label">Variables</div>
          <div class="variables-grid">
            @for (v of entry().variables; track v.name) {
              <div class="variable-field">
                <label class="variable-name">{{ '{{' + v.name + '}}' }}</label>
                <input
                  class="input variable-input"
                  [value]="getVariableValue(v)"
                  (input)="setVariableValue(v.name, $event)"
                  [placeholder]="v.defaultValue || 'Enter value...'"
                  (click)="$event.stopPropagation()"
                />
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      transition: all 0.15s ease;
      overflow: hidden;

      &:hover {
        border-color: var(--border-hover);
        box-shadow: var(--shadow-sm);
        .card-header-right { opacity: 1; }
      }
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      cursor: pointer;
      gap: 12px;
    }

    .card-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      flex: 1;
    }

    .drag-handle {
      display: flex;
      align-items: center;
      cursor: grab;
      color: var(--text-muted);
      padding: 2px;
      border-radius: 3px;
      transition: all 0.12s ease;
      &:hover { color: var(--text-secondary); background: var(--bg-tertiary); }
      &:active { cursor: grabbing; }
    }

    .card-header-right {
      display: flex;
      align-items: center;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.12s ease;
      flex-shrink: 0;
    }

    .card:hover .card-header-right { opacity: 1; }

    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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

    .btn-copy {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      border: none;
      border-radius: var(--radius-sm);
      background: var(--accent);
      color: white;
      font-family: var(--font-body);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.12s ease;
      &:hover { background: var(--accent-hover); transform: scale(1.03); }
      &:active { transform: scale(0.97); }
    }

    .card-content {
      padding: 0 16px 12px;
    }

    .content-preview {
      font-family: var(--font-mono);
      font-size: 12px;
      line-height: 1.6;
      color: var(--text-secondary);
      background: var(--bg-input);
      border-radius: var(--radius-sm);
      padding: 12px;
      max-height: 200px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-word;

      &.code {
        color: var(--success);
      }
    }

    .card-variables {
      border-top: 1px solid var(--border);
      padding: 12px 16px;
    }

    .variables-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .variables-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .variable-field {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .variable-name {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--warning);
      white-space: nowrap;
    }

    .variable-input {
      padding: 4px 8px;
      font-size: 12px;
      width: 160px;
    }
  `]
})
export class EntryCardComponent {
  entry = input.required<Entry>();

  edit = output<Entry>();
  remove = output<Entry>();

  isExpanded = signal(true);
  variableValues = signal<Map<string, string>>(new Map());

  highlightedContent = computed(() => {
    const e = this.entry();
    if (e.entryType === 1 && e.language && typeof Prism !== 'undefined') {
      const lang = this.getPrismLanguage(e.language);
      const grammar = Prism.languages[lang];
      if (grammar) {
        return Prism.highlight(e.content, grammar, lang);
      }
    }
    return this.escapeHtml(e.content);
  });

  constructor(private clipboard: ClipboardService) {}

  getPrismLanguage(language: string | null): string {
    const map: Record<string, string> = {
      'csharp': 'csharp',
      'python': 'python',
      'javascript': 'javascript',
      'typescript': 'typescript',
      'html': 'html',
      'css': 'css',
      'sql': 'sql',
      'bash': 'bash',
      'json': 'json',
      'yaml': 'yaml',
    };
    return map[language ?? ''] ?? 'plaintext';
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  getTypeLabel(type: EntryType): string {
    const labels: Record<number, string> = {
      [EntryType.Text]: 'Text',
      [EntryType.Code]: 'Code',
      [EntryType.Prompt]: 'Prompt',
      [EntryType.Url]: 'URL',
    };
    return labels[type] ?? 'Text';
  }

  toggleExpand(): void {
    this.isExpanded.update(v => !v);
  }

  getVariableValue(v: EntryVariable): string {
    return this.variableValues().get(v.name) ?? v.defaultValue;
  }

  setVariableValue(name: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.variableValues.update(map => {
      const newMap = new Map(map);
      newMap.set(name, value);
      return newMap;
    });
  }

  onCopy(event: Event): void {
    event.stopPropagation();
    this.clipboard.copyEntry(this.entry(), this.variableValues());
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit(this.entry());
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.remove.emit(this.entry());
  }
}
