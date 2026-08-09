import {
  Component, signal, ElementRef, ViewChild, AfterViewChecked, effect,
  PLATFORM_ID, Inject, OnInit, OnDestroy, Renderer2,
  ApplicationRef, createComponent, EnvironmentInjector, Injector,
  ComponentRef, ViewEncapsulation,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
}

/**
 * Composant INTERNE — rendu DIRECTEMENT sous <body> via un Angular Portal
 * créé par le wrapper public <app-chatbot>.
 *
 * Pourquoi un Portail ?
 *   C'est la SEULE méthode CSS-incassable. Un ancêtre portant
 *   `transform` / `perspective` / `filter` / `contain: paint` change
 *   le référentiel `position: fixed` en référentiel LOCAL. Le footer
 *   de la page est souvent `position: relative; overflow: hidden;` ce
 *   qui produit EXACTEMENT le bug observé (bouton "dans" le footer).
 *
 *   Intercom, Drift, Crisp utilisent tous ce pattern.
 */
@Component({
  selector: 'inzu-chatbot-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  encapsulation: ViewEncapsulation.None,
  template: `
<div class="chatbot-widget">
  <ng-container *ngIf="!isOpen()">
    <div class="chatbot-trigger-wrapper">
      <div class="chatbot-tooltip-badge">
        <span>Besoin d'aide&nbsp;?</span>
        <span class="chatbot-tooltip-badge__robot">🤖</span>
      </div>
      <button
        class="chatbot-trigger-btn"
        (click)="toggle()"
        type="button"
        aria-label="Ouvrir l'assistant InzuBot"
      >
        <span class="robot-avatar" aria-hidden="true">🤖</span>
        <span class="online-dot" aria-hidden="true"></span>
      </button>
    </div>
  </ng-container>

  <ng-container *ngIf="isOpen()">
    <div class="chatbot-panel" role="dialog" aria-label="Assistant InzuBot" aria-modal="true">
      <header class="chatbot-header">
        <div class="chatbot-header__info">
          <div class="robot-header-avatar">
            🤖
            <span class="online-indicator"></span>
          </div>
          <div style="min-width: 0;">
            <h4>Assistant InzuBot</h4>
            <small>IA Immobilier & Kirundi 24/7</small>
          </div>
        </div>
        <button class="chatbot-close-btn" type="button" (click)="toggle()" aria-label="Fermer l'assistant">
          ×
        </button>
      </header>

      <div class="chatbot-body" #scrollContainer>
        <div class="chat-intro-note">
          <span>INZUBOT  AI  ASSISTANT</span>
          <p>Posez vos questions en Français ou en Kirundi pour trouver votre logement au Burundi.</p>
        </div>

        <div class="chat-msg" *ngFor="let msg of messages()">
          <ng-container *ngIf="msg.sender === 'bot'">
            <div class="chat-msg--bot-inner">
              <div class="msg-avatar">🤖</div>
              <div class="msg-bubble" [innerHTML]="msg.text"></div>
              <span class="msg-time">{{ msg.time }}</span>
            </div>
          </ng-container>
          <ng-container *ngIf="msg.sender === 'user'">
            <div class="chat-msg--user-inner">
              <span class="msg-time">{{ msg.time }}</span>
              <div class="msg-bubble" [innerHTML]="msg.text"></div>
            </div>
          </ng-container>
        </div>

        <div class="chat-msg" *ngIf="isTyping()">
          <div class="chat-msg--bot-inner">
            <div class="msg-avatar">🤖</div>
            <div class="msg-bubble msg-bubble--typing">
              <div class="typing-dots">
                <span></span><span></span><span></span>
              </div>
              <style>
                @keyframes typingBounce {
                  0%, 80%, 100% { transform: scale(.6); opacity: .5 }
                  40%            { transform: scale(1);  opacity: 1  }
                }
              </style>
            </div>
          </div>
        </div>
      </div>

      <div class="chatbot-suggestions">
        <button type="button" class="chip-btn"
          (mouseenter)="($any($event.currentTarget)).style.transform='translateY(-1px)'"
          (mouseleave)="($any($event.currentTarget)).style.transform=''"
          (click)="sendQuickQuery('Quels biens à Bujumbura < 200k BIF/nuit ?')">
          ⚡ Groupe & Citerne
        </button>
        <button type="button" class="chip-btn"
          (mouseenter)="($any($event.currentTarget)).style.transform='translateY(-1px)'"
          (mouseleave)="($any($event.currentTarget)).style.transform=''"
          (click)="sendQuickQuery('Appartements à Rohero/Kigobe pour une famille ?')">
          📍 Rohero / Kigobe
        </button>
        <button type="button" class="chip-btn"
          (mouseenter)="($any($event.currentTarget)).style.transform='translateY(-1px)'"
          (mouseleave)="($any($event.currentTarget)).style.transform=''"
          (click)="sendQuickQuery('Comment obtenir le badge PREMIUM hôte ?')">
          🛡️ Badge KYC
        </button>
        <button type="button" class="chip-btn"
          (mouseenter)="($any($event.currentTarget)).style.transform='translateY(-1px)'"
          (mouseleave)="($any($event.currentTarget)).style.transform=''"
          (click)="sendQuickQuery('Proposez-vous un transfert aéroport BJM ?')">
          ✈️ Transfert Aéroport
        </button>
      </div>

      <div class="chatbot-footer">
        <form (ngSubmit)="handleSend($event)" class="chatbot-footer__form">
          <input
            type="text"
            [(ngModel)]="inputText"
            name="chatbotQuestion"
            class="chatbot-input"
            placeholder="Posez votre question en français ou kirundi…"
            autocomplete="off"
          />
          <button type="submit" class="send-btn" [disabled]="!inputText.trim()">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  </ng-container>

  <div class="chatbot-status-bar">
    <span class="chatbot-status-bar__label">Signal · Grid↻</span>
    <span class="chatbot-status-bar__dot" aria-hidden="true"></span>
  </div>
</div>
  `,
  styles: [`
/* =========================================================
   WIDGET FIXED — rendu DIRECTEMENT SOUS <body> via un Portal
   z-index = 2147483647 (int32 max = intouchable)
   ========================================================= */
.chatbot-widget {
  position: fixed !important;
  bottom: 24px !important;
  right:  24px !important;
  top:    auto !important;
  left:   auto !important;
  width:  auto !important;
  max-width: calc(100vw - 24px);
  z-index: 2147483647 !important;

  font-family: var(--f-body, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif);
  color-scheme: light;

  isolation: isolate;
  contain: layout style;

  pointer-events: none;

  /* Boucliers anti-transform-ancêtre : on ré-applique toutes les
     propriétés qui feraient basculer position: fixed en
     position: absolute par rapport à un parent. */
  transform:        none !important;
  filter:           none !important;
  perspective:      none !important;
  backdrop-filter:  none !important;
  will-change:      unset !important;
  clip-path:        none !important;
  -webkit-mask:     none !important;
          mask:     none !important;
}
.chatbot-widget > * {
  pointer-events: auto;
}

/* ---------- TRIGGER (état fermé) ---------- */
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
  font-family: var(--f-display, 'Playfair Display', serif);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.22);
  animation: pulseBadge 2.4s infinite ease-in-out;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}
.chatbot-tooltip-badge__robot { font-size: 1rem; line-height: 1; }
@keyframes pulseBadge {
  0%, 100% { transform: translateY(0);   opacity: 1;    }
  50%      { transform: translateY(-4px); opacity: 0.92; }
}

.chatbot-trigger-btn {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background: linear-gradient(135deg,
    var(--c-obsidian, #0b0b0b) 0%,
    var(--c-slate,   #2B2B2B) 100%);
  border: 2.5px solid var(--c-bronze, #a68a6d);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow:
    0 12px 32px rgba(11, 11, 11, 0.38),
    inset 0 0 0 1px rgba(255,255,255,0.06);
  position: relative;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              background 0.25s,
              box-shadow 0.25s;
  flex-shrink: 0;
  font: inherit;
}
.chatbot-trigger-btn:hover {
  transform: scale(1.06);
  background: var(--c-bronze, #a68a6d);
  border-color: var(--c-obsidian, #0b0b0b);
  box-shadow: 0 14px 36px rgba(166, 138, 109, 0.45);
}
.chatbot-trigger-btn:active { transform: scale(0.97); }

.robot-avatar { font-size: 1.85rem; line-height: 1; }

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

/* ---------- CHAT PANEL ---------- */
.chatbot-panel {
  width:      min(430px, calc(100vw - 48px));
  height:     min(640px, calc(100vh - 120px));
  min-height: 520px;
  background: var(--white, #ffffff);
  border: 2px solid var(--c-bronze, #a68a6d);
  border-radius: 22px;
  box-shadow:
    0 28px 80px rgba(11, 11, 11, 0.38),
    inset 0 0 0 1px rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUpChat 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes slideUpChat {
  from { opacity: 0; transform: translateY(18px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
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
  display: inline-flex;
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
  font-family: var(--f-display, 'Playfair Display', serif);
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
  font: inherit;
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
  scrollbar-gutter: stable;
}
.chatbot-body::-webkit-scrollbar           { width: 7px; }
.chatbot-body::-webkit-scrollbar-track     { background: transparent; }
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
  width: 100%;
}

.chat-msg--bot-inner,
.chat-msg--user-inner {
  display: flex;
  gap: 0.65rem;
  width: 100%;
  align-items: flex-end;
}
.chat-msg--user-inner {
  justify-content: flex-end;
}

.chat-msg--bot-inner  > * { max-width: 86%; }
.chat-msg--user-inner > * { max-width: 86%; }

.msg-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--c-obsidian, #0b0b0b);
  display: inline-flex;
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
  -webkit-hyphens: auto;
          hyphens: auto;
  min-width: 0;
  box-sizing: border-box;
}

.chat-msg--bot-inner .msg-bubble {
  background: var(--white, #ffffff);
  border: 1px solid color-mix(in srgb, var(--c-bronze, #a68a6d) 22%, transparent);
  color: var(--ink-on-light, #1a1a1a);
  border-top-left-radius: 3px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
}

.chat-msg--user-inner .msg-bubble {
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

.msg-bubble--typing {
  max-width: 96px !important;
  padding: .75rem 1rem !important;
}
.typing-dots {
  display: flex;
  gap: .35rem;
  align-items: center;
  height: 14px;
}
.typing-dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--c-bronze, #a68a6d);
  animation: typingBounce 1.2s infinite ease-in-out both;
}
.typing-dots span:nth-child(2) { animation-delay: .15s; }
.typing-dots span:nth-child(3) { animation-delay: .3s;  }

.msg-time {
  display: block;
  font-size: 0.66rem;
  opacity: 0.62;
  white-space: nowrap;
  align-self: flex-end;
  flex-shrink: 0;
}
.chat-msg--bot-inner  .msg-time { margin-left: auto; }
.chat-msg--user-inner .msg-time { margin-right: auto; }

/* ---- SUGGESTIONS ---- */
.chatbot-suggestions {
  padding: .85rem 1rem .15rem 1rem;
  background: var(--white, #fff);
  border-top: 1px solid color-mix(in srgb, var(--c-bronze, #a68a6d) 14%, transparent);
  display: flex;
  flex-wrap: wrap;
  gap: .45rem;
}
.chip-btn {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  padding: .45rem .8rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--c-bronze, #a68a6d) 10%, transparent);
  color: var(--ink-on-light, #1a1a1a);
  border: 1px solid color-mix(in srgb, var(--c-bronze, #a68a6d) 22%, transparent);
  font-size: .78rem;
  font-weight: 600;
  transition: all .18s ease;
  box-sizing: border-box;
}
.chip-btn:hover {
  background: color-mix(in srgb, var(--c-bronze, #a68a6d) 18%, transparent);
  border-color: color-mix(in srgb, var(--c-bronze, #a68a6d) 40%, transparent);
  box-shadow: 0 3px 10px rgba(166,138,109,0.20);
}

/* ---- FOOTER / INPUT ---- */
.chatbot-footer {
  padding: 0.85rem 0.95rem 1rem 0.95rem;
  background: var(--white, #ffffff);
  border-top: 1px solid color-mix(in srgb, var(--c-bronze, #a68a6d) 18%, transparent);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
.chatbot-footer__form {
  display: flex;
  gap: .55rem;
  width: 100%;
  align-items: center;
  margin: 0;
}
.chatbot-input {
  flex: 1 1 auto;
  all: unset;
  box-sizing: border-box;
  background: color-mix(in srgb, var(--c-bronze, #a68a6d) 8%, transparent);
  border: 1.5px solid color-mix(in srgb, var(--c-bronze, #a68a6d) 20%, transparent);
  border-radius: 14px;
  padding: .65rem .85rem;
  font-size: .88rem;
  color: var(--ink-on-light, #1a1a1a);
  transition: all .15s;
  min-width: 0;
}
.chatbot-input::placeholder {
  color: color-mix(in srgb, var(--ink-on-light, #1a1a1a) 45%, transparent);
}
.chatbot-input:focus {
  background: #fff;
  border-color: var(--c-bronze, #a68a6d) !important;
  box-shadow: 0 0 0 3px rgba(166, 138, 109, 0.18);
}

.send-btn {
  all: unset;
  box-sizing: border-box;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--c-obsidian, #0b0b0b);
  color: #fff;
  border: 1.5px solid var(--c-bronze, #a68a6d);
  transition: all .18s;
  flex-shrink: 0;
}
.send-btn:hover {
  background: var(--c-bronze, #a68a6d);
  transform: translateY(-1px);
}
.send-btn:disabled {
  opacity: 0.4 !important;
  cursor: not-allowed !important;
  transform: none !important;
  background: var(--c-obsidian, #0b0b0b) !important;
}

/* ---- STATUT (fermé, sous le trigger) ---- */
.chatbot-status-bar {
  display: flex;
  align-items: center;
  gap: .3rem;
  margin-top: .65rem;
  justify-content: flex-end;
}
.chatbot-status-bar__label {
  font-size: .68rem;
  color: var(--ink-on-light-65, #5a5a5a);
  font-weight: 600;
  letter-spacing: .02em;
}
.chatbot-status-bar__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16,185,129,0.25);
}

/* =========================================================
   BREAKPOINTS RESPONSIVE
   ========================================================= */
/* TABLETTE */
@media (max-width: 992px) {
  .chatbot-widget {
    bottom: 18px !important;
    right:  18px !important;
  }
  .chatbot-panel {
    width:      min(380px, calc(100vw - 36px));
    height:     min(580px, calc(100vh - 110px));
    min-height: 480px;
  }
  .chatbot-tooltip-badge     { display: none; }
  .chatbot-status-bar__label { display: none; }
  .chatbot-trigger-btn       { width: 58px; height: 58px; }
  .chatbot-header            { padding: 0.9rem 1rem; }
  .chatbot-body              { padding: 0.95rem; gap: 0.9rem; }
  .chatbot-footer            { padding: 0.75rem 0.85rem 0.9rem 0.85rem; }
  .chat-msg--bot-inner  > *,
  .chat-msg--user-inner > *  { max-width: 88%; }
}

/* MOBILE */
@media (max-width: 640px) {
  .chatbot-widget {
    left:   12px !important;
    right:  12px !important;
    bottom: 12px !important;
  }
  .chatbot-panel {
    width: 100% !important;
    max-width: none;
    height: 78vh !important;
    min-height: 0;
  }
  .chatbot-trigger-wrapper { justify-content: flex-end; }
  .chatbot-trigger-btn     { width: 56px; height: 56px; }
  .chatbot-body            { padding: 0.85rem 0.75rem; gap: 0.8rem; }
  .chatbot-header          { padding: 0.85rem 0.9rem; }
  .chatbot-header h4       { font-size: 0.95rem; }
  .chatbot-footer          { padding: 0.7rem 0.75rem 0.85rem 0.75rem; }
  .chat-msg--bot-inner  > *,
  .chat-msg--user-inner > *  { max-width: 84%; }
}
  `],
})
class ChatbotPortalComponent {
  @ViewChild('scrollContainer') scrollContainer?: ElementRef;

