import { Component, signal, inject, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  quickAction?: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<!-- FLOATING CHATBOT WIDGET (BOTTOM RIGHT) -->
<div class="chatbot-widget">
  
  <!-- FLOATING TRIGGER BUTTON & BADGE -->
  <div class="chatbot-trigger-wrapper" *ngIf="!isOpen()">
    <span class="chatbot-tooltip-badge">Besoin d'aide ?</span>
    <button type="button" class="chatbot-trigger-btn" (click)="toggleChat()" aria-label="Ouvrir l'assistant virtuel InzuBot">
      <span class="robot-avatar">🤖</span>
      <span class="online-dot"></span>
    </button>
  </div>

  <!-- FLOATING CHAT WINDOW PANEL -->
  <div class="chatbot-panel" *ngIf="isOpen()">
    <!-- CHAT HEADER -->
    <div class="chatbot-header">
      <div class="chatbot-header__info">
        <div class="robot-header-avatar">
          <span>🤖</span>
          <span class="online-indicator"></span>
        </div>
        <div>
          <h4>Assistant InzuBot</h4>
          <small>IA Immobilier & Kirundi 24/7</small>
        </div>
      </div>
      <button type="button" class="chatbot-close-btn" (click)="toggleChat()" aria-label="Fermer le chat">✕</button>
    </div>

    <!-- CHAT MESSAGES BODY -->
    <div class="chatbot-body" #scrollContainer>
      <div class="chat-intro-note">
        <span class="mono">INZUBOT AI ASSISTANT</span>
        <p>Posez vos questions en Français ou en Kirundi pour trouver votre logement au Burundi.</p>
      </div>

      <div *ngFor="let msg of messages()" class="chat-msg" [class.chat-msg--user]="msg.sender === 'user'" [class.chat-msg--bot]="msg.sender === 'bot'">
        <div class="msg-avatar" *ngIf="msg.sender === 'bot'">🤖</div>
        <div class="msg-bubble">
          <p [innerHTML]="msg.text"></p>
          <span class="msg-time">{{ msg.time }}</span>
        </div>
      </div>

      <!-- TYPING INDICATOR -->
      <div *ngIf="isTyping()" class="chat-msg chat-msg--bot">
        <div class="msg-avatar">🤖</div>
        <div class="msg-bubble typing-bubble">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>

    <!-- QUICK CHIPS SUGGESTIONS -->
    <div class="chatbot-quick-chips">
      <button type="button" class="chip-btn" (click)="sendQuickQuery('Biens avec Groupe Électrogène & Citerne')">
        ⚡ Groupe & Citerne
      </button>
      <button type="button" class="chip-btn" (click)="sendQuickQuery('Maisons de passage à Rohero & Kigobe')">
        📍 Rohero / Kigobe
      </button>
      <button type="button" class="chip-btn" (click)="sendQuickQuery('Comment obtenir le Badge KYC ?')">
        🛡️ Badge KYC
      </button>
      <button type="button" class="chip-btn" (click)="sendQuickQuery('Service Transfert Aéroport')">
        ✈️ Transfert Aéroport
      </button>
    </div>

    <!-- CHAT INPUT FOOTER -->
    <form class="chatbot-footer" (submit)="handleSend($event)">
      <input
        type="text"
        placeholder="Posez votre question en français ou kirundi..."
        [(ngModel)]="inputText"
        name="inputText"
        autocomplete="off"
      >
      <button type="submit" class="send-btn" [disabled]="!inputText.trim()">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </form>
  </div>

</div>
  `,
  styles: [`
.chatbot-widget {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 9999;
  font-family: var(--f-body, system-ui, sans-serif);
}

.chatbot-trigger-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.chatbot-tooltip-badge {
  background: var(--c-obsidian, #0b0b0b);
  color: var(--c-cream, #f7f4ee);
  border: 1.5px solid var(--c-bronze, #a68a6d);
  font-family: var(--f-display, sans-serif);
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.45rem 0.85rem;
  border-radius: 20px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
  animation: pulseBadge 2.5s infinite ease-in-out;
}

@keyframes pulseBadge {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.chatbot-trigger-btn {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--c-obsidian, #0b0b0b) 0%, #1e1e1e 100%);
  border: 2px solid var(--c-bronze, #a68a6d);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 10px 28px rgba(11, 11, 11, 0.3);
  position: relative;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.chatbot-trigger-btn:hover {
  transform: scale(1.08) rotate(4deg);
  background: var(--c-bronze, #a68a6d);
  border-color: var(--c-obsidian, #0b0b0b);
}

.robot-avatar {
  font-size: 1.8rem;
  line-height: 1;
}

.online-dot {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid #0b0b0b;
}

/* CHAT PANEL */
.chatbot-panel {
  width: 380px;
  height: 540px;
  background: #ffffff;
  border: 2px solid var(--c-bronze, #a68a6d);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(11, 11, 11, 0.28);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUpChat 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUpChat {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.chatbot-header {
  background: var(--c-obsidian, #0b0b0b);
  color: var(--c-cream, #f7f4ee);
  padding: 0.9rem 1.1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(166, 138, 109, 0.3);
}

.chatbot-header__info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.robot-header-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(166, 138, 109, 0.2);
  border: 1px solid var(--c-bronze, #a68a6d);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  position: relative;
}

.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #10b981;
  border: 1.5px solid #0b0b0b;
}

.chatbot-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: #ffffff;
}

.chatbot-header small {
  font-size: 0.75rem;
  color: var(--c-bronze, #a68a6d);
}

.chatbot-close-btn {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.chatbot-close-btn:hover {
  opacity: 1;
}

.chatbot-body {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  background: #fbf9f5;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.chat-intro-note {
  text-align: center;
  background: rgba(166, 138, 109, 0.1);
  border: 1px dashed rgba(166, 138, 109, 0.3);
  border-radius: 12px;
  padding: 0.6rem 0.85rem;
  margin-bottom: 0.5rem;
}

.chat-intro-note span {
  font-size: 0.68rem;
  font-weight: 800;
  color: var(--c-bronze-dark, #836749);
}

.chat-intro-note p {
  margin: 0.2rem 0 0 0;
  font-size: 0.78rem;
  color: #4a4a4a;
}

.chat-msg {
  display: flex;
  gap: 0.6rem;
  max-width: 86%;
}

.chat-msg--bot {
  align-self: flex-start;
}

.chat-msg--user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--c-obsidian, #0b0b0b);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.msg-bubble {
  padding: 0.7rem 0.9rem;
  border-radius: 14px;
  font-size: 0.86rem;
  line-height: 1.45;
  position: relative;
}

.chat-msg--bot .msg-bubble {
  background: #ffffff;
  border: 1px solid rgba(166, 138, 109, 0.25);
  color: #1a1a1a;
  border-top-left-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.chat-msg--user .msg-bubble {
  background: var(--c-obsidian, #0b0b0b);
  color: #ffffff;
  border-top-right-radius: 2px;
}

.msg-bubble p {
  margin: 0;
}

.msg-time {
  display: block;
  font-size: 0.66rem;
  opacity: 0.6;
  margin-top: 0.3rem;
  text-align: right;
}

.typing-bubble {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0.6rem 0.9rem;
}

.typing-bubble .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--c-bronze, #a68a6d);
  animation: typingDot 1.4s infinite ease-in-out both;
}

.typing-bubble .dot:nth-child(1) { animation-delay: 0s; }
.typing-bubble .dot:nth-child(2) { animation-delay: 0.2s; }
.typing-bubble .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingDot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1.1); opacity: 1; }
}

.chatbot-quick-chips {
  padding: 0.5rem 0.85rem;
  background: #ffffff;
  border-top: 1px solid rgba(166, 138, 109, 0.15);
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  white-space: nowrap;
}

.chip-btn {
  background: var(--c-cream, #f7f4ee);
  border: 1px solid rgba(166, 138, 109, 0.3);
  border-radius: 14px;
  padding: 0.35rem 0.65rem;
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--c-obsidian, #0b0b0b);
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.chip-btn:hover {
  background: var(--c-bronze, #a68a6d);
  color: #fff;
  border-color: var(--c-bronze, #a68a6d);
}

.chatbot-footer {
  padding: 0.75rem 0.85rem;
  background: #ffffff;
  border-top: 1px solid rgba(166, 138, 109, 0.15);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chatbot-footer input {
  flex: 1;
  border: 1.5px solid rgba(166, 138, 109, 0.25);
  border-radius: 20px;
  padding: 0.55rem 0.9rem;
  font-size: 0.85rem;
  color: #1a1a1a;
  outline: none;
  background: #fbf9f5;
}

.chatbot-footer input:focus {
  border-color: var(--c-bronze, #a68a6d);
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--c-obsidian, #0b0b0b);
  color: var(--c-bronze, #a68a6d);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.send-btn:not(:disabled):hover {
  background: var(--c-bronze, #a68a6d);
  color: #ffffff;
}

@media (max-width: 480px) {
  .chatbot-widget {
    bottom: 1rem;
    right: 1rem;
  }
  .chatbot-panel {
    width: calc(100vw - 2rem);
    height: 480px;
  }
}
  `]
})
export class ChatbotComponent implements AfterViewChecked {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef;

  readonly isOpen = signal(false);
  readonly isTyping = signal(false);
  inputText = '';

  readonly messages = signal<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Amahoro! 👋 Je suis **InzuBot**, votre assistant virtuel intelligent pour l\'immobilier au Burundi.<br><br>Comment puis-je vous aider aujourd\'hui ?',
      time: this.getNowTime(),
    }
  ]);

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  toggleChat(): void {
    this.isOpen.set(!this.isOpen());
  }

  sendQuickQuery(queryText: string): void {
    this.inputText = queryText;
    this.handleSend(new Event('submit'));
  }

  handleSend(e: Event): void {
    e.preventDefault();
    const text = this.inputText.trim();
    if (!text) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: this.getNowTime(),
    };

    this.messages.update((msgs) => [...msgs, userMsg]);
    this.inputText = '';
    this.isTyping.set(true);

    // Generate intelligent response after simulated delay
    setTimeout(() => {
      this.isTyping.set(false);
      const botResponseText = this.generateBotResponse(text);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botResponseText,
        time: this.getNowTime(),
      };
      this.messages.update((msgs) => [...msgs, botMsg]);
    }, 1100);
  }

  private generateBotResponse(input: string): string {
    const q = input.toLowerCase();

    if (q.includes('groupe') || q.includes('citerne') || q.includes('eau') || q.includes('electricite')) {
      return '⚡ <strong>Biens avec Garantie Autonome :</strong><br>Tous nos logements certifiés InzuConnect incluent un groupe électrogène autonome et une citerne d\'eau 3000L+. <br><br>👉 <a style="color:var(--c-bronze-dark);font-weight:700" href="/biens?type=all">Voir nos logements autonomes</a>';
    }

    if (q.includes('rohero') || q.includes('kigobe') || q.includes('kinindo') || q.includes('bujumbura')) {
      return '📍 <strong>Quartiers prisés de Bujumbura :</strong><br>Nous avons 12 villas et appartements disponibles à Rohero, Kigobe Nord et Kinindo avec vue sur le Lac Tanganyika.<br><br>👉 <a style="color:var(--c-bronze-dark);font-weight:700" href="/biens?q=Bujumbura">Consulter les biens à Bujumbura</a>';
    }

    if (q.includes('kyc') || q.includes('badge') || q.includes('hôte') || q.includes('hote')) {
      return '🛡️ <strong>Badge "Hôte Certifié InzuConnect" :</strong><br>Pour faire vérifier vos annonces ou votre profil hôte avec votre CNI et titre foncier, soumettez votre dossier sur notre page dédiée.<br><br>👉 <a style="color:var(--c-bronze-dark);font-weight:700" href="/kyc">Déposer ma demande KYC</a>';
    }

    if (q.includes('transfert') || q.includes('aeroport') || q.includes('véhicule')) {
      return '✈️ <strong>Services de Transfert Aéroport Melchior Ndadaye :</strong><br>Bénéficiez d\'un chauffeur privé climatisé dès votre arrivée à Bujumbura.<br><br>👉 Tarif préférentiel à partir de 45 000 FBu.';
    }

    if (q.includes('amahoro') || q.includes('bwege') || q.includes('bite') || q.includes('kirundi')) {
      return 'Egome! Amahoro mwese 👋 InzuConnect iraguhaye ikaze. Wifuza inzu yo gukodesha cyangwa yo kugura i Bujumbura neza?';
    }

    return 'Merci pour votre message ! 🤖 En tant qu\'assistant virtuel InzuConnect, je peux vous guider pour trouver un logement à louer ou à acheter au Burundi, planifier un transfert ou faire certifier votre bien.<br><br>👉 Vous pouvez aussi explorer directement <a style="color:var(--c-bronze-dark);font-weight:700" href="/biens">toutes nos annonces</a>.';
  }

  private getNowTime(): string {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }
}
