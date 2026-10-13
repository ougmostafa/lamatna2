// نافذة المكافأة اليومية والتحدي اليومي المتجدد

import { DAILY_REWARDS_DATA, DAILY_CHALLENGES } from "../data/daily.js";
import { store } from "../state/store.js";
import { sounds } from "../audio/audioEngine.js";

export class DailyModal {
  constructor(confettiEngine) {
    this.confetti = confettiEngine;
    this.backdrop = document.getElementById("daily-modal-backdrop");
    this.grid = document.getElementById("daily-rewards-grid");
    this.claimBtn = document.getElementById("daily-claim-btn");
    this.closeBtn = document.getElementById("daily-close-btn");
    this.challengeBox = document.getElementById("daily-challenge-box");

    this.initEvents();
  }

  initEvents() {
    if (this.claimBtn) {
      this.claimBtn.addEventListener("click", () => this.claim());
    }
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
    const loginStatus = store.checkDailyLogin();
    this.renderGrid(loginStatus);
    this.renderChallenge();
    this.backdrop.classList.add("active");
  }

  hide() {
    if (this.backdrop) {
      this.backdrop.classList.remove("active");
    }
  }

  renderGrid(status) {
    if (!this.grid) return;
    this.grid.innerHTML = "";
    const currentStreak = status.streak;
    const canClaim = status.canClaim;

    DAILY_REWARDS_DATA.forEach((item) => {
      const card = document.createElement("div");
      card.className = "daily-day-card";

      if (item.day < currentStreak || (item.day === currentStreak && !canClaim)) {
        card.classList.add("claimed");
      } else if (item.day === currentStreak && canClaim) {
        card.classList.add("active");
      }

      card.innerHTML = `
        <span class="day-label">اليوم ${item.day}</span>
        <span class="day-icon">${item.icon}</span>
        <span class="day-reward-text">🪙 ${item.coins} ${item.gems ? `+ 💎${item.gems}` : ""}</span>
      `;
      this.grid.appendChild(card);
    });

    if (this.claimBtn) {
      if (canClaim) {
        const todayReward = DAILY_REWARDS_DATA[currentStreak - 1] || DAILY_REWARDS_DATA[0];
        this.claimBtn.textContent = `المطالبة بمكافأة اليوم ${currentStreak} (${todayReward.coins} ذهب)`;
        this.claimBtn.disabled = false;
      } else {
        this.claimBtn.textContent = "تم استلام مكافأة اليوم! عد غداً للمزيد";
        this.claimBtn.disabled = true;
      }
    }
  }

  renderChallenge() {
    if (!this.challengeBox) return;
    const challenge = DAILY_CHALLENGES[0];
    this.challengeBox.innerHTML = `
      <div style="background:rgba(217,119,6,0.15); border:1px solid var(--border-gold); padding:12px; border-radius:var(--radius-md); text-align:right;">
        <div style="font-weight:700; color:var(--text-gold); font-size:0.85rem; margin-bottom:4px;">🎯 تحدي اليوم التراثي</div>
        <div style="font-size:0.88rem; color:#fff; margin-bottom:8px;">${challenge.question}</div>
        <div style="font-size:0.75rem; color:#94a3b8;">المكافأة: 🪙 ${challenge.rewardCoins} قطعة ذهبية + 💎 ${challenge.rewardGems} جواهر</div>
      </div>
    `;
  }

  claim() {
    const status = store.checkDailyLogin();
    if (!status.canClaim) return;

    const streak = status.streak;
    const reward = DAILY_REWARDS_DATA[streak - 1] || DAILY_REWARDS_DATA[0];

    store.claimDailyReward(reward.coins, reward.gems);
    sounds.playCoin();
    if (this.confetti) this.confetti.burst(60);

    this.renderGrid({ streak, canClaim: false });
  }
}
