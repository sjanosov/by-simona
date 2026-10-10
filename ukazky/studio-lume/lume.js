/*
 * Lumé: Vítejte + Ceník
 *   1) odhaľovanie [data-reveal] pri scrollovaní
 *   2) video v sekcii Vítejte (pauza/prehrávanie, stop mimo obrazovky)
 *   3) prepínače cenníka a galérie s posuvnou čiernou pilulkou
 *   4) vlas cez celú stránku, kreslený podľa scrollu
 * Bez JS je všetko viditeľné a cenník ukáže prvú kartu.
 */

/* --- 1 + 2: odhaľovanie a video ------------------------------------- */
(() => {
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if ("IntersectionObserver" in window) {
    document.documentElement.classList.add("js-reveal");

    const reveal = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            reveal.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
    );

    document.querySelectorAll("[data-reveal]").forEach((el) => reveal.observe(el));
  }

  const video = document.querySelector(".welcome-film video");
  const toggle = document.querySelector(".welcome-film-toggle");

  if (video && toggle) {
    // používateľ si video zastavil sám, scroll ho už znova nespustí
    let heldByUser = calm;

    const sync = () => {
      const paused = video.paused;
      toggle.setAttribute("aria-pressed", String(paused));
      toggle.setAttribute("aria-label", paused ? "Přehrát video" : "Pozastavit video");
    };

    if (calm) {
      video.removeAttribute("autoplay");
      video.pause();
    }

    toggle.addEventListener("click", () => {
      if (video.paused) {
        heldByUser = false;
        video.play();
      } else {
        heldByUser = true;
        video.pause();
      }
    });

    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    sync();

    // mimo obrazovky video nebeží, nech zbytočne nežerie baterku
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !heldByUser) {
          video.play().catch(() => {});
        } else if (!entry.isIntersecting) {
          video.pause();
        }
      }).observe(video);
    }
  }
})();

/* --- 3: prepínače v sekciách ---------------------------------------- */
/*
 * Jedna posuvná čierna pilulka pre cenník aj galériu. Cenník je tablist a
 * karty si prepína tu, galéria drží stav v aria-pressed a sady si mení sama
 * v gallery.js, tam sa čierna plocha len presunie na nové miesto. Odkazy
 * pri službách nesú data-price-tab a otvoria rovno svoju kartu cenníka.
 */
(() => {
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll(".pill-switch").forEach((bar) => {
    const items = Array.from(bar.querySelectorAll("button"));
    const tabs = items.filter((item) => item.getAttribute("role") === "tab");
    const ind = bar.querySelector(".pill-switch-ind");

    // čierna pilulka dostane polohu a šírku aktívnej položky
    const place = () => {
      const on = items.find(
        (item) =>
          item.getAttribute("aria-selected") === "true" ||
          item.getAttribute("aria-pressed") === "true"
      );
      ind.style.width = on.offsetWidth + "px";
      ind.style.transform = `translateX(${on.offsetLeft}px)`;
    };

    /*
     * Karta sa vysype riadok po riadku, ale len pri prvom otvorení. Kto
     * cenník preklikáva, nemá čakať na to isté druhý raz. Trieda musí byť
     * jeden snímok naozaj vykreslená, inak prehliadač prechod nerozbehne:
     * dovtedy drží panel hidden mimo vykresľovania.
     */
    const panelOf = (tab) => document.getElementById(tab.getAttribute("aria-controls"));

    const freshen = (panel) => {
      if (calm || panel.dataset.seen) return;
      panel.dataset.seen = "1";
      panel.classList.add("is-fresh");
      requestAnimationFrame(() =>
        requestAnimationFrame(() => panel.classList.remove("is-fresh"))
      );
    };

    const select = (tab) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = panelOf(t);
        panel.hidden = !on;
        if (on) freshen(panel);
      });
      place();
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab));

      // šípky medzi kartami, ako pri bežnom tablist
      tab.addEventListener("keydown", (e) => {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (step) {
          const next = tabs[(i + step + tabs.length) % tabs.length];
          next.focus();
          select(next);
        }
      });

      // odkaz pri službe otvorí rovno svoju kartu cenníka
      document
        .querySelectorAll(`[data-price-tab="${tab.id}"]`)
        .forEach((link) => link.addEventListener("click", () => select(tab)));
    });

    /*
     * Galéria si aria-pressed prepína sama v gallery.js a to počúva na celej
     * lište. Preto sa aj tu čaká na lištu, nie na tlačidlo: pri kliku na
     * tlačidlo by sme bežali skôr než gallery.js a plocha by zostala pod
     * starou položkou, s bielym textom na bielom.
     */
    if (!tabs.length) {
      bar.addEventListener("click", place);
    }

    // karta otvorená od začiatku je už videná, tej sa vysypávanie netýka
    tabs
      .filter((t) => t.getAttribute("aria-selected") === "true")
      .forEach((t) => {
        panelOf(t).dataset.seen = "1";
      });

    bar.classList.add("is-live");
    place();
    window.addEventListener("resize", place);
    if (document.fonts) document.fonts.ready.then(place);
  });
})();

