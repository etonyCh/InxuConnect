import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ikigega-impact-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ikigega-card glass-card">
      <div class="ikigega-header">
        <div class="ikigega-title">
          <i class="fa-solid fa-hand-holding-heart"></i>
          <span>Ikigega Inzu - Tontine & Impact Solidaire Burundi</span>
        </div>
        <span class="pool-total">4 250 000 FBU récoltés</span>
      </div>

      <p class="ikigega-subtitle">
        Grâce aux micro-contributions de 1 000 FBU sur vos séjours, nous améliorons la vie des collines du Burundi.
      </p>

      <div class="projects-row">
        <div class="project-pill" *ngFor="let p of projects">
          <i [class]="p.icon"></i>
          <div class="project-info">
            <strong>{{ p.count }} {{ p.title }}</strong>
            <span>{{ p.location }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ikigega-card {
      background: linear-gradient(135deg, #10B981 0%, #047857 100%);
      color: #FFFFFF;
      border-radius: 20px;
      padding: 1rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      box-shadow: 0 10px 25px rgba(16, 185, 129, 0.25);
      margin-bottom: 1.5rem;
    }

    .ikigega-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .ikigega-title {
      font-size: 0.9rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }

    .pool-total {
      background: #FFFFFF;
      color: #047857;
      font-size: 0.8rem;
      font-weight: 800;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
    }

    .ikigega-subtitle {
      font-size: 0.8rem;
      opacity: 0.9;
    }

    .projects-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.65rem;
    }

    .project-pill {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(4px);
      padding: 0.5rem 0.75rem;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
    }

    .project-info {
      display: flex;
      flex-direction: column;
    }

    .project-info span {
      font-size: 0.65rem;
      opacity: 0.8;
    }
  `]
})
export class IkigegaImpactWidgetComponent {
  projects: Array<{ icon: string; count: string; title: string; location: string }> = [];
}
