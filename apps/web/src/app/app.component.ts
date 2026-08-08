import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
<router-outlet />
<div class="toast" [class.is-show]="toastState().show">
  <span class="pulse"></span>
  <span>{{ toastState().text }}</span>
</div>
`,
})
export class AppComponent {
  private readonly toastSvc = inject(ToastService);
  readonly toastState = computed(() => this.toastSvc.state());
}
