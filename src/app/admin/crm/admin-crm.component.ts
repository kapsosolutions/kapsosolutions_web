import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminApiService, Chat, ChatMessage, OutboundDescriptor, MediaInfo } from '../admin-api.service';
import { CrmSocketService } from '../crm-socket.service';
import { TemplateCreateComponent } from '../templates/template-create.component';
import { phoneToFlag } from '../country-flag';

interface TemplateComponent {
  type: string;
  text?: string;
  format?: string;
  buttons?: { type: string; text: string }[];
}
interface TemplateItem {
  name: string;
  status?: string;
  language?: string;
  category?: string;
  headerMediaUrl?: string;
  components?: TemplateComponent[];
}

@Component({
  selector: 'app-admin-crm',
  imports: [DatePipe, FormsModule, TemplateCreateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="crm">
      <!-- Chat list -->
      <aside class="chats">
        <div class="chats-head"><h2>Chats</h2></div>
        <div class="chats-list">
          @if (chats().length === 0) {
            <div class="empty">No conversations yet.</div>
          }
          @for (c of chats(); track c.phone) {
            <button class="chat-item" [class.active]="c.phone === activePhone()" (click)="openChat(c.phone)">
              <div class="avatar">{{ initials(c.name || c.phone) }}</div>
              <div class="ci-main">
                <div class="ci-top">
                  <span class="ci-name">{{ c.name || ('+' + c.phone) }}</span>
                  <span class="ci-time">{{ c.lastInboundAt | date: 'HH:mm' }}</span>
                </div>
                <div class="ci-bottom">
                  <span class="ci-preview">{{ c.lastMessageBody }}</span>
                  @if (c.unread > 0) { <span class="badge">{{ c.unread }}</span> }
                </div>
              </div>
            </button>
          }
        </div>
      </aside>

      <!-- Conversation -->
      <section class="thread">
        @if (!activePhone()) {
          <div class="no-chat">
            <span class="material-icons">chat</span>
            <p>Select a conversation to start messaging.</p>
          </div>
        } @else {
          <header class="thread-head">
            <div class="avatar">{{ initials(activeName()) }}</div>
            <div class="th-info">
              <div class="th-name">{{ activeName() }}</div>
              <div class="th-sub"><span class="flag">{{ phoneFlag(activePhone()) }}</span> +{{ activePhone() }}</div>
            </div>
            <div class="timer" [class.warn]="windowDanger()" [class.closed]="!windowOpen()">
              @if (windowOpen()) {
                <span class="material-icons">schedule</span>
                <div class="timer-txt">
                  <span class="timer-val">{{ windowLabel() }}</span>
                  <span class="timer-cap">session left</span>
                </div>
              } @else {
                <span class="material-icons">lock_clock</span>
                <div class="timer-txt">
                  <span class="timer-val">Window closed</span>
                  <span class="timer-cap">use a template</span>
                </div>
              }
            </div>
            <button class="pause-btn" [class.paused]="paused()" (click)="togglePause()" [disabled]="pausing()"
              [title]="paused() ? 'Automation paused — click to resume' : 'Pause automation (chat manually)'">
              @if (paused()) {
                <span class="material-icons">play_arrow</span> <span class="pause-label">Paused</span>
              } @else {
                <span class="material-icons">pause</span> <span class="pause-label">Auto</span>
              }
            </button>
            <button class="del-chat" (click)="confirmDelete.set(true)" title="Delete chat" aria-label="Delete chat">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </header>

          @if (confirmDelete()) {
            <div class="modal-backdrop" (click)="confirmDelete.set(false)">
              <div class="modal" (click)="$event.stopPropagation()">
                <div class="modal-icon"><span class="material-icons">delete_forever</span></div>
                <h3>Delete this chat?</h3>
                <p>This permanently deletes the entire conversation with <strong>{{ activeName() }}</strong>, including all messages and any shared photos, videos, and files. This can't be undone.</p>
                <div class="modal-actions">
                  <button class="k-btn ghost" (click)="confirmDelete.set(false)" [disabled]="deleting()">Cancel</button>
                  <button class="k-btn danger-solid" (click)="deleteChat()" [disabled]="deleting()">
                    {{ deleting() ? 'Deleting…' : 'Delete' }}
                  </button>
                </div>
              </div>
            </div>
          }

          <div class="messages" #msgBox>
            @for (m of messages(); track m._id) {
              <div class="msg" [class.out]="m.direction === 'out'" [class.in]="m.direction === 'in'">
                <div class="msg-col">
                  <div class="bubble">
                    @if (media(m); as md) {
                      @switch (md.type) {
                        @case ('image') {
                          <div class="media-wrap">
                            <img class="bubble-media" [src]="md.url" alt="" loading="lazy" />
                            <a class="dl-btn" [href]="downloadUrl(md.url, md.filename)" title="Download"><span class="material-icons">download</span></a>
                          </div>
                        }
                        @case ('video') {
                          <div class="media-wrap">
                            <video class="bubble-media" [src]="md.url" controls></video>
                            <a class="dl-btn" [href]="downloadUrl(md.url, md.filename)" title="Download"><span class="material-icons">download</span></a>
                          </div>
                        }
                        @case ('audio') {
                          <div class="audio-wrap">
                            <audio class="bubble-audio" [src]="md.url" controls></audio>
                            <a class="dl-btn inline" [href]="downloadUrl(md.url, md.filename)" title="Download"><span class="material-icons">download</span></a>
                          </div>
                        }
                        @default {
                          <a class="doc-card" [href]="downloadUrl(md.url, md.filename)" target="_blank" rel="noopener">
                            <span class="material-icons">insert_drive_file</span>
                            <span class="doc-name">{{ md.filename || 'Document' }}</span>
                            <span class="material-icons">download</span>
                          </a>
                        }
                      }
                      @if (mediaCaption(m)) { <span class="text">{{ mediaCaption(m) }}</span> }
                    } @else if (out(m); as d) {
                      @if (d.headerImageUrl) { <img class="bubble-img" [src]="d.headerImageUrl" alt="" loading="lazy" /> }
                      @if (d.headerText && !d.headerImageUrl) { <div class="bubble-htext">{{ d.headerText }}</div> }
                      @if (d.body) { <span class="text">{{ d.body }}</span> }
                      @if (d.footer) { <div class="bubble-foot">{{ d.footer }}</div> }
                    } @else {
                      <span class="text">{{ m.body }}</span>
                    }
                    <span class="meta">
                      {{ m.createdAt | date: 'HH:mm' }}
                      @if (m.direction === 'out') {
                        <span class="ticks" [class.read]="m.status === 'read'">{{ tick(m.status) }}</span>
                      }
                    </span>
                    @if (m.reaction) { <span class="reaction-chip">{{ m.reaction }}</span> }
                  </div>
                  @if (m.metaMessageId) {
                    <button class="react-btn" (click)="toggleReactPicker(m)" title="React"><span class="material-icons">add_reaction</span></button>
                  }
                  @if (reactingId() === m._id) {
                    <div class="react-backdrop" (click)="closeReactPicker()"></div>
                    @if (!showAllEmojis()) {
                      <div class="react-picker">
                        @for (e of quickEmojis; track e) { <button class="rp-emoji" (click)="react(m, e)">{{ e }}</button> }
                        <button class="rp-emoji rp-more" (click)="showAllEmojis.set(true)" title="More"><span class="material-icons">add</span></button>
                        @if (m.reaction) { <button class="rp-emoji rp-x" (click)="react(m, '')"><span class="material-icons">close</span></button> }
                      </div>
                    } @else {
                      <div class="emoji-grid">
                        @for (e of allEmojis; track e) { <button class="rp-emoji" (click)="react(m, e)">{{ e }}</button> }
                      </div>
                    }
                  }
                  @if (!media(m) && out(m); as d) {
                    @if (hasActions(d)) {
                      <div class="msg-buttons">
                        @for (b of d.buttons || []; track $index) {
                          <span class="msg-btn"><span class="material-icons">{{ btnIcon(b.kind) }}</span> {{ b.text }}</span>
                        }
                        @if (d.cta) {
                          <a class="msg-btn" [href]="d.cta.url" target="_blank" rel="noopener">
                            <span class="material-icons">open_in_new</span> {{ d.cta.text }}
                          </a>
                        }
                      </div>
                    }
                  }
                </div>
              </div>
            }
          </div>

          <footer class="composer">
            @if (!windowOpen()) {
              <div class="closed-note">
                The 24-hour messaging window is closed. Free-text replies will fail — send an approved template instead.
              </div>
            }
            <div class="composer-row">
              <button class="icon-btn" (click)="toggleDrawer()" title="Templates" aria-label="Templates">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="16" rx="2.5"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="7" y1="13" x2="15" y2="13"></line>
                  <line x1="7" y1="16.5" x2="12" y2="16.5"></line>
                </svg>
              </button>
              <button class="icon-btn" (click)="fileInput.click()" title="Attach file" aria-label="Attach file" [disabled]="uploading()">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
              </button>
              <input #fileInput type="file" (change)="onAttach($event)" hidden
                accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt" />
              <input
                class="k-input"
                type="text"
                [placeholder]="uploading() ? 'Uploading…' : 'Type a message…'"
                [(ngModel)]="draft"
                (keyup.enter)="send()"
              />
              <button class="k-btn send" (click)="send()" [disabled]="!draft.trim() || sending()">
                <span class="material-icons">send</span>
              </button>
            </div>
          </footer>

          <!-- Template drawer -->
          @if (drawerOpen()) {
            <div class="drawer-backdrop" (click)="toggleDrawer()"></div>
            <aside class="tmpl-drawer">
              <header class="drawer-head">
                @if (drawerMode() === 'create') {
                  <button class="icon-btn" (click)="drawerMode.set('list')" aria-label="Back"><span class="material-icons">arrow_back</span></button>
                  <h3>New template</h3>
                } @else {
                  <h3>Templates</h3>
                  <button class="icon-btn add-btn" (click)="openCreate()" title="Create template"><span class="material-icons">add</span></button>
                }
                <button class="icon-btn" (click)="toggleDrawer()" aria-label="Close"><span class="material-icons">close</span></button>
              </header>

              <div class="drawer-body">
                @if (drawerMode() === 'create') {
                  <app-template-create (created)="onTemplateCreated()"></app-template-create>
                } @else {
                <section class="drawer-sec">
                  <div class="sec-title">Send a template</div>
                  @if (templates().length === 0) {
                    <p class="muted-note">No templates yet. Tap + to create one.</p>
                  }
                  @for (t of templates(); track t.name) {
                    <div class="tmpl-item">
                      <button class="tmpl-name-btn" (click)="togglePreview(t.name)">
                        <span class="material-icons chev" [class.open]="expandedTemplate() === t.name">chevron_right</span>
                        <span class="tmpl-name">{{ t.name }}</span>
                        <span class="k-chip sm" [class.green]="t.status === 'APPROVED'" [class.amber]="t.status !== 'APPROVED'">{{ t.status || 'PENDING' }}</span>
                      </button>
                      <button class="ic-send" [disabled]="t.status !== 'APPROVED' || tSending()" title="Send template" (click)="sendTemplate(t)">
                        <span class="material-icons">send</span>
                      </button>
                    </div>
                    @if (expandedTemplate() === t.name) {
                      <div class="tmpl-preview">
                        <div class="tp-bubble">
                          @if (headerOf(t); as h) {
                            @if (h.format === 'TEXT' && h.text) { <div class="tp-header">{{ h.text }}</div> }
                            @else if (h.format === 'IMAGE') {
                              @if (t.headerMediaUrl) { <img class="tp-media-img" [src]="t.headerMediaUrl" alt="" /> }
                              @else { <div class="tp-media"><span class="material-icons">image</span></div> }
                            }
                            @else if (h.format === 'VIDEO') {
                              @if (t.headerMediaUrl) { <video class="tp-media-img" [src]="t.headerMediaUrl" controls></video> }
                              @else { <div class="tp-media"><span class="material-icons">videocam</span></div> }
                            }
                          }
                          <div class="tp-body">{{ bodyOf(t) }}</div>
                          @if (footerOf(t); as f) { <div class="tp-footer">{{ f }}</div> }
                        </div>
                        @if (buttonsOf(t).length) {
                          <div class="tp-buttons">
                            @for (b of buttonsOf(t); track $index) {
                              <div class="tp-btn"><span class="material-icons">{{ tmplBtnIcon(b.type) }}</span> {{ b.text }}</div>
                            }
                          </div>
                        }
                      </div>
                    }
                  }
                </section>
                }
              </div>
            </aside>
          }
        }
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; flex: 1; min-height: 0; }
    .crm { display: grid; grid-template-columns: 340px 1fr; gap: 0; height: 100%; min-height: 0; overflow: hidden; background: var(--k-surface); }
    .chats { border-right: 1px solid var(--k-hairline); display: flex; flex-direction: column; min-height: 0; }
    .chats-head { padding: 16px 18px; border-bottom: 1px solid var(--k-hairline); }
    .chats-head h2 { font-size: 18px; }
    .chats-list { overflow-y: auto; flex: 1; }
    .empty { padding: 24px; color: var(--k-ink-muted); font-size: 14px; }
    .chat-item { display: flex; gap: 12px; align-items: center; width: 100%; text-align: left; padding: 12px 16px; background: none; border: none; border-bottom: 1px solid var(--k-hairline); cursor: pointer; }
    .chat-item:hover { background: rgba(255,255,255,.05); }
    .chat-item.active { background: rgba(37,211,102,.14); }
    .avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--k-green); color: #06210f; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
    .ci-main { flex: 1; min-width: 0; }
    .ci-top { display: flex; justify-content: space-between; gap: 8px; }
    .ci-name { font-size: 15px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ci-time { font-size: 11px; color: var(--k-ink-muted); flex-shrink: 0; }
    .ci-bottom { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
    .ci-preview { font-size: 13px; color: var(--k-ink-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .badge { background: var(--k-green); color: #06210f; border-radius: 50%; min-width: 20px; height: 20px; display:flex; align-items:center; justify-content:center; font-size: 11px; padding: 0 6px; }
    .thread { display: flex; flex-direction: column; min-height: 0; height: 100%; }
    .no-chat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--k-ink-muted); gap: 10px; }
    .no-chat .material-icons { font-size: 48px; }
    .thread-head { display: flex; align-items: center; gap: 12px; padding: 10px 18px; border-bottom: 1px solid var(--k-hairline); }
    .th-info { flex: 1; min-width: 0; }
    .th-name { font-size: 16px; font-weight: 600; color: #fff; }
    .th-sub { font-size: 12px; color: var(--k-ink-muted); display: flex; align-items: center; gap: 5px; }
    .th-sub .flag { font-size: 15px; line-height: 1; }
    .timer { display: flex; align-items: center; gap: 8px; padding: 7px 14px; border-radius: 50px; background: rgba(37,211,102,.15); color: #4ade80; border: 1px solid rgba(37,211,102,.4); }
    .timer .material-icons { font-size: 18px; }
    .timer-txt { display: flex; flex-direction: column; line-height: 1.1; }
    .timer-val { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; }
    .timer-cap { font-size: 10px; opacity: .8; text-transform: uppercase; letter-spacing: .4px; }
    .timer.warn { background: rgba(255,107,107,.15); color: #ff6b6b; border-color: rgba(255,107,107,.4); }
    .timer.closed { background: rgba(255,255,255,.06); color: var(--k-ink-muted); border-color: var(--k-hairline); }
    .pause-btn { display: inline-flex; align-items: center; gap: 5px; background: rgba(255,255,255,.06); border: 1px solid var(--k-hairline); cursor: pointer; color: var(--k-ink-muted); padding: 6px 12px; border-radius: 50px; font-size: 12px; flex-shrink: 0; }
    .pause-btn .material-icons { font-size: 16px; }
    .pause-btn:hover { color: var(--k-ink); }
    .pause-btn.paused { background: rgba(245,180,60,.15); border-color: rgba(245,180,60,.5); color: #f5c451; }
    .pause-label { font-weight: 500; }
    .del-chat { background: none; border: none; cursor: pointer; color: var(--k-ink-muted); width: 36px; height: 36px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .del-chat:hover { background: rgba(255,107,107,.12); color: var(--k-danger); }
    /* Delete confirmation modal */
    .modal-backdrop { position: absolute; inset: 0; z-index: 50; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; padding: 24px; }
    .modal { background: var(--k-surface); border: 1px solid var(--k-hairline); border-radius: 18px; padding: 26px; max-width: 400px; width: 100%; text-align: center; }
    .modal-icon { width: 60px; height: 60px; border-radius: 50%; background: rgba(255,107,107,.15); color: var(--k-danger); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
    .modal-icon .material-icons { font-size: 30px; }
    .modal h3 { font-size: 20px; margin-bottom: 8px; }
    .modal p { color: var(--k-ink-muted); font-size: 14px; line-height: 1.5; margin-bottom: 22px; }
    .modal-actions { display: flex; gap: 12px; justify-content: center; }
    .danger-solid { background: var(--k-danger) !important; color: #fff !important; border: 1px solid var(--k-danger) !important; }
    .messages { flex: 1; min-height: 0; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 8px; background: #0b141a; }
    .msg { display: flex; }
    .msg.out { justify-content: flex-end; }
    .msg-col { max-width: 60%; display: flex; flex-direction: column; gap: 4px; position: relative; }
    .bubble { border-radius: 12px; padding: 5px 8px; font-size: 12.5px; line-height: 1.35; position: relative; background: #202c33; color: #e9edef; box-shadow: 0 1px 1px rgba(0,0,0,.2); display: flex; flex-direction: column; margin-bottom: 6px; }
    /* Reaction chip overlapping the bubble's bottom edge (WhatsApp style). */
    .reaction-chip { position: absolute; bottom: -12px; right: 8px; background: #2a3942; border: 1px solid #0b141a; border-radius: 50px; padding: 1px 5px; font-size: 13px; line-height: 1.4; box-shadow: 0 1px 2px rgba(0,0,0,.3); }
    .msg.in .reaction-chip { right: auto; left: 8px; }
    /* React trigger — appears on hover beside the bubble. */
    .react-btn { position: absolute; top: 50%; transform: translateY(-50%); background: var(--k-surface); border: 1px solid var(--k-hairline); color: var(--k-ink-muted); width: 30px; height: 30px; border-radius: 50%; display: none; align-items: center; justify-content: center; cursor: pointer; z-index: 3; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
    .msg.out .react-btn { left: -38px; }
    .msg.in .react-btn { right: -38px; }
    .react-btn .material-icons { font-size: 17px; }
    .msg:hover .react-btn { display: inline-flex; }
    .react-backdrop { position: fixed; inset: 0; z-index: 20; }
    .react-picker { position: absolute; bottom: 50%; margin-bottom: 8px; z-index: 21; display: flex; align-items: center; gap: 2px; background: #233138; border: 1px solid var(--k-hairline); border-radius: 50px; padding: 4px 6px; box-shadow: 0 6px 20px rgba(0,0,0,.45); }
    .msg.out .react-picker { right: 0; }
    .msg.in .react-picker { left: 0; }
    .rp-emoji { background: none; border: none; cursor: pointer; font-size: 20px; padding: 3px 4px; border-radius: 50%; line-height: 1; transition: transform .1s ease; }
    .rp-emoji:hover { background: rgba(127,127,127,.15); transform: scale(1.2); }
    .rp-more, .rp-x { color: var(--k-ink-muted); border: 1px solid var(--k-hairline) !important; width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; }
    .rp-more .material-icons, .rp-x .material-icons { font-size: 16px; }
    .emoji-grid { position: absolute; bottom: 50%; margin-bottom: 8px; z-index: 21; width: 260px; max-height: 220px; overflow-y: auto; display: grid; grid-template-columns: repeat(8, 1fr); gap: 2px; background: #233138; border: 1px solid var(--k-hairline); border-radius: 14px; padding: 8px; box-shadow: 0 8px 28px rgba(0,0,0,.5); }
    .msg.out .emoji-grid { right: 0; }
    .msg.in .emoji-grid { left: 0; }
    /* Media download button overlay. */
    .media-wrap { position: relative; display: inline-block; }
    .dl-btn { position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,.55); color: #fff; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; }
    .dl-btn .material-icons { font-size: 18px; }
    .dl-btn.inline { position: static; background: rgba(255,255,255,.1); color: var(--k-ink); }
    .audio-wrap { display: flex; align-items: center; gap: 8px; }
    .msg.out .bubble { background: #005c4b; }
    .text { white-space: pre-wrap; word-break: break-word; padding: 2px 4px 0; }
    .bubble-img { width: 100%; border-radius: 10px; margin-bottom: 4px; display: block; }
    .bubble-media { width: 100%; max-width: 240px; border-radius: 10px; margin-bottom: 4px; display: block; }
    .bubble-audio { width: 260px; max-width: 100%; margin: 2px 0 4px; }
    .doc-card { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: rgba(255,255,255,.08); border-radius: 10px; margin-bottom: 4px; color: var(--k-ink); text-decoration: none; }
    .doc-card .doc-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
    .doc-card .material-icons { font-size: 20px; color: #53bdeb; }
    .bubble-htext { font-weight: 600; padding: 2px 4px; }
    .bubble-foot { font-size: 12px; color: var(--k-ink-muted); padding: 2px 4px; margin-top: 2px; }
    .meta { display: flex; align-items: center; gap: 4px; justify-content: flex-end; font-size: 10px; color: var(--k-ink-muted); margin-top: 2px; padding: 0 4px; }
    .ticks { font-size: 11px; }
    .ticks.read { color: #34b7f1; }
    /* Buttons render as separate cards below the bubble (WhatsApp style). */
    .msg-buttons { display: flex; flex-direction: column; gap: 4px; }
    .msg-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; font-size: 14px; color: #53bdeb; background: #202c33; border-radius: 10px; box-shadow: 0 1px 1px rgba(0,0,0,.2); text-decoration: none; }
    .msg.out .msg-btn { background: #025144; }
    .msg-btn .material-icons { font-size: 16px; }
    a.msg-btn { cursor: pointer; }
    .thread { position: relative; }
    .composer { border-top: 1px solid var(--k-hairline); padding: 12px 16px; }
    .closed-note { font-size: 12px; color: var(--k-danger); margin-bottom: 8px; }
    .composer-row { display: flex; gap: 10px; align-items: center; }
    .icon-btn { background: none; border: none; cursor: pointer; color: var(--k-ink-muted); display: inline-flex; align-items: center; justify-content: center; padding: 8px; border-radius: 50%; transition: background .15s ease, color .15s ease; }
    .icon-btn:hover { background: rgba(255,255,255,.08); color: var(--k-green); }
    .send { padding: 12px 16px; }
    .send .material-icons { font-size: 18px; }
    /* Template drawer */
    .drawer-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.15); z-index: 8; }
    .tmpl-drawer { position: absolute; top: 0; right: 0; bottom: 0; width: 360px; max-width: 90%; background: var(--k-surface); border-left: 1px solid var(--k-hairline); z-index: 9; display: flex; flex-direction: column; box-shadow: -8px 0 24px rgba(0,0,0,.08); animation: slideInRight .2s ease; }
    @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .drawer-head { display: flex; align-items: center; gap: 8px; padding: 14px 18px; border-bottom: 1px solid var(--k-hairline); }
    .drawer-head h3 { font-size: 17px; flex: 1; }
    .add-btn { background: var(--k-green); color: #06210f; border-radius: 50%; }
    .add-btn:hover { background: var(--k-green); color: #06210f; }
    .drawer-body { overflow-y: auto; padding: 16px 18px; flex: 1; }
    .drawer-sec { margin-bottom: 22px; }
    .sec-title { font-size: 13px; color: var(--k-ink-muted); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 12px; }
    .muted-note { font-size: 13px; color: var(--k-ink-muted); }
    .tmpl-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--k-hairline); }
    .tmpl-name-btn { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; text-align: left; padding: 6px 4px; color: var(--k-ink); }
    .tmpl-name-btn .chev { font-size: 18px; color: var(--k-ink-muted); transition: transform .15s ease; flex-shrink: 0; }
    .tmpl-name-btn .chev.open { transform: rotate(90deg); }
    .tmpl-name { font-size: 14px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .k-chip.sm { padding: 2px 8px; font-size: 10px; }
    .ic-send { flex-shrink: 0; width: 34px; height: 34px; border-radius: 50%; border: none; background: var(--k-green); color: #06210f; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
    .ic-send:disabled { opacity: .45; cursor: not-allowed; background: #2a3942; color: #6b7b85; }
    .ic-send .material-icons { font-size: 16px; }
    .tmpl-preview { background: #0b141a; border-radius: 12px; padding: 12px; margin: 2px 0 12px; }
    .tp-bubble { background: #202c33; border-radius: 8px; padding: 8px 10px; box-shadow: 0 1px 1px rgba(0,0,0,.2); color: #e9edef; }
    .tp-header { font-weight: 700; margin-bottom: 4px; white-space: pre-wrap; }
    .tp-media { height: 110px; border-radius: 8px; background: #2a3942; display: flex; align-items: center; justify-content: center; color: #8696a0; margin-bottom: 6px; }
    .tp-media .material-icons { font-size: 40px; }
    .tp-media-img { width: 100%; max-height: 170px; object-fit: cover; border-radius: 8px; margin-bottom: 6px; display: block; }
    .tp-body { font-size: 13px; white-space: pre-wrap; word-break: break-word; }
    .tp-footer { font-size: 11px; color: #8696a0; margin-top: 4px; }
    .tp-buttons { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
    .tp-btn { background: #202c33; border-radius: 8px; padding: 8px; text-align: center; color: #53bdeb; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 1px 1px rgba(0,0,0,.2); }
    .tp-btn .material-icons { font-size: 15px; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .drawer-body .k-btn { width: 100%; }
    .drawer-body .err { color: var(--k-danger); font-size: 12px; margin-bottom: 8px; }
    .drawer-body .ok { color: #128c7e; font-size: 12px; margin-bottom: 8px; }
    @media (max-width: 800px) {
      .crm { grid-template-columns: 1fr; }
      .chats { display: none; }
      .tmpl-drawer { width: 100%; }
    }
  `]
})
export class AdminCrmComponent implements OnInit, OnDestroy {
  private api = inject(AdminApiService);
  private socket = inject(CrmSocketService);

  chats = signal<Chat[]>([]);
  messages = signal<ChatMessage[]>([]);
  activePhone = signal<string | null>(null);
  activeName = signal<string>('');
  windowOpen = signal(true);
  private windowExpiresAt = signal<number>(0);
  now = signal<number>(Date.now());
  draft = '';
  sending = signal(false);
  uploading = signal(false);
  reactingId = signal<string | null>(null);
  showAllEmojis = signal(false);
  confirmDelete = signal(false);
  deleting = signal(false);
  paused = signal(false);
  pausing = signal(false);
  quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  allEmojis = [
    '👍', '👎', '❤️', '🔥', '🎉', '😂', '😍', '😮', '😢', '😡',
    '🙏', '👏', '💯', '✅', '❌', '⭐', '💡', '🚀', '👌', '🤝',
    '😊', '😅', '😎', '🤔', '😴', '🥳', '😇', '🤩', '😱', '😭',
    '💪', '🙌', '👀', '💰', '📈', '📞', '📧', '🕐', '🎁', '🛒',
    '☕', '🍕', '🎂', '🌟', '⚡', '💎', '🏆', '🎯', '📌', '🔔',
    '❓', '❗', '💬', '📷', '🎥', '📄', '😀', '😉', '🤗', '🫶'
  ];

  // Template drawer state
  drawerOpen = signal(false);
  drawerMode = signal<'list' | 'create'>('list');
  templates = signal<TemplateItem[]>([]);
  tSending = signal(false);
  expandedTemplate = signal<string | null>(null);

  private subs: Subscription[] = [];
  private ticker: ReturnType<typeof setInterval> | null = null;

  windowLabel = computed(() => {
    const ms = Math.max(0, this.windowExpiresAt() - this.now());
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  });

  // Turn the timer red when less than 10 hours remain in the session.
  windowDanger = computed(() => {
    const ms = this.windowExpiresAt() - this.now();
    return ms > 0 && ms < 10 * 3600000;
  });

  private route = inject(ActivatedRoute);
  private initialPhone: string | null = null;

  ngOnInit(): void {
    // Ask for desktop notification permission once.
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } catch { /* ignore */ }

    this.initialPhone = this.route.snapshot.queryParamMap.get('phone');
    this.loadChats();
    // Live inbound/outbound messages.
    this.subs.push(
      this.socket.onMessage().subscribe((m: ChatMessage) => {
        if (m.phone === this.activePhone()) {
          this.messages.update((list) => [...list, m]);
          this.scrollToBottom();
          // The chat is open, so keep it marked read on the server too.
          if (m.direction === 'in') this.api.markRead(m.phone).subscribe({ error: () => {} });
        }
        // Notify + sound on inbound customer messages.
        if (m.direction === 'in') {
          this.playBeep();
          const sender = this.chats().find((c) => c.phone === m.phone)?.name || `+${m.phone}`;
          if (document.hidden || m.phone !== this.activePhone()) {
            this.notify(sender, m.body?.trim() || 'New message');
          }
        }
        this.loadChats();
      })
    );
    // Live delivery/read receipts (ticks).
    this.subs.push(
      this.socket.onStatus().subscribe((u: { metaMessageId: string; status: string }) => {
        this.messages.update((list) =>
          list.map((m) => (m.metaMessageId === u.metaMessageId ? { ...m, status: u.status } : m))
        );
      })
    );
    // Live emoji reactions.
    this.subs.push(
      this.socket.onReaction().subscribe((u: { metaMessageId: string; emoji: string }) => {
        this.messages.update((list) =>
          list.map((m) => (m.metaMessageId === u.metaMessageId ? { ...m, reaction: u.emoji } : m))
        );
      })
    );
    // Tick the 24h countdown every second.
    this.ticker = setInterval(() => {
      this.now.set(Date.now());
      this.windowOpen.set(this.windowExpiresAt() > Date.now());
    }, 1000);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    if (this.ticker) clearInterval(this.ticker);
  }

  private loadChats(): void {
    this.api.getChats().subscribe({
      next: (res: { success: boolean; data: Chat[] }) => {
        // The currently-open chat is being read, so never show a badge for it.
        const active = this.activePhone();
        const data = (res.data || []).map((c) => (c.phone === active ? { ...c, unread: 0 } : c));
        this.chats.set(data);
        // Deep-link from a demo lead: open that chat once the list is loaded.
        if (this.initialPhone) {
          const phone = this.initialPhone;
          this.initialPhone = null;
          this.openChat(phone);
        }
      }
    });
  }

  openChat(phone: string): void {
    this.activePhone.set(phone);
    const chat = this.chats().find((c) => c.phone === phone);
    this.activeName.set(chat?.name || `+${phone}`);
    this.paused.set(!!chat?.botPaused);
    // Clear the unread badge immediately in the list.
    this.chats.update((list) => list.map((c) => (c.phone === phone ? { ...c, unread: 0 } : c)));
    const lastInbound = chat?.lastInboundAt ? new Date(chat.lastInboundAt).getTime() : 0;
    this.windowExpiresAt.set(lastInbound + 24 * 60 * 60 * 1000);
    this.now.set(Date.now());
    this.windowOpen.set(this.windowExpiresAt() > Date.now());
    this.api.getMessages(phone).subscribe({
      next: (res: { success: boolean; data: ChatMessage[] }) => { this.messages.set(res.data || []); this.scrollToBottom(); }
    });
  }

  send(): void {
    const text = this.draft.trim();
    const phone = this.activePhone();
    if (!text || !phone) return;
    this.sending.set(true);
    this.api.sendMessage(phone, text).subscribe({
      next: () => { this.sending.set(false); this.draft = ''; },
      error: (e: HttpErrorResponse) => { this.sending.set(false); alert(e?.error?.message || 'Send failed (24h window may be closed).'); }
    });
  }

  toggleDrawer(): void {
    const next = !this.drawerOpen();
    this.drawerOpen.set(next);
    this.drawerMode.set('list');
    if (next) this.loadTemplates();
  }

  openCreate(): void {
    this.drawerMode.set('create');
  }

  onTemplateCreated(): void {
    this.loadTemplates();
    this.drawerMode.set('list');
  }

  private loadTemplates(): void {
    this.api.getTemplates().subscribe({
      next: (res: { success: boolean; data: unknown[] }) => this.templates.set((res.data as TemplateItem[]) || [])
    });
  }

  sendTemplate(t: TemplateItem): void {
    const phone = this.activePhone();
    if (!phone) return;
    this.tSending.set(true);
    this.api.sendTemplateMessage(phone, t.name, t.language || 'en_US').subscribe({
      next: () => { this.tSending.set(false); this.drawerOpen.set(false); },
      error: (e: HttpErrorResponse) => { this.tSending.set(false); alert(e?.error?.message || 'Template send failed'); }
    });
  }

  bodyOf(t: TemplateItem): string {
    const body = t.components?.find((c) => c.type === 'BODY');
    return body?.text || '';
  }

  headerOf(t: TemplateItem): TemplateComponent | null {
    return t.components?.find((c) => c.type === 'HEADER') ?? null;
  }
  footerOf(t: TemplateItem): string {
    return t.components?.find((c) => c.type === 'FOOTER')?.text || '';
  }
  buttonsOf(t: TemplateItem): { type: string; text: string }[] {
    return t.components?.find((c) => c.type === 'BUTTONS')?.buttons || [];
  }
  tmplBtnIcon(type: string): string {
    return type === 'URL' ? 'open_in_new' : type === 'PHONE_NUMBER' ? 'call' : 'reply';
  }

  togglePreview(name: string): void {
    this.expandedTemplate.update((cur) => (cur === name ? null : name));
  }

  // Rich descriptor for an outbound message (image header, buttons, cta, footer).
  out(m: ChatMessage): OutboundDescriptor | null {
    return m.direction === 'out' && m.raw?.outbound ? m.raw.outbound : null;
  }

  // Media attached to a message (inbound file, or outbound file we sent).
  media(m: ChatMessage): MediaInfo | null {
    const o = this.out(m);
    if (o?.mediaUrl) return { url: o.mediaUrl, type: o.mediaType || 'document', filename: o.filename };
    if (m.raw?.media?.url) return m.raw.media;
    return null;
  }

  phoneFlag(phone: string | null): string {
    return phoneToFlag(phone || '');
  }

  // Short notification beep via the Web Audio API (no asset needed).
  private playBeep(): void {
    try {
      const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
      osc.onended = () => ctx.close();
    } catch { /* audio not available */ }
  }

  private notify(title: string, body: string): void {
    try {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      const n = new Notification(title, { body, icon: 'favicon.png', tag: 'kapso-crm' });
      n.onclick = () => { window.focus(); n.close(); };
    } catch { /* notifications not available */ }
  }

  togglePause(): void {
    const phone = this.activePhone();
    if (!phone) return;
    const next = !this.paused();
    this.pausing.set(true);
    this.api.setPause(phone, next).subscribe({
      next: (res: { success: boolean; botPaused: boolean }) => {
        this.pausing.set(false);
        this.paused.set(res.botPaused);
        this.chats.update((list) => list.map((c) => (c.phone === phone ? { ...c, botPaused: res.botPaused } : c)));
      },
      error: (e: HttpErrorResponse) => { this.pausing.set(false); alert(e?.error?.message || 'Could not update automation state'); }
    });
  }

  deleteChat(): void {
    const phone = this.activePhone();
    if (!phone) return;
    this.deleting.set(true);
    this.api.deleteChat(phone).subscribe({
      next: () => {
        this.deleting.set(false);
        this.confirmDelete.set(false);
        this.chats.update((list) => list.filter((c) => c.phone !== phone));
        this.messages.set([]);
        this.activePhone.set(null);
      },
      error: (e: HttpErrorResponse) => { this.deleting.set(false); alert(e?.error?.message || 'Delete failed'); }
    });
  }

  toggleReactPicker(m: ChatMessage): void {
    this.showAllEmojis.set(false);
    this.reactingId.update((cur) => (cur === m._id ? null : m._id));
  }

  closeReactPicker(): void {
    this.reactingId.set(null);
    this.showAllEmojis.set(false);
  }

  react(m: ChatMessage, emoji: string): void {
    const phone = this.activePhone();
    if (!phone || !m.metaMessageId) { this.closeReactPicker(); return; }
    // A message shows only one reaction — the new one replaces any existing.
    this.messages.update((list) => list.map((x) => (x._id === m._id ? { ...x, reaction: emoji } : x)));
    this.closeReactPicker();
    this.api.reactToMessage(phone, m.metaMessageId, emoji).subscribe({
      error: (e: HttpErrorResponse) => alert(e?.error?.message || 'Reaction failed')
    });
  }

  // Cloudinary download URL (fl_attachment forces download with the filename).
  downloadUrl(url: string, filename?: string): string {
    if (url.includes('/upload/')) {
      const base = (filename || '').replace(/\.[^.]+$/, '');
      const flag = base ? `fl_attachment:${encodeURIComponent(base)}` : 'fl_attachment';
      return url.replace('/upload/', `/upload/${flag}/`);
    }
    return url;
  }

  // Real caption for a media message (hide the auto placeholder labels).
  mediaCaption(m: ChatMessage): string {
    const b = (m.body || '').trim();
    const labels = ['📷 Photo', '🎥 Video', '🎵 Audio', '📄 Document', 'Photo', 'Sticker'];
    return labels.includes(b) ? '' : (m.body || '');
  }

  onAttach(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const phone = this.activePhone();
    if (!file || !phone) return;
    this.uploading.set(true);
    const caption = this.draft.trim();
    this.api.sendMedia(phone, file, caption || undefined).subscribe({
      next: () => { this.uploading.set(false); this.draft = ''; input.value = ''; },
      error: (e: HttpErrorResponse) => { this.uploading.set(false); input.value = ''; alert(e?.error?.message || 'File send failed'); }
    });
  }

  hasActions(d: OutboundDescriptor): boolean {
    return !!(d.buttons && d.buttons.length) || !!d.cta;
  }

  btnIcon(kind: string): string {
    switch (kind) {
      case 'flow': return 'dynamic_form';
      case 'cta': return 'open_in_new';
      case 'call': return 'call';
      case 'list': return 'list';
      case 'location': return 'location_on';
      case 'pay': return 'payment';
      default: return 'reply';
    }
  }

  tick(status: string): string {
    if (status === 'read' || status === 'delivered') return '✓✓';
    if (status === 'failed') return '✕';
    return '✓';
  }

  initials(s: string): string {
    const clean = (s || '').replace('+', '').trim();
    return clean.slice(0, 2).toUpperCase();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const box = document.querySelector('.messages');
      if (box) box.scrollTop = box.scrollHeight;
    }, 60);
  }
}
