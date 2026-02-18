import { Injectable, signal } from '@angular/core';
import { Entry, EntryVariable } from '../models/entry.model';

@Injectable({ providedIn: 'root' })
export class ClipboardService {
  showToast = signal(false);
  toastMessage = signal('');

  async copyEntry(entry: Entry, variableValues?: Map<string, string>): Promise<void> {
    let content = entry.content;

    // Substitute variables that have values
    if (entry.variables && entry.variables.length > 0) {
      for (const variable of entry.variables) {
        const value = variableValues?.get(variable.name) ?? variable.defaultValue;
        if (value) {
          content = content.replaceAll(`{{${variable.name}}}`, value);
        }
        // If no value and no default, leave {{varName}} as-is
      }
    }

    await navigator.clipboard.writeText(content);
    this.flash('Copied to clipboard!');
  }

  async copyText(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
    this.flash('Copied to clipboard!');
  }

  private flash(message: string): void {
    this.showToast.set(true);
    this.toastMessage.set(message);
    setTimeout(() => this.showToast.set(false), 1800);
  }
}
