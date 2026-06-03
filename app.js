const canvas = document.getElementById("fireworksCanvas");
const ctx = canvas.getContext("2d");
const carCanvas = document.getElementById("porscheCanvas");
const carCtx = carCanvas ? carCanvas.getContext("2d") : null;
const buttons = document.querySelectorAll(".firework-trigger");
const giftButton = document.querySelector(".gift-trigger");
const giftModal = document.getElementById("giftModal");
const giftCloseButtons = giftModal ? giftModal.querySelectorAll("[data-gift-close]") : [];
const wishRain = document.getElementById("wishRain");
const hero = document.querySelector(".hero");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const colors = ["#ffd166", "#ff3f8f", "#58e6ff", "#b6ff5b", "#a575ff", "#ff8f45"];
const wishWords = [
  "С днем рождения!",
  "Много-много денег",
  "Хорошей работы",
  "Здоровья и сил",
  "Фарта каждый день",
  "Друзей рядом",
  "Зарплаты побольше",
  "Спокойных смен",
  "Больших побед",
  "Красивой жизни",
  "Планов без провалов",
  "Деревня ждет",
  "Настроения на максимум",
  "Пусть все получится",
  "Праздник продолжается"
];

let width = 0;
let height = 0;
let dpr = 1;
let particles = [];
let lastAmbient = 0;
let carWidth = 0;
let carHeight = 0;
let heroScrollTicking = false;
let lastScrollY = window.scrollY;
let lastMoneySpawn = 0;
let audioContext = null;

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (carCanvas && carCtx) {
    const rect = carCanvas.getBoundingClientRect();
    carWidth = Math.max(rect.width, 1);
    carHeight = Math.max(rect.height, 1);
    carCanvas.width = Math.floor(carWidth * dpr);
    carCanvas.height = Math.floor(carHeight * dpr);
    carCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function playPing() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  try {
    audioContext = audioContext || new AudioContextClass();

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const now = audioContext.currentTime;
    const mainOscillator = audioContext.createOscillator();
    const shineOscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    mainOscillator.type = "sine";
    shineOscillator.type = "triangle";
    mainOscillator.frequency.setValueAtTime(740, now);
    mainOscillator.frequency.exponentialRampToValueAtTime(1180, now + 0.12);
    shineOscillator.frequency.setValueAtTime(1480, now);
    shineOscillator.frequency.exponentialRampToValueAtTime(1920, now + 0.1);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    mainOscillator.connect(gain);
    shineOscillator.connect(gain);
    gain.connect(audioContext.destination);

    mainOscillator.start(now);
    shineOscillator.start(now + 0.01);
    mainOscillator.stop(now + 0.26);
    shineOscillator.stop(now + 0.2);
  } catch (error) {
    // Browsers may block audio in unusual modes; the visual celebration still works.
  }
}

function burst(x, y, count = 90, power = 1) {
  for (let index = 0; index < count; index += 1) {
    const angle = random(0, Math.PI * 2);
    const speed = random(1.8, 7.4) * power;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: random(1.5, 3.9),
      color: pick(colors),
      life: random(46, 96),
      maxLife: 96,
      gravity: random(0.026, 0.062),
      drag: random(0.966, 0.986)
    });
  }
}

function safePoint(x, y) {
  return {
    x: Math.min(Math.max(x, 96), width - 96),
    y: Math.min(Math.max(y, 84), height - 64)
  };
}

function showWish(x, y, text, delay = 0) {
  window.setTimeout(() => {
    const point = safePoint(x, y);
    const wish = document.createElement("span");
    wish.className = "floating-wish";
    wish.textContent = text;
    wish.style.left = `${point.x}px`;
    wish.style.top = `${point.y}px`;
    wishRain.appendChild(wish);
    window.setTimeout(() => wish.remove(), 1650);
  }, delay);
}

function dropConfetti(x, y, amount = 48) {
  for (let index = 0; index < amount; index += 1) {
    window.setTimeout(() => {
      const piece = document.createElement("span");
      piece.className = "confetti";
      piece.style.left = `${x + random(-40, 40)}px`;
      piece.style.top = `${y + random(-20, 20)}px`;
      piece.style.setProperty("--color", pick(colors));
      piece.style.setProperty("--dx", `${random(-220, 220)}px`);
      piece.style.setProperty("--dy", `${random(180, 520)}px`);
      piece.style.setProperty("--turn", `${random(-80, 80)}deg`);
      piece.style.setProperty("--spin", `${random(240, 920)}deg`);
      piece.style.setProperty("--duration", `${random(1200, 2200)}ms`);
      document.body.appendChild(piece);
      window.setTimeout(() => piece.remove(), 2300);
    }, index * 12);
  }
}