/* --- 4: vlas cez celú stránku --------------------------------------- */
/*
 * Kreslená točitá čiara: pri scrolle nadol sa predlžuje, nahor zaniká.
 * Siaha tam, kam práve dočítaš (80 % výšky okna). Leží nad sekciami,
 * pod hlavičkou (z-index 30 < 40), a klikom prepadá.
 */
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const N = 2400;
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("fill", "none");
  svg.style.cssText =
    "position:absolute;top:0;left:0;width:100%;z-index:30;pointer-events:none;overflow:visible;mix-blend-mode:multiply";

  const mkPath = (width, opacity) => {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("stroke", "#96574c");
    p.setAttribute("stroke-width", width);
    p.setAttribute("stroke-opacity", opacity);
    p.setAttribute("stroke-linecap", "round");
    p.setAttribute("stroke-linejoin", "round");
    p.setAttribute("pathLength", "1");
    p.setAttribute("stroke-dasharray", "1 1");
    p.setAttribute("stroke-dashoffset", "1");
    svg.appendChild(p);
    return p;
  };
  const back = mkPath(0.9, 0.45);
  const main = mkPath(1.6, 1);

  document.body.style.position = "relative";
  document.body.appendChild(svg);

  const bump = (s, m, sd) => Math.exp(-Math.pow((s - m) / sd, 2));

  // trochoida: kde sa uhol točí rýchlo, z vlny vzniknú slučky, čiže kučery
  const strand = (w, h, dx, phase, rk) => {
    let th = phase;
    let d = "";
    let len = 0;
    let px = 0;
    let py = 0;
    const cum = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const s = i / (N - 1);
      const c =
        bump(s, 0.12, 0.025) + bump(s, 0.34, 0.02) + bump(s, 0.55, 0.025) +
        bump(s, 0.78, 0.022) + 0.6 * bump(s, 0.94, 0.018);
      th += 0.012 + 0.16 * c;
      const r = (6 + 70 * c) * rk;
      const bx = w * (0.5 + 0.38 * Math.sin(Math.PI * 2 * 2.1 * s + 0.4) + 0.05 * Math.sin(Math.PI * 2 * 7 * s)) + dx;
      const x = bx + r * Math.cos(th);
      const y = 8 + s * (h - 16) + r * Math.sin(th);
      if (i) len += Math.hypot(x - px, y - py);
      cum[i] = len;
      d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
      px = x;
      py = y;
    }
    return { d, cum, len };
  };

  let geo = null;
  let target = 0;
  let current = 0;
  let raf = 0;
  let bodyH = 0;

  const build = () => {
    /*
     * Pred meraním sa svg musí zložiť na nulu. Je síce absolútne, ale svojou
     * výškou si predlžuje stránku, takže by si tu meralo samo seba: po zúžení
     * okna by stránka zostala natiahnutá na starú výšku a pod pätičkou by
     * ostalo prázdne miesto.
     */
    svg.style.height = "0px";
    const w = document.documentElement.clientWidth;
    const h = document.documentElement.scrollHeight;
    svg.style.height = h + "px";
    bodyH = document.body.offsetHeight;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    const a = strand(w, h, 0, 0, 1);
    const b = strand(w, h, 5, 0.35, 0.9);
    main.setAttribute("d", a.d);
    back.setAttribute("d", b.d);
    geo = { h, a };
    onScroll();
  };

  const draw = () => {
    const i = Math.round(current * (N - 1));
    const frac = geo.a.cum[i] / geo.a.len;
    const off = (1 - frac).toFixed(4);
    main.setAttribute("stroke-dashoffset", off);
    back.setAttribute("stroke-dashoffset", off);
  };

  const tick = () => {
    current += (target - current) * 0.16;
    if (Math.abs(target - current) < 0.0005) current = target;
    draw();
    raf = current === target ? 0 : requestAnimationFrame(tick);
  };

  function onScroll() {
    const vh = window.innerHeight;
    const atEnd = window.scrollY + vh >= geo.h - 2;
    const y = atEnd ? geo.h : window.scrollY + vh * 0.8;
    target = Math.min(1, y / geo.h);
    if (calm) current = target;
    if (!raf) raf = requestAnimationFrame(tick);
  }

  build();
  window.addEventListener("scroll", onScroll, { passive: true });
  // body si do svojej výšky absolútne svg neráta, preto sa porovnáva ono
  new ResizeObserver(() => {
    if (Math.abs(document.body.offsetHeight - bodyH) > 4) build();
  }).observe(document.body);
  window.addEventListener("resize", build);
})();
