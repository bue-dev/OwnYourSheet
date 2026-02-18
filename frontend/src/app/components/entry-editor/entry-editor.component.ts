import { Component, input, output, signal, effect, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Entry, EntryType, EntryVariable, CreateEntry, UpdateEntry } from '../../models/entry.model';

@Component({
  selector: 'app-entry-editor',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="overlay" (click)="close.emit()">
      <div class="editor" (click)="$event.stopPropagation()">
        <div class="editor-header">
          <h2>{{ entry() ? 'Edit Entry' : 'New Entry' }}</h2>
          <button class="btn-icon" (click)="close.emit()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="editor-body">
          <div class="form-row">
            <div class="form-group" style="flex:2">
              <label>Title</label>
              <input class="input" [(ngModel)]="title" placeholder="Entry title...">
            </div>
            <div class="form-group" style="flex:1">
              <label>Type</label>
              <select class="select" [(ngModel)]="entryType">
                <option [value]="0">Text</option>
                <option [value]="1">Code</option>
                <option [value]="2">Prompt</option>
                <option [value]="3">URL</option>
              </select>
            </div>
            @if (+entryType === 1) {
              <div class="form-group" style="flex:1">
                <label>Language</label>
                <select class="select" [(ngModel)]="language">
                  <option value="">None</option>
                  <option value="csharp">C#</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="sql">SQL</option>
                  <option value="bash">Bash</option>
                  <option value="json">JSON</option>
                  <option value="yaml">YAML</option>
                </select>
              </div>
            }
          </div>

          <div class="form-group">
            <label>Content</label>
            <textarea class="input content-area" [(ngModel)]="content" placeholder="Your snippet, prompt, URL, or text..."></textarea>
          </div>

          <div class="variables-section">
            <div class="variables-header">
              <label>Variables <span class="hint">Use {{'{{name}}'}} in content</span></label>
              <button class="btn btn-ghost" (click)="addVariable()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Variable
              </button>
            </div>
            @for (v of variables; track $index) {
              <div class="variable-row">
                <input class="input" [(ngModel)]="v.name" placeholder="Variable name">
                <input class="input" [(ngModel)]="v.defaultValue" placeholder="Default value">
                <button class="btn-icon" (click)="removeVariable($index)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            }
          </div>
        </div>

        <div class="editor-footer">
          <button class="btn btn-ghost" (click)="close.emit()">Cancel</button>
          <button class="btn btn-primary" (click)="onSave()" [disabled]="!title.trim() || !content.trim()">
            {{ entry() ? 'Save Changes' : 'Create Entry' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      backdrop-filter: blur(4px);
    }

    .editor {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      width: 680px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-lg);
    }

    .editor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 24px;
      border-bottom: 1px solid var(--border);

      h2 { font-size: 16px; font-weight: 700; }
    }

    .editor-body {
      padding: 20px 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: flex;
      gap: 12px;
    }

    .content-area {
      min-height: 180px;
    }

    .variables-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .variables-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .hint {
        font-weight: 400;
        text-transform: none;
        letter-spacing: 0;
        color: var(--text-muted);
        margin-left: 6px;
      }
    }

    .variable-row {
      display: flex;
      gap: 8px;
      align-items: center;

      .input { flex: 1; }
    }

    .editor-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 24px;
      border-top: 1px solid var(--border);
    }
  `]
})
export class EntryEditorComponent implements OnInit {
  categoryId = input.required<string>();
  entry = input<Entry | null>(null);

  save = output<CreateEntry | UpdateEntry>();
  close = output<void>();

  title = '';
  content = '';
  entryType: number = 0;
  language = '';
  variables: EntryVariable[] = [];

  ngOnInit(): void {
    const e = this.entry();
    if (e) {
      this.title = e.title;
      this.content = e.content;
      this.entryType = e.entryType;
      this.language = e.language ?? '';
      this.variables = e.variables.map(v => ({ ...v }));
    }
  }

  addVariable(): void {
    this.variables.push({ name: '', defaultValue: '' });
  }

  removeVariable(index: number): void {
    this.variables.splice(index, 1);
  }

  onSave(): void {
    const validVars = this.variables.filter(v => v.name.trim());

    if (this.entry()) {
      const dto: UpdateEntry = {
        title: this.title.trim(),
        content: this.content,
        entryType: +this.entryType as EntryType,
        language: +this.entryType === 1 ? this.language || null : null,
        variables: validVars,
      };
      this.save.emit(dto);
    } else {
      const dto: CreateEntry = {
        categoryId: this.categoryId(),
        title: this.title.trim(),
        content: this.content,
        entryType: +this.entryType as EntryType,
        language: +this.entryType === 1 ? this.language || null : null,
        variables: validVars,
      };
      this.save.emit(dto);
    }
  }
}
