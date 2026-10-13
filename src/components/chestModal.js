// صندوق الهدايا والمفاجآت التراثية (Gift Chest Modal)

import { store } from "../state/store.js";
import { sounds } from "../audio/audioEngine.js";

export class ChestModal {
  constructor(confettiEngine) {
    this.confetti = confettiEngine;
    this.backdrop = document.getElementById("chest-modal-backdrop");
    this.openBtn = document.getElementById("chest-open-btn");
    this.closeBtn = document.getElementById("chest-close-btn");
    this.chestIcon = document.getElementById("chest-modal-icon");
    this.chestStatusText = document.getElementById("chest-status-text");

    this.initEvents();
  }

  initEvents() {
    if (this.openBtn) {
      this.openBtn.addEventListener("click", () => this.open());
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
    this.updateState();
    this.backdrop.classList.add("active");
  }

  hide() {
    if (this.backdrop) {
      this.backdrop.classList.remove("active");
    }
  }

  updateState() {
    const state = store.getState();
    const canOpen = store.canOpenChest();
    const starsProgress = (state.chestStars || 0) % 10;

    if (this.chestIcon) {
      this.chestIcon.textContent = canOpen ? "🎁" : "🔒";
    }

    if (this.chestStatusText) {
      if (canOpen) {
        this.chestStatusText.innerHTML = `
          <span style="color:#34d399; font-weight:700;">جاهز للفتح الآن! 🌟</span><br>
          لديك رصيد كافٍ من النجوم المكتسبة لفتح هذا الصندوق.
        `;
      } else {
        this.chestStatusText.innerHTML = `
          <span>تقدم النجوم: <strong>${starsProgress} / 10 ⭐</strong></span><br>
          <span style="color:var(--text-muted); font-size:0.8rem;">اجمع ${10 - starsProgress} نجوم إضافية من المراحل لفتح صندوق جديد!</span>
        `;
      }
    }

    if (this.openBtn) {
      this.openBtn.disabled = !canOpen;
      this.openBtn.textContent = canOpen ? "فتح صندوق الكنز! ✨" : "الصندوق مقفل";
    }
  }

  open() {
    if (!store.openChest()) return;

    sounds.playWilayaUnlocked();
    if (this.confetti) this.confetti.burst(70);

    const bonusCoins = 120 + Math.floor(Math.random() * 100);
    const bonusGems = 2 + Math.floor(Math.random() * 3);

    store.addCoins(bonusCoins);
    store.addGems(bonusGems);

    if (this.chestIcon) {
      this.chestIcon.textContent = "✨👑✨";
    }

    if (this.chestStatusText) {
      this.chestStatusText.innerHTML = `
        <span style="color:var(--text-gold); font-size:1.1rem; font-weight:800;">مبروك! كنز تراثي عظيم!</span><br>
        حصلت على <strong>🪙 ${bonusCoins} قطعة ذهبية</strong> و <strong>💎 ${bonusGems} جواهر</strong>!
      `;
    }

    if (this.openBtn) {
      this.openBtn.disabled = true;
      this.openBtn.textContent = "تم استلام الكنز!";
    }
  }
}
