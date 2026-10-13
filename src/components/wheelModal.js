// عجلة الحظ التراثية (Wheel of Fortune Canvas Component)

import { sounds } from "../audio/audioEngine.js";
import { store } from "../state/store.js";

export class WheelModal {
  constructor(confettiEngine) {
    this.confetti = confettiEngine;
    this.backdrop = document.getElementById("wheel-modal-backdrop");
    this.canvas = document.getElementById("wheel-canvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.spinBtn = document.getElementById("wheel-spin-btn");
    this.closeBtn = document.getElementById("wheel-close-btn");
    this.wheelResultText = document.getElementById("wheel-result-text");

    this.slices = [
      { text: "🪙 50 ذهب", type: "coins", value: 50, color: "#d97706" },
      { text: "💎 1 جوهرة", type: "gems", value: 1, color: "#0d9488" },
      { text: "🪙 100 ذهب", type: "coins", value: 100, color: "#b45309" },
      { text: "⭐ 2 نجوم", type: "stars", value: 2, color: "#f59e0b" },
      { text: "🪙 150 ذهب", type: "coins", value: 150, color: "#ca8a04" },
      { text: "💎 3 جواهر!", type: "gems", value: 3, color: "#06b6d4" },
      { text: "🪙 80 ذهب", type: "coins", value: 80, color: "#ea580c" },
      { text: "🪙 250 ذهب!", type: "coins", value: 250, color: "#e11d48" }
    ];

    this.currentRotation = 0;
    this.isSpinning = false;

    this.initEvents();
    this.draw();
  }

  initEvents() {
    if (this.spinBtn) {
      this.spinBtn.addEventListener("click", () => this.spin());
    }
    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => this.hide());
    }
    if (this.backdrop) {
      this.backdrop.addEventListener("click", (e) => {
        if (e.target === this.backdrop && !this.isSpinning) this.hide();
      });
    }
  }

  show() {
    if (this.backdrop) {
      this.backdrop.classList.add("active");
      this.updateSpinButtonState();
      this.draw();
    }
  }

  hide() {
    if (this.backdrop && !this.isSpinning) {
      this.backdrop.classList.remove("active");
    }
  }

  updateSpinButtonState() {
    if (!this.spinBtn) return;
    const now = Date.now();
    const lastSpin = store.getState().lastWheelSpin || 0;
    const hoursSince = (now - lastSpin) / (1000 * 60 * 60);

    if (hoursSince >= 24) {
      this.spinBtn.innerHTML = `<span>تدوير مجاني! 🎡</span>`;
      this.spinBtn.disabled = false;
      this.isFreeSpin = true;
    } else {
      this.spinBtn.innerHTML = `<span>تدوير إضافي (🪙 40 ذهب)</span>`;
      this.spinBtn.disabled = store.getState().coins < 40;
      this.isFreeSpin = false;
    }
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    const numSlices = this.slices.length;
    const arc = (2 * Math.PI) / numSlices;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const radius = cx - 10;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(this.currentRotation);

    for (let i = 0; i < numSlices; i++) {
      const angle = i * arc;
      this.ctx.beginPath();
      this.ctx.fillStyle = this.slices[i].color;
      this.ctx.moveTo(0, 0);
      this.ctx.arc(0, 0, radius, angle, angle + arc);
      this.ctx.lineTo(0, 0);
      this.ctx.fill();

      // حدود شرقية ذهبية خفيفة بين القطاعات
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // نص الجائزة
      this.ctx.save();
      this.ctx.rotate(angle + arc / 2);
      this.ctx.textAlign = "right";
      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "bold 13px 'Tajawal', sans-serif";
      this.ctx.shadowColor = "rgba(0,0,0,0.8)";
      this.ctx.shadowBlur = 4;
      this.ctx.fillText(this.slices[i].text, radius - 20, 5);
      this.ctx.restore();
    }

    this.ctx.restore();
  }

  spin() {
    if (this.isSpinning) return;

    if (!this.isFreeSpin) {
      if (!store.spendCoins(40)) {
        alert("لا تملك رصيداً كافياً من الذهب (40 قطعة)");
        return;
      }
    }

    this.isSpinning = true;
    this.spinBtn.disabled = true;
    if (this.wheelResultText) this.wheelResultText.textContent = "العجلة تدور...";

    const extraSpins = 5 + Math.random() * 4;
    const targetSliceIdx = Math.floor(Math.random() * this.slices.length);
    const sliceAngle = (2 * Math.PI) / this.slices.length;
    // السهم في الأعلى (زاوية -PI/2)
    const targetAngle = (2 * Math.PI * extraSpins) + (targetSliceIdx * sliceAngle);

    const startTime = performance.now();
    const duration = 4000;
    const startRotation = this.currentRotation;
    let lastTickAngle = startRotation;

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / duration);
      // تسارع ثم تباطؤ منحني سلس (easeOutCubic)
      const ease = 1 - Math.pow(1 - progress, 3);
      this.currentRotation = startRotation + targetAngle * ease;

      // صوت التكة كلما مر قطاع
      if (Math.abs(this.currentRotation - lastTickAngle) > sliceAngle * 0.7) {
        sounds.playWheelTick();
        lastTickAngle = this.currentRotation;
      }

      this.draw();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.finishSpin(targetSliceIdx);
      }
    };

    requestAnimationFrame(animate);
  }

  finishSpin(sliceIndex) {
    this.isSpinning = false;
    const state = store.getState();
    state.lastWheelSpin = Date.now();
    state.stats.wheelSpins = (state.stats.wheelSpins || 0) + 1;
    store.saveState();

    // حساب الجائزة عند السهم (أعلى العجلة)
    const numSlices = this.slices.length;
    const arc = (2 * Math.PI) / numSlices;
    const normalized = (this.currentRotation % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI);
    // السهم في الأعلى (3*PI/2)
    const winningIdx = Math.floor(((2 * Math.PI - (normalized - (3 * Math.PI / 2))) % (2 * Math.PI)) / arc) % numSlices;
    const prize = this.slices[winningIdx];

    if (prize.type === "coins") {
      store.addCoins(prize.value);
    } else if (prize.type === "gems") {
      store.addGems(prize.value);
    } else if (prize.type === "stars") {
      state.totalStars = (state.totalStars || 0) + prize.value;
      store.saveState();
    }

    sounds.playCoin();
    if (this.confetti) this.confetti.burst(60);

    if (this.wheelResultText) {
      this.wheelResultText.innerHTML = `🎉 مبروك! فزت بـ: <strong style="color:var(--text-gold)">${prize.text}</strong>`;
    }

    this.updateSpinButtonState();
  }
}
