// نقطة انطلاق تطبيق ولعبة كنوز الجزائر (Main App Entry)

import { store } from "./state/store.js";
import { sounds } from "./audio/audioEngine.js";
import { WILAYAS_DATA } from "./data/wilayas.js";
import { ConfettiEngine } from "./components/confetti.js";
import { FactModal } from "./components/factModal.js";
import { WheelModal } from "./components/wheelModal.js";
import { DailyModal } from "./components/dailyModal.js";
import { AchievementsModal } from "./components/achievementsModal.js";
import { LeaderboardModal } from "./components/leaderboardModal.js";
import { StatsModal } from "./components/statsModal.js";
import { ChestModal } from "./components/chestModal.js";
import { MapView } from "./components/mapView.js";
import { GameView } from "./components/gameView.js";

document.addEventListener("DOMContentLoaded", () => {
  // تهيئة المؤثرات
  const confetti = new ConfettiEngine("confetti-canvas");

  // تهيئة النوافذ المنبثقة
  const wheelModal = new WheelModal(confetti);
  const dailyModal = new DailyModal(confetti);
  const achievementsModal = new AchievementsModal(confetti);
  const leaderboardModal = new LeaderboardModal();
  const statsModal = new StatsModal();
  const chestModal = new ChestModal(confetti);

  let gameView = null;
  let mapView = null;

  // التنقل بين الشاشات
  const switchView = (viewName) => {
    document.querySelectorAll(".view-section").forEach((sec) => sec.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));

    const targetSection = document.getElementById(`view-${viewName}`);
    const targetNav = document.querySelector(`.nav-item[data-view="${viewName}"]`);

    if (targetSection) targetSection.classList.add("active");
    if (targetNav) targetNav.classList.add("active");

    if (viewName === "map" && mapView) {
      mapView.render();
    }
  };

  // معالجات بطاقة "هل تعلم؟"
  const factModal = new FactModal(
    confetti,
    () => {
      // المرحلة التالية
      if (gameView) gameView.nextStage();
    },
    () => {
      // العودة للخريطة
      switchView("map");
    }
  );

  // تهيئة شاشة اللعبة
  gameView = new GameView(factModal, () => switchView("map"));

  // تهيئة شاشة الخريطة
  mapView = new MapView((selectedWilaya) => {
    store.getState().currentWilayaId = selectedWilaya.id;
    store.saveState();
    gameView.loadWilaya(selectedWilaya);
    switchView("game");
  });

  // تحديث عدادات الاقتصاد والرأس العلوي
  const updateHeaderUI = (state) => {
    const coinsEl = document.getElementById("header-coins-val");
    const gemsEl = document.getElementById("header-gems-val");
    const starsEl = document.getElementById("header-stars-val");
    const playerNameEl = document.getElementById("header-player-name");
    const soundBtn = document.getElementById("header-sound-btn");

    if (coinsEl) coinsEl.textContent = state.coins;
    if (gemsEl) gemsEl.textContent = state.gems;
    if (starsEl) starsEl.textContent = state.totalStars;
    if (playerNameEl) playerNameEl.textContent = state.playerName;

    if (soundBtn) {
      soundBtn.textContent = state.settings.soundEnabled ? "🔊" : "🔇";
    }
  };

  store.subscribe(updateHeaderUI);
  updateHeaderUI(store.getState());

  // أحداث الشريط السفلي
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.getAttribute("data-view");
      sounds.playLetterClick();

      if (view === "wheel") {
        wheelModal.show();
      } else if (view === "achievements") {
        achievementsModal.show();
      } else if (view === "stats") {
        statsModal.show();
      } else if (view === "game") {
        // إذا لم تكن هناك ولاية محملة، حمّل ولاية أدرار (أو الحالية)
        const currentWilaya = WILAYAS_DATA.find((w) => w.id === store.getState().currentWilayaId) || WILAYAS_DATA[0];
        gameView.loadWilaya(currentWilaya);
        switchView("game");
      } else {
        switchView(view);
      }
    });
  });

  // أزرار الرأس العلوي
  const avatarBtn = document.getElementById("header-avatar-btn");
  if (avatarBtn) {
    avatarBtn.addEventListener("click", () => {
      sounds.playLetterClick();
      statsModal.show();
    });
  }

  const soundBtn = document.getElementById("header-sound-btn");
  if (soundBtn) {
    soundBtn.addEventListener("click", () => {
      const state = store.getState();
      state.settings.soundEnabled = !state.settings.soundEnabled;
      sounds.setMuted(!state.settings.soundEnabled);
      if (state.settings.soundEnabled) {
        sounds.playLetterClick();
      }
      store.saveState();
    });
  }

  const musicBtn = document.getElementById("header-music-btn");
  if (musicBtn) {
    musicBtn.addEventListener("click", () => {
      const isPlaying = sounds.toggleMusic();
      musicBtn.style.color = isPlaying ? "var(--c-gold)" : "var(--text-muted)";
      musicBtn.textContent = isPlaying ? "🎵" : "🎼";
    });
  }

  // بطاقات الوصول السريع في الخريطة
  const quickChest = document.getElementById("quick-chest-btn");
  if (quickChest) {
    quickChest.addEventListener("click", () => {
      sounds.playLetterClick();
      chestModal.show();
    });
  }

  const quickDaily = document.getElementById("quick-daily-btn");
  if (quickDaily) {
    quickDaily.addEventListener("click", () => {
      sounds.playLetterClick();
      dailyModal.show();
    });
  }

  const quickLeaderboard = document.getElementById("quick-leaderboard-btn");
  if (quickLeaderboard) {
    quickLeaderboard.addEventListener("click", () => {
      sounds.playLetterClick();
      leaderboardModal.show();
    });
  }

  // عرض الخريطة أولاً
  mapView.render();
  switchView("map");

  // فحص المكافأة اليومية عند بدء اللعبة
  setTimeout(() => {
    const login = store.checkDailyLogin();
    if (login.canClaim) {
      dailyModal.show();
    }
  }, 1000);
});
