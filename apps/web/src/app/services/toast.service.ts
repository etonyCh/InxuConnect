import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastSignal = signal<{ show: boolean; text: string }>({ show: false, text: '' });
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  readonly state = this.toastSignal.asReadonly();

  show(text: string, durationMs: number = 3000): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }
    this.toastSignal.set({ show: true, text });
    this.hideTimer = setTimeout(() => {
      this.hide();
    }, durationMs);
  }

  hide(): void {
    this.toastSignal.set({ show: false, text: '' });
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }
}
