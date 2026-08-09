import { Component, signal, ElementRef, ViewChild, AfterViewChecked, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';

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
  position: fixed !important;
  bottom: 24px !important;
  right: 24px !important;
  z-index: 2147483647 !important;
  font-family: var(--f-body, system-ui, sans-serif);
  isolation: isolate;
  contain: layout style paint;
  pointer-events: none;
}
.chatbot-widget > * { pointer-events: auto; }

.chatbot-trigger-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: flex-end;
}

.chatbot-tooltip-badge {
  background: var(--c-obsidian, #0b0b0b);
  color: var(--c-cream, #F3E7D6);
  border: 1.5px solid var(--c-bronze, #a68a6d);
  font-family: var(--f-display, sans-serif);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.22);
  animation: pulseBadge 2.4s infinite ease-in-out;
  white-space: nowrap;
}

@keyframes pulseBadge {
  0%, 100% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(-4px); opacity: 0.92; }
}

.chatbot-trigger-btn {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--c-obsidian, #0b0b0b) 0%, var(--c-slate, #2B2B2B) 100%);
  border: 2.5px solid var(--c-bronze, #a68a6d);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 12px 32px rgba(11, 11, 11, 0.38), 0 0 0 1px rgba(255,255,255,0.06) inset;
  position: relative;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s, box-shadow 0.25s;
  flex-shrink: 0;
}

.chatbot-trigger-btn:hover {
  transform: scale(1.06);
  background: var(--c-bronze, #a68a6d);
  border-color: var(--c-obsidian, #0b0b0b);
  box-shadow: 0 14px 36px rgba(166, 138, 109, 0.45);
}
.chatbot-trigger-btn:active { transform: scale(0.97); }

.robot-avatar {
  font-size: 1.85rem;
  line-height: 1;
}

.online-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #10b981;
  border: 2.5px solid var(--c-obsidian, #0b0b0b);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.35);
}

/* ============ CHAT PANEL ============ */
.chatbot-panel {
  width: min(430px, calc(100vw - 48px));
  height: min(640px, calc(100vh - 120px));
  min-height: 520px;
  background: var(--white, #ffffff);
  border: 2px solid var(--c-bronze, #a68a6d);
  border-radius: 22px;
  box-shadow: 0 28px 80px rgba(11, 11, 11, 0.38), 0 0 0 1px rgba(255,255,255,0.06) inset;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUpChat 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUpChat {
  from { opacity: 0; transform: translateY(18px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ---- HEADER ---- */
.chatbot-header {
  background: var(--c-obsidian, #0b0b0b);
  color: var(--c-cream, #F3E7D6);
  padding: 1rem 1.15rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(166, 138, 109, 0.28);
  flex-shrink: 0;
}

.chatbot-header__info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
}

.robot-header-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(166, 138, 109, 0.18);
  border: 1.5px solid var(--c-bronze, #a68a6d);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  position: relative;
  flex-shrink: 0;
}

.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid var(--c-obsidian, #0b0b0b);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.35);
}

.chatbot-header h4 {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 800;
  color: var(--c-cream, #F3E7D6);
  line-height: 1.2;
  font-family: var(--f-display, sans-serif);
}

.chatbot-header small {
  font-size: 0.76rem;
  color: var(--c-bronze, #a68a6d);
  display: block;
  margin-top: 2px;
  font-weight: 500;
}

.chatbot-close-btn {
  background: rgba(166, 138, 109, 0.15);
  border: 1px solid rgba(166, 138, 109, 0.25);
  color: var(--c-cream, #F3E7D6);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.chatbot-close-btn:hover {
  background: rgba(255,255,255,0.12);
  border-color: var(--c-bronze, #a68a6d);
  color: #fff;
}

/* ---- BODY ---- */
.chatbot-body {
  flex: 1 1 auto;
  padding: 1.1rem;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--c-cream, #F3E7D6);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
}

/* Custom scrollbar */
.chatbot-body::-webkit-scrollbar { width: 7px; }
.chatbot-body::-webkit-scrollbar-track { background: transparent; }
.chatbot-body::-webkit-scrollbar-thumb {
  background: rgba(166, 138, 109, 0.35);
  border-radius: 999px;
}
.chatbot-body::-webkit-scrollbar-thumb:hover {
  background: rgba(166, 138, 109, 0.55);
}
.chatbot-body { scrollbar-width: thin; scrollbar-color: rgba(166,138,109,0.35) transparent; }

.chat-intro-note {
  text-align: center;
  background: color-mix(in srgb, var(--c-bronze, #a68a6d) 10%, transparent);
  border: 1px dashed color-mix(in srgb, var(--c-bronze, #a68a6d) 35%, transparent);
  border-radius: 14px;
  padding: 0.8rem 1rem;
  margin-bottom: 0.2rem;
}

.chat-intro-note span {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--c-bronze-dark, #836749);
}

.chat-intro-note p {
  margin: 0.35rem 0 0 0;
  font-size: 0.82rem;
  color: var(--ink-on-light-65, #4a4a4a);
  line-height: 1.45;
}

/* ---- MESSAGES ---- */
.chat-msg {
  display: flex;
  gap: 0.65rem;
  width: 100%;
}

.chat-msg--bot {
  justify-content: flex-start;
}
.chat-msg--bot > * { max-width: 86%; }

.chat-msg--user {
  justify-content: flex-end;
  flex-direction: row;
}
.chat-msg--user > * { max-width: 86%; }

.msg-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--c-obsidian, #0b0b0b);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
}

.msg-bubble {
  padding: 0.78rem 1rem;
  border-radius: 16px;
  font-size: 0.88rem;
  line-height: 1.5;
  position: relative;
  overflow-wrap: anywhere;
  word-break: break-word;
  hyphens: auto;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.chat-msg--bot .msg-bubble {
  background: var(--white, #ffffff);
  border: 1px solid color-mix(in srgb, var(--c-bronze, #a68a6d) 22%, transparent);
  color: var(--ink-on-light, #1a1a1a);
  border-top-left-radius: 3px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
}

.chat-msg--user .msg-bubble {
  background: var(--c-obsidian, #0b0b0b);
  color: var(--c-cream, #F3E7D6);
  border-top-right-radius: 3px;
  box-shadow: 0 3px 10px rgba(11, 11, 11, 0.18);
}

.msg-bubble p {
  margin: 0;
  width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.msg-bubble a {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  font-weight: 600;
}
.msg-bubble strong { font-weight: 700; }

.msg-time {
  display: block;
  font-size: 0.66rem;
  opacity: 0.62;
  margin-top: 0.4rem;
  text-align: right;
}

/* ---- TYPING ---- */
.typing-bubble {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0.72rem 1rem;
  width: auto !important;
}

.typing-bubble .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--c-bronze, #a68a6d);
  animation: typingDot 1.4s infinite ease-in-out both;
}

.typing-bubble .dot:nth-child(1) { animation-delay: 0s; }
.typing-bubble .dot:nth-child(2) { animation-delay: 0.18s; }
.typing-bubble .dot:nth-child(3) { animation-delay: 0.36s; }

@keyframes typingDot {
  0%, 80%, 100% { transform: scale(0.55); opacity: 0.35; }
  40% { transform: scale(1.15); opacity: 1; }
}

/* ---- QUICK CHIPS ---- */
.chatbot-quick-chips {
  padding: 0.65rem 0.9rem 0.55rem;
  background: var(--white, #ffffff);
  border-top: 1px solid color-mix(in srgb, var(--c-bronze, #a68a6d) 18%, transparent);
  display: flex;
  gap: 0.45rem;
  overflow-x: auto;
  scrollbar-width: none;
  flex-shrink: 0;
}
.chatbot-quick-chips::-webkit-scrollbar { display: none; }

.chip-btn {
  background: var(--c-cream, #F3E7D6);
  border: 1px solid color-mix(in srgb, var(--c-bronze, #a68a6d) 28%, transparent);
  border-radius: 999px;
  padding: 0.48rem 0.8rem;
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--c-obsidian, #0b0b0b);
  cursor: pointer;
  transition: all 0.18s var(--ease, ease);
  flex: 0 0 auto;
  white-space: nowrap;
  font-family: var(--f-body, sans-serif);
}

.chip-btn:hover {
  background: var(--c-bronze, #a68a6d);
  color: #fff;
  border-color: var(--c-bronze, #a68a6d);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(166, 138, 109, 0.3);
}

/* ---- FOOTER / INPUT ---- */
.chatbot-footer {
  padding: 0.85rem 0.95rem;
  background: var(--white, #ffffff);
  border-top: 1px solid color-mix(in srgb, var(--c-bronze, #a68a6d) 18%, transparent);
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

.chatbot-footer input {
  flex: 1 1 auto;
  border: 1.5px solid color-mix(in srgb, var(--c-bronze, #a68a6d) 28%, transparent);
  border-radius: 999px;
  padding: 0.7rem 1.05rem;
  font-size: 0.88rem;
  color: var(--ink-on-light, #1a1a1a);
  outline: none;
  background: var(--c-cream, #F3E7D6);
  min-width: 0;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: var(--f-body, sans-serif);
  font-weight: 500;
}

.chatbot-footer input::placeholder {
  color: var(--ink-on-light-40, #8a8a8a);
  font-weight: 400;
}

.chatbot-footer input:focus {
  border-color: var(--c-bronze, #a68a6d);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-bronze, #a68a6d) 22%, transparent);
  background: #fff;
}

.send-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--c-obsidian, #0b0b0b);
  color: var(--c-bronze, #a68a6d);
  border: 1.5px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.22s;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(11, 11, 11, 0.18);
}

.send-btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
  box-shadow: none;
}

.send-btn:not(:disabled):hover {
  background: var(--c-bronze, #a68a6d);
  color: var(--c-obsidian, #0b0b0b);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(166, 138, 109, 0.4);
}
.send-btn:not(:disabled):active { transform: scale(0.95); }

/* ============ RESPONSIVE ============ */
@media (max-width: 992px) {
  .chatbot-widget {
    bottom: 20px !important;
    right: 20px !important;
  }
  .chatbot-panel {
    width: min(380px, calc(100vw - 40px));
    height: min(580px, calc(100vh - 140px));
    min-height: 480px;
  }
}

@media (max-width: 640px) {
  .chatbot-widget {
    bottom: 12px !important;
    right: 12px !important;
    left: 12px !important;
  }
  .chatbot-trigger-wrapper {
    justify-content: flex-end;
  }
  .chatbot-tooltip-badge { font-size: 0.76rem; padding: 0.42rem 0.75rem; }
  .chatbot-trigger-btn { width: 56px; height: 56px; }
  .chatbot-panel {
    width: 100% !important;
    height: min(78vh, 640px);
    min-height: 440px;
    border-radius: 18px;
  }
  .chatbot-header { padding: 0.9rem 1rem; }
  .chatbot-body { padding: 0.95rem; gap: 0.9rem; }
  .chatbot-footer { padding: 0.75rem 0.85rem; }
  .chat-msg--bot > *, .chat-msg--user > * { max-width: 88%; }
}
  `]
})
export class ChatbotComponent implements AfterViewChecked {
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

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    // isPlatformBrowser usage réservé pour extensions futures (localStorage préférences IA)
    void isPlatformBrowser(platformId);
  }

  private ragUrl(path: string): string {
    const base = environment.apiBaseUrl?.replace(/\/$/, '') ?? '';
    return `${base}/api/ai${path.startsWith('/') ? path : '/' + path}`;
  }

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

    // Call Java Light RAG API — utilise apiBaseUrl pour reverse-proxy
    const payload = { question: text, topK: 5 };
    this.http.post<any>(this.ragUrl('/rag/ask'), payload, { withCredentials: false }).subscribe({
      next: (res) => {
        this.isTyping.set(false);
        let answerText: string;
        if (res?.answer && typeof res.answer === 'string') {
          answerText = res.answer;
        } else {
          answerText = this.generateBotResponse(text);
        }
        answerText = answerText
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n/g, '<br>');

        if (Array.isArray(res?.sources) && res.sources.length > 0) {
          const srcs = res.sources.slice(0, 3).map((s: any) => s?.title || s?.source || '').filter(Boolean);
          if (srcs.length) {
            answerText += `<br><br><small style="opacity:.65">📚 Sources : ${srcs.join(' · ')}</small>`;
          }
        }

        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: answerText,
          time: this.getNowTime(),
        };
        this.messages.update((msgs) => [...msgs, botMsg]);
      },
      error: (err: unknown) => {
        this.isTyping.set(false);
        let fallback = this.generateBotResponse(text);
        if (err instanceof HttpErrorResponse) {
          if (err.status === 429) {
            fallback = '⏳ <strong>Trop de requêtes envoyées.</strong><br>Merci de patienter une minute avant de renouveler votre demande. Pendant ce temps, explorez nos annonces : <a style="color:var(--c-bronze-dark);font-weight:700" href="/biens">Tous les biens</a>';
          } else if (err.status === 403 || err.status === 401) {
            // Ne surtout PAS trigger de logout : /api/ai est en permitAll
            fallback = '🔒 <strong>Session en cours de rétablissement.</strong><br>' + fallback;
          } else if (err.status >= 500) {
            fallback = '⚠️ <strong>Service IA indisponible.</strong><br>' + fallback;
          }
        }
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: fallback,
          time: this.getNowTime(),
        };
        this.messages.update((msgs) => [...msgs, botMsg]);
      }
    });
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
