import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ChatMessage {
  sender: string;
  text: string;
  isMe: boolean;
  time: string;
}

@Component({
  selector: 'app-chat-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-drawer-overlay animate-fade-in" (click)="closeDrawer()">
      <div class="chat-drawer-card" (click)="$event.stopPropagation()">
        <div class="chat-header">
          <div class="host-status">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" class="avatar" />
            <div>
              <strong>Jean-Claude Niyonzima</strong>
              <span class="online-indicator">🟢 En ligne (Hôte Bujumbura)</span>
            </div>
          </div>
          <button class="close-btn" (click)="closeDrawer()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="chat-messages-container">
          <div *ngFor="let msg of messages" class="message-bubble" [class.me]="msg.isMe">
            <span class="sender-name">{{ msg.sender }}</span>
            <p>{{ msg.text }}</p>
            <span class="message-time">{{ msg.time }}</span>
          </div>
        </div>
        <div class="chat-input-row">
          <input type="text" [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" placeholder="Écrivez votre message..." class="chat-input" />
          <button class="send-btn" (click)="sendMessage()"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-drawer-overlay {
      position: fixed; inset: 0; background: rgba(15, 10, 28, 0.5); backdrop-filter: blur(4px); z-index: 1100; display: flex; justify-content: flex-end;
    }
    .chat-drawer-card {
      width: 100%; max-width: 420px; height: 100%; background: #FFFFFF; display: flex; flex-direction: column; box-shadow: -10px 0 30px rgba(0,0,0,0.2);
    }
    .chat-header {
      padding: 1rem 1.25rem; border-bottom: 1px solid #F3F4F6; display: flex; align-items: center; justify-content: space-between; background: #F7F4FD;
    }
    .host-status { display: flex; align-items: center; gap: 0.75rem; }
    .avatar { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; }
    .online-indicator { font-size: 0.72rem; color: #10B981; display: block; font-weight: 600; }
    .close-btn { background: transparent; border: none; font-size: 1.2rem; cursor: pointer; color: #6B7280; }
    .chat-messages-container { flex: 1; padding: 1.25rem; overflow-y: auto; display: flex; flex-direction: column; gap: 0.85rem; background: #FAF9FE; }
    .message-bubble { max-width: 80%; background: #FFFFFF; border: 1px solid #E5E7EB; padding: 0.75rem 1rem; border-radius: 16px; border-bottom-left-radius: 4px; align-self: flex-start; }
    .message-bubble.me { background: #36255C; color: #FFFFFF; border-color: #36255C; border-bottom-left-radius: 16px; border-bottom-right-radius: 4px; align-self: flex-end; }
    .sender-name { font-size: 0.7rem; font-weight: 800; opacity: 0.8; display: block; margin-bottom: 0.2rem; }
    .message-time { font-size: 0.65rem; opacity: 0.7; display: block; margin-top: 0.3rem; text-align: right; }
    .chat-input-row { padding: 1rem; border-top: 1px solid #F3F4F6; display: flex; gap: 0.65rem; background: #FFFFFF; }
    .chat-input { flex: 1; border: 1px solid #D2C3F6; padding: 0.65rem 1rem; border-radius: 9999px; outline: none; font-size: 0.88rem; width: 100%; }
    .send-btn { width: 40px; height: 40px; border-radius: 50%; background: #36255C; color: #FFFFFF; border: none; cursor: pointer; }
    @media (max-width: 767px) {
      .chat-drawer-overlay {
        padding: 0;
      }
      .chat-drawer-card {
        width: 100vw !important;
        max-width: 100vw;
        height: 100vh;
        height: 100dvh;
        top: 0 !important;
        left: 0 !important;
        border-radius: 0 !important;
        padding: 0;
        overflow-y: auto;
      }
      .close-btn {
        min-height: 44px;
        min-width: 44px;
      }
      .chat-messages-container {
        padding: 1rem;
      }
      .chat-input-row {
        padding: 1rem;
      }
      .chat-input {
        min-height: 44px;
        width: 100%;
      }
      .send-btn {
        min-height: 44px;
        min-width: 44px;
      }
      .message-bubble {
        max-width: 90%;
      }
      .host-status strong {
        font-size: 0.9rem;
      }
    }
    @media (min-width: 768px) {
      .chat-drawer-card {
        max-width: 90vw;
      }
    }
  `]
})
export class ChatDrawerComponent {
  @Output() close = new EventEmitter<void>();
  newMessage = '';
  messages: ChatMessage[] = [
    { sender: 'Jean-Claude (Hôte)', text: 'Amahoro ! Bienvenue au Burundi. N\'hésitez pas si vous avez des questions sur la villa.', isMe: false, time: '14:30' },
    { sender: 'Vous', text: 'Bonjour Jean-Claude ! Est-ce que le logement dispose bien d\'un groupe électrogène en cas de coupure REGIDESO ?', isMe: true, time: '14:32' },
    { sender: 'Jean-Claude (Hôte)', text: 'Oui tout à fait ! Un groupe automatique + citerne d\'eau de 5000L sont installés.', isMe: false, time: '14:34' }
  ];
  closeDrawer() {
    this.close.emit();
  }
  sendMessage() {
    if (this.newMessage.trim()) {
      this.messages.push({
        sender: 'Vous',
        text: this.newMessage,
        isMe: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      this.newMessage = '';
    }
  }
}
