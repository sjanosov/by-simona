const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const TILE_PATTERN = [
  "L.a..L...LL.a..L",
  "LL..b.La....L.cL",
  "a.G..LL.....b..L",
  "..L.c..LL.a...GL",
  "L..LGG...L..b.LL"
].join("");

const TILE_FLIP = { ".": "L", L: ".", G: "L", a: "G", b: "G", c: "L" };

const TILE_CLASS = {
  ".": "is-dark",
  L: "is-accent",
  G: "is-stone",
  a: "is-glow-tl",
  b: "is-glow-br",
  c: "is-glow-r"
};

const DITHER_CELL = 3;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
  (value) => (value + 0.5) / 16
);

const year = document.querySelector("[data-year]");
if (year) year.textContent = String(new Date().getFullYear());

const hero = document.querySelector("[data-hero]");

const portrait = document.querySelector("[data-portrait]");
if (portrait && !reduceMotion) {
  portrait.addEventListener("mousemove", (event) => {
    const box = portrait.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    portrait.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 16}deg)`;
  });
  portrait.addEventListener("mouseleave", () => {
    portrait.style.transform = "";
  });
}

const tiles = document.querySelector("[data-tiles]");
if (tiles) {
  const timers = new Map();
  const batch = document.createDocumentFragment();
  TILE_PATTERN.split("").forEach((kind, index) => {
    const tile = document.createElement("div");
    tile.className = `tile ${TILE_CLASS[kind]}`;
    const hot = document.createElement("div");
    hot.className = `tile-hot ${TILE_CLASS[TILE_FLIP[kind]]}`;
    tile.append(hot);
    if (!reduceMotion) {
      tile.addEventListener("mouseenter", () => {
        window.clearTimeout(timers.get(index));
        hot.classList.add("is-hot");
        timers.set(
          index,
          window.setTimeout(
            () => hot.classList.remove("is-hot"),
            900 + Math.random() * 500
          )
        );
      });
    }
    batch.append(tile);
  });
  tiles.append(batch);
}

const grain = document.querySelector("[data-grain]");
if (grain) {
  const drawGrain = () => {
    if (!grain.clientWidth) return;
    grain.width = grain.clientWidth;
    grain.height = grain.clientHeight;
    const context = grain.getContext("2d");
    const image = context.createImageData(grain.width, grain.height);
    const data = image.data;
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255;
    }
    context.putImageData(image, 0, 0);
  };
  drawGrain();
  window.addEventListener("resize", drawGrain);
}

document.querySelectorAll(".tilt").forEach((card) => {
  card.addEventListener("mousemove", (event) => {
    if (reduceMotion) return;
    const box = card.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    card.classList.add("is-live");
    card.style.transform = `rotateY(${(x - 0.5) * 18}deg) rotateX(${(0.5 - y) * 14}deg)`;
    card.style.setProperty("--gx", `${x * 100}%`);
    card.style.setProperty("--gy", `${y * 100}%`);
  });
  card.addEventListener("mouseleave", () => {
    card.classList.remove("is-live");
    card.style.transform = "";
  });
});

const dither = document.querySelector("[data-dither]");
if (dither) {
  const footer = dither.closest(".footer");
  let context = null;
  let image = null;
  let frame = 0;
  let time = 0;
  let raf = null;
  let visible = true;
  let hovering = false;
  let pointer = null;

  const draw = () => {
    if (!image) return;
    const data = image.data;
    const width = image.width;
    const height = image.height;
    const falloff = 2 * 30 * 30;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let near = 0;
        if (pointer) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          near = Math.exp(-(dx * dx + dy * dy) / falloff);
        }
        const nx = x * 0.03;
        const ny = y * 0.03;
        const wx = nx + 1.3 * Math.sin(ny * 1.2 + time * 0.45) + near * 1.2;
        const wy = ny + 1.3 * Math.sin(nx * 1.1 - time * 0.35) - near * 0.8;
        const wave =
          Math.sin(wx * 1.6 + Math.sin(wy * 2 + time * 0.3)) *
          Math.cos(wy * 1.3 - time * 0.2);
        const ridge = 1 - Math.abs(wave);
        const level = Math.pow(ridge, 2.4) * 0.9 + near * 0.6;
        const i = (y * width + x) * 4;
        data[i] = 69;
        data[i + 1] = 67;
        data[i + 2] = 62;
        data[i + 3] = level > BAYER[((y & 3) << 2) | (x & 3)] ? 255 : 0;
      }
    }
    context.putImageData(image, 0, 0);
  };

  const tick = (stamp) => {
    raf = null;
    time = stamp / 1000;
    frame += 1;
    if (frame % 2 === 0) draw();
    if (visible && hovering && !reduceMotion) raf = requestAnimationFrame(tick);
  };

  const start = () => {
    if (raf || reduceMotion || !visible || !hovering) return;
    raf = requestAnimationFrame(tick);
  };

  const stop = () => {
    cancelAnimationFrame(raf);
    raf = null;
  };

  const resize = () => {
    if (!dither.clientWidth) return;
    dither.width = Math.ceil(dither.clientWidth / DITHER_CELL);
    dither.height = Math.ceil(dither.clientHeight / DITHER_CELL);
    context = dither.getContext("2d");
    image = context.createImageData(dither.width, dither.height);
    draw();
  };

  resize();
  window.addEventListener("resize", resize);

  if (window.IntersectionObserver && footer) {
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start();
      else stop();
    });
    observer.observe(footer);
  }

  if (footer) {
    footer.addEventListener("mouseenter", () => {
      hovering = true;
      start();
    });
    footer.addEventListener("mousemove", (event) => {
      const box = dither.getBoundingClientRect();
      pointer = {
        x: (event.clientX - box.left) / DITHER_CELL,
        y: (event.clientY - box.top) / DITHER_CELL
      };
      if (!raf) draw();
    });
    footer.addEventListener("mouseleave", () => {
      hovering = false;
      pointer = null;
      stop();
      draw();
    });
  }
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  const wrap = button.closest(".copy-mail");
  if (!wrap) return;
  const tip = wrap.querySelector(".copy-mail-tip");
  const live = wrap.querySelector(".copy-mail-live");
  const label = tip.textContent;
  let timer = null;

  const reset = () => {
    window.clearTimeout(timer);
    tip.textContent = label;
    tip.classList.remove("is-done", "is-shown");
    if (live) live.textContent = "";
  };

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      tip.textContent = "Skopírované";
      tip.classList.add("is-done");
      if (live) live.textContent = "Adresa je skopírovaná.";
    } catch {
      tip.textContent = "Nepodarilo sa skopírovať";
      if (live) live.textContent = "Kopírovanie sa nepodarilo.";
    }
    tip.classList.add("is-shown");
    window.clearTimeout(timer);
    timer = window.setTimeout(reset, 2500);
  });

  button.addEventListener("mouseleave", reset);
  button.addEventListener("blur", reset);
});

const FAQ_OPEN_MS = 400;
const FAQ_CLOSE_MS = 320;
const FAQ_EASE = "cubic-bezier(0.2, 0.7, 0.2, 1)";

document.querySelectorAll(".faq").forEach((item) => {
  const summary = item.querySelector("summary");
  const answer = item.querySelector(".faq-answer");
  if (!summary || !answer) return;
  let slideAnimation = null;
  let fadeAnimation = null;
  let guard = null;

  const clear = () => {
    window.clearTimeout(guard);
    guard = null;
    const running = slideAnimation;
    const fading = fadeAnimation;
    slideAnimation = null;
    fadeAnimation = null;
    if (running) running.cancel();
    if (fading) fading.cancel();
    item.style.height = "";
    item.style.overflow = "";
    item.classList.remove("is-closing");
  };

  const slide = (from, to, duration, onDone) => {
    clear();
    item.style.overflow = "hidden";
    item.style.height = `${from}px`;

    const settle = () => {
      onDone();
      clear();
    };

    slideAnimation = item.animate(
      { height: [`${from}px`, `${to}px`] },
      { duration, easing: FAQ_EASE }
    );
    slideAnimation.addEventListener("finish", settle);
    guard = window.setTimeout(settle, duration + 200);
  };

  summary.addEventListener("click", (event) => {
    if (reduceMotion) return;
    event.preventDefault();
    const from = item.offsetHeight;

    if (item.open) {
      slide(from, summary.offsetHeight, FAQ_CLOSE_MS, () => {
        item.open = false;
      });
      item.classList.add("is-closing");
      fadeAnimation = answer.animate(
        { opacity: [1, 0] },
        { duration: Math.round(FAQ_CLOSE_MS * 0.6), easing: FAQ_EASE }
      );
      return;
    }

    item.open = true;
    item.style.height = "";
    const to = item.offsetHeight;
    slide(from, to, FAQ_OPEN_MS, () => {});
    fadeAnimation = answer.animate(
      { opacity: [0, 1], transform: ["translateY(-10px)", "none"] },
      { duration: FAQ_OPEN_MS, easing: FAQ_EASE }
    );
  });
});

const SCRAMBLE_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SCRAMBLE_LOWER = "abcdefghijklmnopqrstuvwxyz";
const SCRAMBLE_MS = 1000;
const SCRAMBLE_FIRST_LOCK = 400;
const FONTS_TIMEOUT = 1200;
const HOVER_SCRAMBLE = ".nav-links .nav-label, .faq-intro a";

const HERO_TEXT = [
  { selector: ".hero-title", delay: 0 },
  { selector: ".hero-logo", delay: 240 },
  { selector: ".nav-links .nav-label", delay: 320, stagger: 70 },
  { selector: ".hero-claim p", delay: 680 },
  { selector: ".hero-mail p", delay: 820 },
  { selector: ".hero-mail a", delay: 880 },
  { selector: ".hero-latest p", delay: 940 },
  { selector: ".hero-latest a", delay: 1000 }
];

const PIXEL_START = 34;
const PIXEL_CURVE = 1.6;
const PIXEL_FILL = 0.6;
const PIXEL_FEATHER = 0.25;
const PIXEL_JITTER = 0.14;
const PIXEL_FADE = 460;
const PHOTO_DELAY = 300;
const PHOTO_MS = 1900;

const fontsReady = () => {
  if (!document.fonts || !document.fonts.ready) return Promise.resolve();
  return Promise.race([
    document.fonts.ready,
    new Promise((resolve) => window.setTimeout(resolve, FONTS_TIMEOUT))
  ]);
};

const splitLetters = (source, target, letters) => {
  Array.from(source.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent.split("").forEach((character) => {
        if (!/\p{L}/u.test(character)) {
          target.append(document.createTextNode(character));
          return;
        }
        const span = document.createElement("span");
        span.className = "scramble-letter";
        span.textContent = character;
        letters.push(span);
        target.append(span);
      });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const copy = node.cloneNode(false);
    splitLetters(node, copy, letters);
    target.append(copy);
  });
};

const buildScramble = (host) => {
  const letters = [];
  const shown = document.createElement("span");
  shown.setAttribute("aria-hidden", "true");
  splitLetters(host, shown, letters);

  const parts = [];
  if (!host.hasAttribute("aria-label")) {
    const label = document.createElement("span");
    label.className = "visually-hidden";
    Array.from(host.cloneNode(true).childNodes).forEach((node) => label.append(node));
    parts.push(label);
  }
  parts.push(shown);
  host.replaceChildren(...parts);
  return letters;
};

const lockWidths = (letters) => {
  letters.forEach((span) => {
    const width = span.getBoundingClientRect().width;
    if (width) span.style.width = `${width}px`;
  });
};

const lockTimes = (count) =>
  Array.from({ length: count }, (_, index) =>
    count < 2
      ? SCRAMBLE_MS
      : SCRAMBLE_FIRST_LOCK +
        (index / (count - 1)) * (SCRAMBLE_MS - SCRAMBLE_FIRST_LOCK)
  );

const runScramble = (letters, done) => {
  const finals = letters.map((span) => span.textContent);
  const pools = finals.map((character) =>
    character === character.toLowerCase() ? SCRAMBLE_LOWER : SCRAMBLE_UPPER
  );
  const locks = lockTimes(letters.length);
  lockWidths(letters);
  const started = performance.now();
  let settled = false;

  const settle = () => {
    if (settled) return;
    settled = true;
    letters.forEach((span, index) => {
      if (span.textContent !== finals[index]) span.textContent = finals[index];
      span.style.width = "";
    });
    if (done) done();
  };

  const step = (now) => {
    if (settled) return;
    const elapsed = now - started;
    let running = false;
    letters.forEach((span, index) => {
      if (elapsed >= locks[index]) {
        if (span.textContent !== finals[index]) span.textContent = finals[index];
        return;
      }
      running = true;
      const pool = pools[index];
      const speed = 28 + index * 4;
      const position = Math.floor((elapsed / 1000) * speed);
      span.textContent = pool[position % pool.length];
    });
    if (running) requestAnimationFrame(step);
    else settle();
  };

  requestAnimationFrame(step);
  window.setTimeout(settle, SCRAMBLE_MS + 150);
};

const scrambled = new WeakMap();

const getScramble = (host) => {
  let letters = scrambled.get(host);
  if (!letters) {
    letters = buildScramble(host);
    scrambled.set(host, letters);
  }
  return letters;
};

const marks = document.querySelectorAll("h1 .mark, h2 .mark");
if (marks.length) {
  fontsReady().then(() => {
    marks.forEach((mark) => {
      const letters = getScramble(mark);
      if (reduceMotion) return;
      if (!window.IntersectionObserver) {
        runScramble(letters);
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting) return;
          observer.disconnect();
          runScramble(letters);
        },
        { threshold: 0.4 }
      );
      observer.observe(mark);
    });
  });
}

const pixelNoise = (x, y) => {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const pixelOrder = (col, row, rows) =>
  (row / rows) * (1 - PIXEL_JITTER) + pixelNoise(col, row) * PIXEL_JITTER;

const coverCrop = (image, canvas) => {
  const target = canvas.width / canvas.height;
  const natural = image.naturalWidth / image.naturalHeight;
  if (natural > target) {
    const width = image.naturalHeight * target;
    return {
      x: (image.naturalWidth - width) / 2,
      y: 0,
      width,
      height: image.naturalHeight
    };
  }
  const height = image.naturalWidth / target;
  return {
    x: 0,
    y: (image.naturalHeight - height) / 2,
    width: image.naturalWidth,
    height
  };
};

const pixelReveal = (host, source, duration) => {
  const width = host.offsetWidth;
  const height = host.offsetHeight;
  if (width < 8 || height < 8) {
    host.classList.remove("is-pixel-hold");
    return;
  }

  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement("canvas");
  canvas.className = "pixel-layer";
  canvas.setAttribute("aria-hidden", "true");
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);

  const ctx = canvas.getContext("2d");
  const crop = coverCrop(source, canvas);

  const scratch = document.createElement("canvas");
  scratch.width = canvas.width;
  scratch.height = canvas.height;
  const scratchCtx = scratch.getContext("2d");

  const maskCell = Math.max(4, Math.round(PIXEL_START * ratio));
  const maskCols = Math.ceil(canvas.width / maskCell);
  const maskRows = Math.ceil(canvas.height / maskCell);
  const mask = document.createElement("canvas");
  mask.width = maskCols;
  mask.height = maskRows;
  const maskCtx = mask.getContext("2d");

  host.append(canvas);

  const frame = (progress) => {
    const shrink = Math.pow(progress, PIXEL_CURVE);
    const cell = Math.max(
      1,
      Math.round(PIXEL_START * Math.pow(1 / PIXEL_START, shrink) * ratio)
    );
    const cols = Math.ceil(canvas.width / cell);
    const rows = Math.ceil(canvas.height / cell);

    scratchCtx.clearRect(0, 0, cols, rows);
    scratchCtx.drawImage(
      source,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      cols,
      rows
    );

    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = cell === 1;
    ctx.drawImage(scratch, 0, 0, cols, rows, 0, 0, cols * cell, rows * cell);

    if (progress >= PIXEL_FILL) return;

    const reveal = (progress / PIXEL_FILL) * (1 + PIXEL_FEATHER);
    maskCtx.clearRect(0, 0, maskCols, maskRows);
    maskCtx.fillStyle = "#000";
    for (let row = 0; row < maskRows; row += 1) {
      for (let col = 0; col < maskCols; col += 1) {
        const alpha = (reveal - pixelOrder(col, row, maskRows)) / PIXEL_FEATHER;
        if (alpha <= 0) continue;
        maskCtx.globalAlpha = Math.min(alpha, 1);
        maskCtx.fillRect(col, row, 1, 1);
      }
    }
    maskCtx.globalAlpha = 1;

    ctx.globalCompositeOperation = "destination-in";
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      mask,
      0,
      0,
      maskCols,
      maskRows,
      0,
      0,
      maskCols * maskCell,
      maskRows * maskCell
    );
  };

  let started = 0;
  const step = (now) => {
    if (!started) started = now;
    const progress = Math.min((now - started) / duration, 1);
    frame(progress);
    if (progress < 1) {
      requestAnimationFrame(step);
      return;
    }
    host.classList.remove("is-pixel-hold");
    canvas.classList.add("is-done");
    window.setTimeout(() => canvas.remove(), PIXEL_FADE);
  };
  requestAnimationFrame(step);
};

const imageReady = (image) => {
  if (image.complete) return Promise.resolve();
  return new Promise((resolve) => {
    image.addEventListener("load", resolve, { once: true });
    image.addEventListener("error", resolve, { once: true });
  });
};

if (hero && !reduceMotion) {
  const texts = [];
  HERO_TEXT.forEach((item) => {
    Array.from(hero.querySelectorAll(item.selector)).forEach((host, index) => {
      if (!host.getClientRects().length) return;
      host.classList.add("is-scramble-hold");
      texts.push({ host, delay: item.delay + (item.stagger || 0) * index });
    });
  });

  const photo = hero.querySelector("[data-pixel-photo]");
  const image = photo && photo.querySelector("img");
  if (image) photo.classList.add("is-pixel-hold");

  fontsReady().then(() => {
    texts.forEach(({ host, delay }) => {
      const letters = getScramble(host);
      window.setTimeout(() => {
        host.classList.remove("is-scramble-hold");
        runScramble(letters);
      }, delay);
    });

    if (image) {
      imageReady(image).then(() => {
        if (!image.naturalWidth) {
          photo.classList.remove("is-pixel-hold");
          return;
        }
        window.setTimeout(() => pixelReveal(photo, image, PHOTO_MS), PHOTO_DELAY);
      });
    }
  });
}

if (!reduceMotion) {
  document.querySelectorAll(HOVER_SCRAMBLE).forEach((host) => {
    const trigger = host.closest("a") || host;
    let busy = false;
    const play = () => {
      if (busy) return;
      busy = true;
      runScramble(getScramble(host), () => {
        busy = false;
      });
    };
    trigger.addEventListener("pointerenter", play);
    trigger.addEventListener("focus", play);
  });
}

const navToggle = document.querySelector("[data-nav-toggle]");
const mobileNav = document.querySelector("[data-mobile-nav]");

if (navToggle && mobileNav) {
  const navClose = mobileNav.querySelector("[data-nav-close]");
  const toggleText = navToggle.querySelector(".nav-toggle-text");
  let navOpen = false;
  let closeTimer = null;

  const navItems = () =>
    [...mobileNav.querySelectorAll("a[href], button")].filter(
      (item) => item.offsetParent !== null
    );

  const setNav = (next) => {
    if (next === navOpen) return;
    navOpen = next;
    navToggle.setAttribute("aria-expanded", String(navOpen));
    if (toggleText) toggleText.textContent = navOpen ? "zavrieť" : "menu";
    document.body.classList.toggle("is-locked", navOpen);
    window.clearTimeout(closeTimer);
    if (navOpen) {
      mobileNav.hidden = false;
      requestAnimationFrame(() => mobileNav.classList.add("is-open"));
      (navClose || navItems()[0]).focus();
    } else {
      mobileNav.classList.remove("is-open");
      if (reduceMotion) {
        mobileNav.hidden = true;
      } else {
        closeTimer = window.setTimeout(() => {
          if (!navOpen) mobileNav.hidden = true;
        }, 400);
      }
      navToggle.focus();
    }
  };

  navToggle.addEventListener("click", () => setNav(!navOpen));
  if (navClose) navClose.addEventListener("click", () => setNav(false));

  mobileNav.addEventListener("click", (event) => {
    if (event.target.closest("a[href]")) setNav(false);
  });

  document.addEventListener("keydown", (event) => {
    if (!navOpen) return;
    if (event.key === "Escape") {
      setNav(false);
      return;
    }
    if (event.key !== "Tab") return;
    const items = navItems();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (navOpen && window.innerWidth > 900) setNav(false);
  });
}

const contactForm = document.querySelector("#contact-form");
if (contactForm) {
  const status = contactForm.querySelector(".form-status");
  const submit = contactForm.querySelector(".send");
  const setStatus = (text, state) => {
    status.textContent = text;
    status.classList.toggle("is-error", state === "error");
  };
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    submit.disabled = true;
    setStatus("Odosielam…");
    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(contactForm)
      });
      if (!response.ok) throw new Error(String(response.status));
      setStatus("Ďakujem, správa odišla. Ozvem sa do 24 hodín.");
      contactForm.reset();
    } catch {
      setStatus(
        "Odoslanie sa nepodarilo. Napíšte mi prosím priamo na hello@by-simona.eu.",
        "error"
      );
    } finally {
      submit.disabled = false;
    }
  });
}