  isOpen   = signal(false);
  isTyping = signal(false);
  inputText = '';
  messages = signal<ChatMessage[]>([]);

  toggle: () => void = () => {};
  handleSend: (_e: Event) => void = () => {};
  sendQuickQuery: (_t: string) => void = () => {};
}


/**
 * Point d'entrée PUBLIC du chatbot.
 *
 * Rôle minimal :
 *   - DÉCLARER l'état (signals, inputText, messages)
 *   - CRÉER un portail (`ChatbotPortalComponent`) DIRRECTEMENT SOUS <body>
 *   - SYNCHRONISER cet état vers/du portail
 *
 * De cette façon, le `<app-chatbot>` est invisible, et la vraie UI
 * n'a AUCUN ancêtre CSS. C'est anti-fuite-à-la-CSS par principe.
 */
@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule],
  template: `<ng-container></ng-container>`,
  styles: [
    `:host {
       display: none !important;
       position: static !important;
       overflow: visible !important;
       contain: none !important;
       transform: none !important;
       filter: none !important;
       pointer-events: none !important;
     }`
  ],
  exportAs: 'chatbot',
})
export class ChatbotComponent implements AfterViewChecked, OnInit, OnDestroy {
  /**
   * Référence interne sur le vrai état.
   * Signals dupliqués entre le wrapper (<app-chatbot>) et le portail
   * (ChatbotPortalComponent, sous <body>). La source de vérité reste
   * les Signals de cette classe.
   */
  readonly isOpen   = signal(false);
  readonly isTyping = signal(false);
  inputText         = '';
  readonly messages = signal<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Amahoro! 👋 Je suis **InzuBot**, votre assistant virtuel intelligent pour l\'immobilier au Burundi.<br><br>Comment puis-je vous aider aujourd\'hui ?',
      time: this.getNowTime(),
    },
  ]);

  private portalRef: ComponentRef<ChatbotPortalComponent> | null = null;
  private readonly isBrowser: boolean;
  private readonly syncCleanupFn: Array<() => void> = [];

  constructor(
    private readonly http: HttpClient,
    @Inject(PLATFORM_ID) platformId: object,
    private readonly appRef: ApplicationRef,
    private readonly environmentInjector: EnvironmentInjector,
    private readonly injector: Injector,
    private readonly renderer2: Renderer2,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // ──────────────────────────────────────────────────────────────
  //  CYCLE DE VIE
  // ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.mountPortal();
  }

  ngOnDestroy(): void {
    this.syncCleanupFn.forEach(fn => { try { fn(); } catch { /* noop */ } });
    this.syncCleanupFn.length = 0;
    this.unmountPortal();
  }

  ngAfterViewChecked(): void {
    // Redirige le scrollToBottom vers le portail actif
    const portalContainer = this.portalRef?.instance.scrollContainer;
    if (!portalContainer) return;
    const el = portalContainer.nativeElement as HTMLElement | undefined;
    if (el && el.scrollHeight > 0) {
      try { el.scrollTop = el.scrollHeight; } catch { /* noop */ }
    }
  }

  // ──────────────────────────────────────────────────────────────
  //  PORTAL (gestion du sous-<body>)
  // ──────────────────────────────────────────────────────────────

  private mountPortal(): void {
    if (this.portalRef) return;

    const portalRef = createComponent(ChatbotPortalComponent, {
      environmentInjector: this.environmentInjector,
      elementInjector: this.injector,
    });
    this.appRef.attachView(portalRef.hostView);

    const rootNodes = (portalRef.hostView as unknown as { rootNodes: unknown[] }).rootNodes;
    const domElem = rootNodes[0] as HTMLElement;

    // Bouclier: neutraliser toute prop CSS qui casserait fixed par la suite
    const neutralize = new Map<string, string>([
      ['position',       'static'],
      ['transform',      'none'],
      ['filter',         'none'],
      ['perspective',    'none'],
      ['contain',        ''],
      ['clip-path',      'none'],
      ['overflow',       'visible'],
      ['margin',         '0'],
      ['padding',        '0'],
      ['will-change',    ''],
      ['backdrop-filter','none'],
      ['display',        'block'],
    ]);
    neutralize.forEach((v, p) => this.renderer2.setStyle(domElem, p, v));
    this.renderer2.setAttribute(domElem, 'data-inzu-chatbot-portal', '1');

    document.body.appendChild(domElem);

    // Bouclier 2e couche : forcer EN JAVASCRIPT les styles de .chatbot-widget
    // (1er enfant direct du portail) en position fixed bottom right z-index MAX.
    // Même si ViewEncapsulation.None était cassé par un autre CSS global,
    // ce style inline override tout.
    try {
      const widget = domElem.querySelector<HTMLElement>(':scope > .chatbot-widget');
      if (widget) {
        const forceStyles = new Map<string, string>([
          ['position',       'fixed'],
          ['bottom',         '24px'],
          ['right',          '24px'],
          ['top',            'auto'],
          ['left',           'auto'],
          ['width',          'auto'],
          ['maxWidth',       'calc(100vw - 24px)'],
          ['zIndex',         '2147483647'],
          ['transform',      'none'],
          ['filter',         'none'],
          ['perspective',    'none'],
          ['backdropFilter', 'none'],
          ['clipPath',       'none'],
          ['display',        'block'],
          ['pointerEvents',  'none'],
          ['margin',         '0'],
          ['padding',        '0'],
          ['isolation',      'isolate'],
          ['contain',        'layout style size'],
        ]);
        forceStyles.forEach((v, p) => this.renderer2.setStyle(widget, p, v));

        // ─────────────────────────────────────────────────────────────
        // NUKE-AND-PAVE: on jette le rendu Angular du trigger
        // (évite: SVG robot Angular vide / status bar hors template
        //  / polices emoji non-rendues / flex-direction erronée)
        // ─────────────────────────────────────────────────────────────
        const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Segoe UI Symbol",system-ui,sans-serif';
        widget.innerHTML = '';

        // ---- (A) trigger-wrapper : [texte "Besoin d'aide ?"] ─── [🤖 btn 62x62]
        const wrap = this.renderer2.createElement('div');
        [
          ['display',         'flex'],
          ['flexDirection', 'row'],
          ['flexWrap',      'nowrap'],
          ['alignItems',   'center'],
          ['justifyContent', 'flex-end'],
          ['gap',           '12px'],
          ['marginBottom',   '0'],
          ['padding',       '0'],
          ['pointerEvents', 'none'],
          ['lineHeight',    '1'],
        ].forEach(([p,v]) => this.renderer2.setStyle(wrap, p, v));
        this.renderer2.addClass(wrap, 'chatbot-trigger-wrapper');
        this.renderer2.appendChild(widget, wrap);

        //  (A.1) Tooltip Badge "Besoin d'aide ? 🤖" ─────────────────
        const badge = this.renderer2.createElement('div');
        [
          ['display',          'inline-flex'],
          ['alignItems',       'center'],
          ['gap',              '8px'],
          ['padding',          '10px 16px'],
          ['borderRadius',   '999px'],
          ['background',     '#0b0b0b'],
          ['color',          '#F3E7D6'],
          ['border',         '1.5px solid #a68a6d'],
          ['fontFamily',     "'Playfair Display', Georgia, serif"],
          ['fontSize',       '0.85rem'],
          ['fontWeight',     '700'],
          ['boxShadow',      '0 6px 22px rgba(0,0,0,0.28)'],
          ['whiteSpace',     'nowrap'],
          ['cursor',         'default'],
          ['userSelect',     'none'],
          ['animation',      'chatbotPulse 2.4s infinite ease-in-out'],
        ].forEach(([p,v]) => this.renderer2.setStyle(badge, p, v));
        const badgeLabel = this.renderer2.createElement('span');
        this.renderer2.setProperty(badgeLabel, 'textContent', "Besoin d'aide ?");
        const badgeRobot = this.renderer2.createElement('span');
        this.renderer2.setProperty(badgeRobot, 'textContent', '🤖');
        [
          ['fontFamily', EMOJI_FONT],
          ['fontSize',   '1rem'],
          ['lineHeight', '1'],
          ['display',    'inline-block'],
        ].forEach(([p,v]) => this.renderer2.setStyle(badgeRobot, p, v));
        this.renderer2.appendChild(badge, badgeLabel);
        this.renderer2.appendChild(badge, badgeRobot);
        this.renderer2.appendChild(wrap, badge);

        //  (A.2) Bouton trigger ROND 62x62 ─────────────────────────
        const trigger = this.renderer2.createElement('button');
        this.renderer2.setAttribute(trigger, 'type', 'button');
        this.renderer2.setAttribute(trigger, 'aria-label', "Ouvrir l'assistant InzuBot");
        [
          ['display',          'inline-flex'],
          ['alignItems',       'center'],
          ['justifyContent',   'center'],
          ['width',            '62px'],
          ['height',           '62px'],
          ['borderRadius',     '50%'],
          ['border',           '2.5px solid #a68a6d'],
          ['background',       'linear-gradient(135deg,#0b0b0b 0%,#2B2B2B 100%)'],
          ['color',            '#fff'],
          ['cursor',           'pointer'],
          ['position',         'relative'],
          ['boxShadow',        '0 12px 32px rgba(11,11,11,0.38),inset 0 0 0 1px rgba(255,255,255,0.06)'],
          ['flexShrink',       '0'],
          ['transition',       'transform 0.25s cubic-bezier(0.16,1,0.3,1),background 0.25s,box-shadow 0.25s'],
          ['pointerEvents',    'auto'],
          ['padding',          '0'],
          ['margin',           '0'],
          ['font',             'inherit'],
          ['zIndex',           '2147483647'],
          ['outline',          'none'],
        ].forEach(([p,v]) => this.renderer2.setStyle(trigger, p, v));
        // hover/active styles inline via events micro-attach
        const enter = () => {
          Object.assign(trigger.style, {
            transform: 'scale(1.06)',
            background: '#a68a6d',
            borderColor: '#0b0b0b',
            boxShadow: '0 14px 36px rgba(166,138,109,0.45)'
          });
        };
        const leave = () => {
          Object.assign(trigger.style, {
            transform: 'scale(1)',
            background: 'linear-gradient(135deg,#0b0b0b 0%,#2B2B2B 100%)',
            borderColor: '#a68a6d',
            boxShadow: '0 12px 32px rgba(11,11,11,0.38),inset 0 0 0 1px rgba(255,255,255,0.06)'
          });
        };
        const down = () => trigger.style.transform = 'scale(0.97)';
        trigger.addEventListener('mouseenter', enter);
        trigger.addEventListener('mouseleave', leave);
        trigger.addEventListener('mousedown', down);
        trigger.addEventListener('mouseup', leave);

        //  (A.2.1) Emoji robot FORCÉ police emoji couleur (Windows Chrome ok)
        const robot = this.renderer2.createElement('span');
        this.renderer2.setProperty(robot, 'textContent', '🤖');
        [
          ['fontFamily', EMOJI_FONT],
          ['fontSize',   '34px'],
          ['fontWeight', '400'],
          ['lineHeight', '1'],
          ['display',    'inline-block'],
          ['userSelect', 'none'],
          ['textAlign', 'center'],
          ['color',     '#fff'],
        ].forEach(([p,v]) => this.renderer2.setStyle(robot, p, v));
        this.renderer2.appendChild(trigger, robot);

        //  (A.2.2) Online dot (vert)
        const dot = this.renderer2.createElement('span');
        [
          ['position',     'absolute'],
          ['top',          '4px'],
          ['right',        '4px'],
          ['width',        '13px'],
          ['height',       '13px'],
          ['borderRadius', '50%'],
          ['background',   '#10b981'],
          ['border',       '2.5px solid #0b0b0b'],
          ['boxShadow',    '0 0 0 2px rgba(16,185,129,0.35)'],
          ['pointerEvents', 'none'],
        ].forEach(([p,v]) => this.renderer2.setStyle(dot, p, v));
        this.renderer2.appendChild(trigger, dot);
        this.renderer2.appendChild(wrap, trigger);

        // on re-bind click → toggle()
        trigger.addEventListener('click', () => {
          const s = this.isOpen;
          s.set(!s());
        });

        // ---- (B) Chat PANEL (ajouté dans le widget, masqué par défaut)
        const panel = this.renderer2.createElement('div');
        this.renderer2.addClass(panel, 'chatbot-panel');
        [
          ['marginTop',      '14px'],
          ['width',        'min(430px, calc(100vw - 48px))'],
          ['maxWidth',     'calc(100vw - 48px)'],
          ['height',       'min(640px, calc(100vh - 120px))'],
          ['minHeight',    '520px'],
          ['background',   '#ffffff'],
          ['border',       '2px solid #a68a6d'],
          ['borderRadius', '22px'],
          ['boxShadow',    '0 28px 80px rgba(11,11,11,0.38),inset 0 0 0 1px rgba(255,255,255,0.06)'],
          ['display',      'none'],
          ['flexDirection', 'column'],
          ['overflow',     'hidden'],
          ['pointerEvents', 'auto'],
          ['zIndex',       '2147483647'],
        ].forEach(([p,v]) => this.renderer2.setStyle(panel, p, v));
        // Cacher / montrer selon signal
        const syncPanel = () => {
          panel.style.display = this.isOpen() ? 'flex' : 'none';
        };
        syncPanel();
        const cleanup = effect(syncPanel, { manualCleanup: true, injector: this.injector });
        this.syncCleanupFn.push(() => cleanup.destroy());
        this.renderer2.appendChild(widget, panel);
      }
    } catch (e) {
      /* ignore querySelector failure (very unlikely) */
    }

    this.portalRef = portalRef;

    this.bindPortalApi(portalRef.instance);
  }

  private bindPortalApi(p: ChatbotPortalComponent): void {
    // Sync Signaux Wrapper → Portail via `effect()` (Signals Angular 18)
    const makeFx = <S,>(src: () => S, dstSetter: (v: S) => void): void => {
      const cleanup = effect(() => {
        const v = src();
        try { dstSetter(v); } catch { /* noop */ }
      }, { manualCleanup: true, injector: this.injector });
      this.syncCleanupFn.push(() => cleanup.destroy());
    };

    makeFx(() => this.isOpen(),   v => p.isOpen.set(v));
    makeFx(() => this.isTyping(), v => p.isTyping.set(v));
    makeFx(() => this.messages(), v => p.messages.set(v));

    // Bind callbacks Portail → Wrapper
    p.toggle         = () => this.toggle();
    p.handleSend     = (e: Event) => this.handleSend(e);
    p.sendQuickQuery = (t: string) => this.sendQuickQuery(t);

    // inputText : getter/setter transparent
    Object.defineProperty(p, 'inputText', {
      configurable: true,
      enumerable:   true,
      get: () => this.inputText,
      set: (v: string) => { this.inputText = v; },
    });
  }

  private unmountPortal(): void {
    if (!this.portalRef) return;
    try {
      const rootNodes = (this.portalRef.hostView as unknown as { rootNodes: unknown[] }).rootNodes;
      (rootNodes[0] as HTMLElement)?.remove?.();
      this.appRef.detachView(this.portalRef.hostView);
      this.portalRef.destroy();
    } finally {
      this.portalRef = null;
    }
  }

  // ──────────────────────────────────────────────────────────────
  //  API PUBLIQUE
  // ──────────────────────────────────────────────────────────────

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  scrollToBottom(): void {
    this.ngAfterViewChecked();
  }

  getNowTime(): string {
    try {
      return new Date().toLocaleTimeString(undefined, {
        hour:   '2-digit',
        minute: '2-digit',
      });
    } catch {
      const d = new Date();
      return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }
  }

  sendQuickQuery(queryText: string): void {
    this.inputText = queryText;
    // submit artificiel — réutilise handleSend pour rester DRY
    const fakeEvent = new Event('submit', { bubbles: true, cancelable: true });
    this.handleSend(fakeEvent);
  }

  handleSend(e: Event): void {
    e.preventDefault?.();
    const text = (this.inputText ?? '').trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id:   Date.now().toString(),
      sender: 'user',
      text:   this.escapeHtml(text),
      time:   this.getNowTime(),
    };
    this.messages.update(msgs => [...msgs, userMsg]);
    this.inputText = '';
    this.isTyping.set(true);

    const payload = { question: text, topK: 5 };
    this.http.post<any>(this.ragUrl('/rag/ask'), payload, { withCredentials: false })
      .subscribe({
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
            const srcs = res.sources
              .slice(0, 3)
              .map((s: any) => (s?.title ?? s?.source ?? '').toString().trim())
              .filter(Boolean);
            if (srcs.length) {
              answerText +=
                `<br><br><small style="opacity:.7">📚 Sources : ${srcs.join(' · ')}</small>`;
            }
          }
          this.pushBot(answerText);
        },
        error: (err: unknown) => {
          this.isTyping.set(false);
          let fallback = this.generateBotResponse(text);
          if (err instanceof HttpErrorResponse) {
            if (err.status === 429) {
              fallback =
                '⏳ <strong>Trop de requêtes envoyées.</strong><br>Merci de patienter une minute avant de renouveler votre demande. Pendant ce temps, explorez nos annonces : <a style="color:var(--c-bronze-dark);font-weight:700" href="/biens">Tous les biens</a>';
            } else if (err.status === 403 || err.status === 401) {
              fallback = '🔒 <strong>Session en cours de rétablissement.</strong><br>' + fallback;
            } else if (err.status >= 500) {
              fallback = '⚠️ <strong>Service IA indisponible.</strong><br>' + fallback;
            }
          }
          this.pushBot(fallback);
        },
      });
  }

  // ──────────────────────────────────────────────────────────────
  //  HELPERS
  // ──────────────────────────────────────────────────────────────

  private pushBot(text: string): void {
    const botMsg: ChatMessage = {
      id:   (Date.now() + 1).toString(),
      sender: 'bot',
      text,
      time:   this.getNowTime(),
    };
    this.messages.update(msgs => [...msgs, botMsg]);
  }

  private ragUrl(path: string): string {
    const base = (environment as { apiBaseUrl?: string }).apiBaseUrl?.replace(/\/$/, '') ?? '';
    const safe = path.startsWith('/') ? path : '/' + path;
    return `${base}/api/ai${safe}`;
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Réponse locale de secours quand le RAG n'est pas disponible.
   * Donne 4 pistes utiles (recherche / villes / hôte premium / support).
   */
  private generateBotResponse(user: string): string {
    const q = user.toLowerCase();
    const parts: string[] = [];

    if (q.includes('prix') || q.includes('cher') || q.includes('coût')) {
      parts.push('💸 Les prix varient fortement selon le quartier : de **100 000 BIF/nuit** (partagé, banlieues) à **750 000+ BIF/nuit** (villa premium, Rohero/Kigobe).');
    }
    if (q.includes('bujumbura') || q.includes('ville') || q.includes('quartier')) {
      parts.push('📍 À **Bujumbura** les quartiers les plus sûrs et proches des commodités sont <strong>Rohero</strong>, <strong>Kigobe</strong>, <strong>Kinindo</strong>, <strong>Mutanga-Nord</strong>.');
    }
    if (q.includes('groupe') || q.includes('électro') || q.includes('citerne') || q.includes('eau')) {
      parts.push('⚡ **Groupe & Citerne** : utilisez le filtre <em>Avancé</em> sur la page d\'accueil pour ne conserver que les annonces vérifiées <strong>Équipements premium</strong>.');
    }
    if (q.includes('badge') || q.includes('premium') || q.includes('kyc') || q.includes('vérifié')) {
      parts.push('🛡️ Pour obtenir le **Badge PREMIUM Hôte** : réalisez votre KYC (pièce + selfie) dans votre Tableau de bord, section <em>Sécurité</em>.');
    }
    if (q.includes('aéroport') || q.includes('navette') || q.includes('transfer')) {
      parts.push('✈️ **Transfert Aéroport** : disponible en option lors de la réservation (ajout de ~35 USD / trajet depuis BJM).');
    }

    if (parts.length === 0) {
      parts.push('🏠 Merci pour votre question ! Je vais vous orienter :');
      parts.push(`• 🔍 <a href="/biens"><strong>Rechercher un bien</strong></a> (filtres ville / prix / chambres)`);
      parts.push(`• 🏘️ Consulter les <strong>Offres vérifiées</strong> en page d'accueil`);
      parts.push(`• 💬 Contacter un support humain : <strong>support@inzuconnect.bi</strong>`);
    }

    return parts.join('<br>');
  }
}
