import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToastService } from './services/toast.service';

export type ThemeName = 'signal-grid' | 'mulberry-mint';

const THEME_ATTR = 'data-theme';
const THEME_STORAGE_KEY = 'inzu.theme';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
<router-outlet />

<div class="theme-toggle" aria-label="Changer le thème">
  <button type="button" class="theme-toggle__btn" (click)="cycleTheme()" [attr.title]="tooltip()">
    <span class="theme-toggle__dot" aria-hidden="true"></span>
    <span class="theme-toggle__label">{{ themeLabel() }}</span>
    <span aria-hidden="true">↻</span>
  </button>
</div>

<div class="toast" [class.is-show]="toastState().show">
  <span class="pulse"></span>
  <span>{{ toastState().text }}</span>
</div>
`,
})
export class AppComponent implements OnInit {
  private readonly toastSvc = inject(ToastService);
  readonly toastState = computed(() => this.toastSvc.state());

  readonly theme = signal<ThemeName>('signal-grid');

  readonly themeLabel = computed(() => {
    return this.theme() === 'mulberry-mint' ? 'Mulberry · Mint' : 'Signal · Grid';
  });

  tooltip(): string {
    const next = this.theme() === 'mulberry-mint' ? 'Signal & Grid (bleu fluor)' : 'Mulberry & Mint (luxe)';
    return `Passer au thème ${next}`;
  }

  ngOnInit(): void {
    const saved = this.readThemeFromStorage();
    this.applyTheme(saved);
  }

  cycleTheme(): void {
    const next: ThemeName = this.theme() === 'mulberry-mint' ? 'signal-grid' : 'mulberry-mint';
    this.applyTheme(next);
    this.toastSvc.show(
      next === 'mulberry-mint'
        ? '🎨 Thème Mulberry & Mint activé (luxe prune & menthe)'
        : '🎨 Thème Signal & Grid activé (bleu fluor)'
    );
  }

  private applyTheme(name: ThemeName): void {
    this.theme.set(name);
    const html = document.documentElement;
    if (name === 'mulberry-mint') {
      html.setAttribute(THEME_ATTR, 'mulberry-mint');
    } else {
      html.removeAttribute(THEME_ATTR);
    }
    this.updateMetaThemeColor(name);
    try { localStorage.setItem(THEME_STORAGE_KEY, name); } catch {}
  }

  private readThemeFromStorage(): ThemeName {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null;
      if (saved === 'mulberry-mint' || saved === 'signal-grid') return saved;
    } catch {}
    return 'signal-grid';
  }

  private updateMetaThemeColor(name: ThemeName): void {
    const meta = document.getElementById('themeColorMeta') as HTMLMetaElement | null;
    if (!meta) return;
    meta.setAttribute('content', name === 'mulberry-mint' ? '#3A2036' : '#001619');
  }
}
