import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-voice-assistant',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="voice-assistant-card glass-card animate-fade-in">
      <div class="voice-header">
        <div class="ai-badge">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
          <span>Amahoro AI Voice Burundi</span>
        </div>
        <button class="lang-switch-btn" (click)="toggleLanguage()">
          🌐 {{ selectedLanguage === 'rn' ? 'Kirundi' : 'Français' }}
        </button>
      </div>

      <div class="mic-container" [class.listening]="isListening" (click)="toggleListening()">
        <div class="pulse-ring" *ngIf="isListening"></div>
        <button class="mic-circle-btn">
          <i [class]="isListening ? 'fa-solid fa-microphone-lines' : 'fa-solid fa-microphone'"></i>
        </button>
      </div>

      <div class="transcript-box">
        <p class="transcript-text" *ngIf="transcriptText">"{{ transcriptText }}"</p>
        <p class="transcript-placeholder" *ngIf="!transcriptText && !isListening">
          {{ selectedLanguage === 'rn' ? 'Kanda hano uvuge: "Ndashaka inzu i Bujumbura ifise piscina"' : 'Appuyez et dites par exemple : "Je cherche une villa à Rohero avec groupe électrogène"' }}
        </p>
        <p class="listening-text" *ngIf="isListening">
          <i class="fa-solid fa-volume-high wave-icon"></i> Amahoro AI vous écoute...
        </p>
      </div>

      <div class="ai-response-banner" *ngIf="aiResponse">
        <i class="fa-solid fa-robot"></i>
        <span>{{ aiResponse }}</span>
      </div>
    </div>
  `,
  styles: [`
    .voice-assistant-card {
      background: linear-gradient(135deg, rgba(54, 37, 92, 0.95) 0%, rgba(110, 68, 186, 0.95) 100%);
      color: #FFFFFF;
      border-radius: 24px;
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 16px 40px rgba(54, 37, 92, 0.35);
      border: 1.5px solid #D2C3F6;
      margin-bottom: 1.5rem;
    }

    .voice-header {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .ai-badge {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.82rem;
      font-weight: 800;
      background: rgba(255, 255, 255, 0.15);
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
    }

    .lang-switch-btn {
      background: #D2C3F6;
      color: #36255C;
      border: none;
      padding: 0.25rem 0.7rem;
      border-radius: 9999px;
      font-weight: 800;
      font-size: 0.78rem;
      cursor: pointer;
    }

    .mic-container {
      position: relative;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mic-circle-btn {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #FFFFFF;
      color: #36255C;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      transition: transform 0.2s ease;
    }

    .mic-container:hover .mic-circle-btn {
      transform: scale(1.08);
    }

    .pulse-ring {
      position: absolute;
      width: 84px;
      height: 84px;
      border-radius: 50%;
      background: rgba(210, 195, 248, 0.4);
      animation: pulse 1.2s infinite ease-out;
    }

    @keyframes pulse {
      0% { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(1.4); opacity: 0; }
    }

    .transcript-box {
      text-align: center;
      min-height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .transcript-text {
      font-size: 1.05rem;
      font-weight: 700;
      color: #FFFFFF;
    }

    .transcript-placeholder {
      font-size: 0.82rem;
      color: rgba(255, 255, 255, 0.75);
    }

    .listening-text {
      font-size: 0.9rem;
      font-weight: 800;
      color: #D2C3F6;
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }

    .ai-response-banner {
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      padding: 0.5rem 1rem;
      border-radius: 12px;
      font-size: 0.82rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  `]
})
export class VoiceAssistantComponent {
  @Output() searchVoice = new EventEmitter<string>();

  isListening = false;
  selectedLanguage: 'rn' | 'fr' = 'rn';
  transcriptText = '';
  aiResponse = '';

  toggleLanguage() {
    this.selectedLanguage = this.selectedLanguage === 'rn' ? 'fr' : 'rn';
  }

  toggleListening() {
    this.isListening = !this.isListening;
    if (this.isListening) {
      this.aiResponse = '';
      this.transcriptText = '';
      setTimeout(() => {
        if (this.selectedLanguage === 'rn') {
          this.transcriptText = 'Ndashaka inzu i Bujumbura ifise piscina';
          this.aiResponse = 'Amahoro ! Twabonye inzu 3 i Bujumbura zifise piscina.';
        } else {
          this.transcriptText = 'Je cherche une villa à Rohero avec groupe électrogène';
          this.aiResponse = 'Amahoro ! Nous avons trouvé 4 villas disponibles avec groupe électrogène.';
        }
        this.isListening = false;
        this.searchVoice.emit(this.transcriptText);
        this.speakResponse(this.aiResponse);
      }, 3000);
    }
  }

  speakResponse(text: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      window.speechSynthesis.speak(utterance);
    }
  }
}
