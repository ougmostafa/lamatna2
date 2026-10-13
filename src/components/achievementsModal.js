// نافذة الإنجازات والأوسمة التراثية (Achievements Modal)

import { ACHIEVEMENTS_DATA } from "../data/achievements.js";
import { store } from "../state/store.js";
import { sounds } from "../audio/audioEngine.js";

export class AchievementsModal {
  constructor(confettiEngine) {
    this.confetti = confettiEngine;
    this.backdrop = document.getElementById("achievements-modal-backdrop");
    this.listEl = document.getElementById("achievements-list");
    this.closeBtn = document.getElementById("achievements-close-btn");

    this.initEvents();
  }

  initEvents() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => this.hide());
    }
    if (this.backdrop) {
      this.backdrop.addEventListener("click", (e) => {
        if (e.target === this.backdrop) this.hide();
      });
    }
  }

  show() {
    if (!this.backdrop) return;
    this.render();
    this.backdrop.classList.add("active");
  }

  hide() {
    if (this.backdrop) {
      this.backdrop.classList.remove("active");
    }
  }

  render() {
    if (!this.listEl) return;
    this.listEl.innerHTML = "";
    const state = store.getState();
    const claimed = state.claimedAchievements || [];

    ACHIEVEMENTS_DATA.forEach((ach) => {
      const isCompleted = ach.check(state);
      const isClaimed = claimed.includes(ach.id);

      const item = document.createElement("div");
      item.className = "list-item-card";

      item.innerHTML = `
        <div class="item-left">
          <span style="font-size:1.6rem;">${ach.icon}</span>
          <div class="item-texts">
            <span class="item-title">${ach.title}</span>
            <span class="item-desc">${ach.description}</span>
          </div>
        </div>
        <div>
          ${
            isClaimed
              ? `<span style="font-size:0.75rem; color:#10b981; font-weight:700;">✓ مُستلم</span>`
              : isCompleted
              ? `<button class="claim-reward-btn" data-id="${ach.id}">استلام (🪙 ${ach.rewardCoins})</button>`
              : `<span style="font-size:0.75rem; color:#64748b;">قيد الإنجاز</span>`
          }
        </div>
      `;

      this.listEl.appendChild(item);
    });

    // أحداث الاستلام
    this.listEl.querySelectorAll(".claim-reward-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        this.claim(id);
      });
    });
  }

  claim(achId) {
    const state = store.getState();
    const ach = ACHIEVEMENTS_DATA.find((a) => a.id === achId);
    if (!ach) return;

    if (!state.claimedAchievements.includes(achId)) {
      state.claimedAchievements.push(achId);
      store.addCoins(ach.rewardCoins);
      if (ach.rewardGems) store.addGems(ach.rewardGems);
      sounds.playCoin();
      if (this.confetti) this.confetti.burst(50);
      this.render();
    }
  }
}