function launchCelebration(sourceElement) {
  playPing();

  const rect = sourceElement.getBoundingClientRect();
  const sourceX = rect.left + rect.width / 2;
  const sourceY = rect.top + rect.height / 2;

  burst(sourceX, sourceY, 150, 1.12);
  dropConfetti(sourceX, sourceY, 72);

  if (!reducedMotion.matches) {
    for (let index = 0; index < 10; index += 1) {
      window.setTimeout(() => {
        burst(
          random(width * 0.12, width * 0.88),
          random(height * 0.12, height * 0.62),
          82,
          random(0.82, 1.28)
        );
      }, index * 105);
    }
  }

  for (let index = 0; index < 24; index += 1) {
    const x = random(width * 0.16, width * 0.84);
    const y = random(height * 0.16, height * 0.68);
    showWish(x, y, pick(wishWords), index * 58);
  }
}

function spawnScrollMoney() {
  const note = document.createElement("span");
  note.className = "scroll-money-note";
  note.textContent = pick(["₽", "22", "₽₽"]);
  note.style.left = `${random(width * 0.08, width * 0.92)}px`;
  note.style.top = `${random(height * 0.12, height * 0.58)}px`;
  note.style.setProperty("--dx", `${random(-180, 180)}px`);
  note.style.setProperty("--dy", `${random(-260, -120)}px`);
  note.style.setProperty("--start-rotate", `${random(-18, 18)}deg`);
  note.style.setProperty("--spin", `${random(-460, 460)}deg`);
  document.body.appendChild(note);
  window.setTimeout(() => note.remove(), 1200);
}

function spawnGiftMoney() {
  const note = document.createElement("span");
  note.className = "scroll-money-note gift-money-note";
  note.textContent = pick(["₽", "22", "₽₽", "ПОДАРОК"]);
  note.style.left = `${random(width * 0.1, width * 0.9)}px`;
  note.style.top = `${random(18, 118)}px`;
  note.style.setProperty("--dx", `${random(-210, 210)}px`);
  note.style.setProperty("--dy", `${random(220, 540)}px`);
  note.style.setProperty("--start-rotate", `${random(-22, 22)}deg`);
  note.style.setProperty("--spin", `${random(-560, 560)}deg`);
  (giftModal || document.body).appendChild(note);
  window.setTimeout(() => note.remove(), 1800);
}

function spawnGiftSpark() {
  const spark = document.createElement("span");
  spark.className = "gift-spark-burst";
  spark.style.left = `${random(width * 0.12, width * 0.88)}px`;
  spark.style.top = `${random(48, height * 0.36)}px`;
  spark.style.setProperty("--color", pick(colors));
  (giftModal || document.body).appendChild(spark);
  window.setTimeout(() => spark.remove(), 950);
}

function launchGiftShow(sourceElement) {
  playPing();

  const rect = sourceElement.getBoundingClientRect();
  const sourceX = rect.left + rect.width / 2;
  const sourceY = rect.top + rect.height / 2;

  burst(sourceX, sourceY, 130, 1.08);
  dropConfetti(sourceX, sourceY, 54);
  showWish(width / 2, Math.max(90, height * 0.18), "Заявка принята", 140);

  for (let index = 0; index < 8; index += 1) {
    window.setTimeout(() => {
      burst(random(width * 0.14, width * 0.86), random(58, height * 0.34), 84, random(0.82, 1.22));
      spawnGiftSpark();
    }, index * 110);
  }

  for (let index = 0; index < 34; index += 1) {
    window.setTimeout(spawnGiftMoney, index * 34);
  }
}

function openGiftModal(sourceElement) {
  if (!giftModal) {
    return;
  }

  giftModal.hidden = false;
  document.body.classList.add("modal-open");
  window.requestAnimationFrame(() => {
    giftModal.classList.add("is-open");
  });

  launchGiftShow(sourceElement);

  const closeButton = giftModal.querySelector(".gift-close");
  window.setTimeout(() => closeButton?.focus(), 120);
}

function closeGiftModal() {
  if (!giftModal || giftModal.hidden) {
    return;
  }

  giftModal.classList.remove("is-open");
  document.body.classList.remove("modal-open");
  window.setTimeout(() => {
    if (!giftModal.classList.contains("is-open")) {
      giftModal.hidden = true;
    }
  }, 240);
}

function updateHeroMoney() {
  if (!hero) {
    return;
  }

  const travel = Math.max(window.innerHeight * 0.86, 1);
  const progress = Math.min(Math.max(window.scrollY / travel, 0), 1);
  const eased = 1 - Math.pow(1 - progress, 2);
  const heroLift = -120 * eased;
  const heroScale = 1 - 0.05 * eased;
  const heroFade = 1 - 0.48 * eased;
  const topbarFade = 1 - 0.3 * eased;
  const moneyOpacity = reducedMotion.matches ? 0 : Math.min(progress * 1.4, 1);
  const scrollDelta = window.scrollY - lastScrollY;
  const now = performance.now();

  if (scrollDelta > 5 && progress < 1 && now - lastMoneySpawn > 85 && !reducedMotion.matches) {
    spawnScrollMoney();
    lastMoneySpawn = now;
  }

  lastScrollY = window.scrollY;

  hero.style.setProperty("--hero-lift", `${heroLift.toFixed(1)}px`);
  hero.style.setProperty("--hero-scale", heroScale.toFixed(3));
  hero.style.setProperty("--hero-fade", heroFade.toFixed(3));
  hero.style.setProperty("--topbar-fade", topbarFade.toFixed(3));
  hero.style.setProperty("--money-opacity", moneyOpacity.toFixed(3));
}

function queueHeroMoneyUpdate() {
  if (heroScrollTicking) {
    return;
  }

  heroScrollTicking = true;
  requestAnimationFrame(() => {
    updateHeroMoney();
    heroScrollTicking = false;
  });
}

function draw911(time = 0) {
  if (!carCtx || !carCanvas) {
    return;
  }

  const spin = time * 0.00062;
  const side = Math.cos(spin);
  const depth = Math.sin(spin);
  const sideAmount = Math.abs(side);
  const scaleX = 0.32 + sideAmount * 0.68;
  const facing = side >= 0 ? 1 : -1;
  const centerX = carWidth / 2;
  const centerY = carHeight * 0.56;
  const glow = 0.36 + sideAmount * 0.34;

  carCtx.clearRect(0, 0, carWidth, carHeight);

  const floorGradient = carCtx.createRadialGradient(centerX, centerY + 92, 10, centerX, centerY + 92, carWidth * 0.44);
  floorGradient.addColorStop(0, `rgba(88, 230, 255, ${0.22 + glow * 0.18})`);
  floorGradient.addColorStop(0.36, "rgba(255, 63, 143, 0.13)");
  floorGradient.addColorStop(1, "rgba(255, 209, 102, 0)");
  carCtx.fillStyle = floorGradient;
  carCtx.beginPath();
  carCtx.ellipse(centerX, centerY + 96, carWidth * 0.34, 38, 0, 0, Math.PI * 2);
  carCtx.fill();

  carCtx.save();
  carCtx.translate(centerX, centerY);
  carCtx.scale(scaleX * facing, 1);

  const bodyGradient = carCtx.createLinearGradient(-300, -95, 300, 80);
  bodyGradient.addColorStop(0, "#7a091f");
  bodyGradient.addColorStop(0.18, "#ff2e62");
  bodyGradient.addColorStop(0.5, "#ff7a35");
  bodyGradient.addColorStop(0.78, "#ff3f8f");
  bodyGradient.addColorStop(1, "#5c1029");

  carCtx.shadowColor = "rgba(255, 63, 143, 0.36)";
  carCtx.shadowBlur = 28;
  carCtx.fillStyle = bodyGradient;
  carCtx.beginPath();
  carCtx.moveTo(-292, 35);
  carCtx.bezierCurveTo(-270, -18, -215, -48, -150, -48);
  carCtx.bezierCurveTo(-112, -96, -22, -112, 72, -50);
  carCtx.bezierCurveTo(150, -48, 236, -22, 285, 17);
  carCtx.quadraticCurveTo(300, 40, 260, 53);
  carCtx.lineTo(-248, 53);
  carCtx.quadraticCurveTo(-306, 50, -292, 35);
  carCtx.closePath();
  carCtx.fill();
  carCtx.shadowBlur = 0;

  carCtx.fillStyle = "rgba(255, 255, 255, 0.14)";
  carCtx.beginPath();
  carCtx.moveTo(-128, -45);
  carCtx.bezierCurveTo(-88, -92, -18, -94, 54, -48);
  carCtx.lineTo(25, -22);
  carCtx.lineTo(-126, -22);
  carCtx.closePath();
  carCtx.fill();

  carCtx.strokeStyle = "rgba(255, 255, 255, 0.38)";
  carCtx.lineWidth = 3;
  carCtx.beginPath();
  carCtx.moveTo(-122, -23);
  carCtx.lineTo(20, -23);
  carCtx.stroke();

  carCtx.strokeStyle = "rgba(255, 248, 239, 0.5)";
  carCtx.lineWidth = 4;
  carCtx.beginPath();
  carCtx.moveTo(-214, -14);
  carCtx.bezierCurveTo(-122, -44, 92, -42, 218, -6);
  carCtx.stroke();

  carCtx.fillStyle = "#11131d";
  carCtx.beginPath();
  carCtx.ellipse(-174, 54, 48, 48, 0, 0, Math.PI * 2);
  carCtx.ellipse(178, 54, 48, 48, 0, 0, Math.PI * 2);
  carCtx.fill();

  carCtx.fillStyle = "#f2f6ff";
  carCtx.beginPath();
  carCtx.ellipse(-174, 54, 20, 20, 0, 0, Math.PI * 2);
  carCtx.ellipse(178, 54, 20, 20, 0, 0, Math.PI * 2);
  carCtx.fill();

  carCtx.strokeStyle = "rgba(88, 230, 255, 0.5)";
  carCtx.lineWidth = 3;
  carCtx.beginPath();
  carCtx.ellipse(-174, 54, 33, 33, 0, 0, Math.PI * 2);
  carCtx.ellipse(178, 54, 33, 33, 0, 0, Math.PI * 2);
  carCtx.stroke();

  carCtx.fillStyle = "rgba(255, 241, 173, 0.96)";
  carCtx.beginPath();
  carCtx.ellipse(270, 20, 18, 10, 0, 0, Math.PI * 2);
  carCtx.fill();

  carCtx.fillStyle = "rgba(255, 63, 143, 0.95)";
  carCtx.beginPath();
  carCtx.ellipse(-268, 26, 16, 9, 0, 0, Math.PI * 2);
  carCtx.fill();

  carCtx.restore();

  if (sideAmount < 0.42) {
    carCtx.save();
    carCtx.translate(centerX, centerY + 8);
    carCtx.scale(1 + sideAmount * 0.18, 1);
    carCtx.fillStyle = depth > 0 ? "#ff3f8f" : "#ff8f45";
    carCtx.shadowColor = depth > 0 ? "rgba(255, 63, 143, 0.55)" : "rgba(255, 143, 69, 0.5)";
    carCtx.shadowBlur = 24;
    carCtx.beginPath();
    carCtx.roundRect(-78, -56, 156, 120, 42);
    carCtx.fill();
    carCtx.shadowBlur = 0;

    carCtx.fillStyle = "rgba(255, 255, 255, 0.18)";
    carCtx.beginPath();
    carCtx.roundRect(-48, -42, 96, 44, 20);
    carCtx.fill();

    carCtx.fillStyle = "rgba(255, 241, 173, 0.95)";
    carCtx.beginPath();
    carCtx.ellipse(-44, 18, 14, 10, 0, 0, Math.PI * 2);
    carCtx.ellipse(44, 18, 14, 10, 0, 0, Math.PI * 2);
    carCtx.fill();
    carCtx.restore();
  }
}

function render(time = 0) {
  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";
  draw911(time);

  particles = particles.filter((particle) => particle.life > 0);

  for (const particle of particles) {
    const alpha = Math.max(particle.life / particle.maxLife, 0);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = alpha;
    ctx.fill();

    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vx *= particle.drag;
    particle.vy = particle.vy * particle.drag + particle.gravity;
    particle.life -= 1;
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  if (time - lastAmbient > 2800 && !reducedMotion.matches) {
    burst(random(width * 0.12, width * 0.88), random(height * 0.08, height * 0.42), 42, 0.68);
    lastAmbient = time;
  }

  requestAnimationFrame(render);
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -8% 0px"
  }
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

buttons.forEach((button) => {
  button.addEventListener("click", () => launchCelebration(button));
});

giftButton?.addEventListener("click", () => openGiftModal(giftButton));

giftCloseButtons.forEach((button) => {
  button.addEventListener("click", closeGiftModal);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeGiftModal();
  }
});

window.addEventListener("resize", resizeCanvas);
window.addEventListener("scroll", queueHeroMoneyUpdate, { passive: true });

resizeCanvas();
updateHeroMoney();
requestAnimationFrame(render);

window.setTimeout(() => {
  burst(width * 0.22, height * 0.22, 66, 0.75);
  burst(width * 0.76, height * 0.26, 74, 0.82);
}, 360);
