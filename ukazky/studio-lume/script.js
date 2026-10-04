(function () {
  "use strict";
  var panel = document.getElementById("mobilne-menu");
  var otvorit = document.getElementById("otvorit-menu");
  var zavriet = document.getElementById("zavriet-menu");
  if (!panel || !otvorit || !zavriet) return;

  function prvky() {
    return Array.prototype.slice.call(
      panel.querySelectorAll("a[href], button"),
    );
  }

  function otvor() {
    panel.classList.add("is-open");
    document.body.classList.add("nav-locked");
    otvorit.setAttribute("aria-expanded", "true");
    zavriet.focus();
  }

  function zavri(vratitFokus) {
    panel.classList.remove("is-open");
    document.body.classList.remove("nav-locked");
    otvorit.setAttribute("aria-expanded", "false");
    if (vratitFokus) otvorit.focus();
  }

  otvorit.addEventListener("click", otvor);
  zavriet.addEventListener("click", function () {
    zavri(true);
  });

  panel.addEventListener("click", function (udalost) {
    if (udalost.target.closest("a[href^='#']")) zavri(false);
  });

  document.addEventListener("keydown", function (udalost) {
    if (!panel.classList.contains("is-open")) return;
    if (udalost.key === "Escape") {
      zavri(true);
      return;
    }
    if (udalost.key !== "Tab") return;

    var zoznam = prvky();
    if (!zoznam.length) return;
    var prvy = zoznam[0];
    var posledny = zoznam[zoznam.length - 1];
    if (udalost.shiftKey && document.activeElement === prvy) {
      udalost.preventDefault();
      posledny.focus();
    } else if (!udalost.shiftKey && document.activeElement === posledny) {
      udalost.preventDefault();
      prvy.focus();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 900 && panel.classList.contains("is-open")) {
      zavri(false);
    }
  });
})();

(function () {
  "use strict";
  var bloky = Array.prototype.slice.call(
    document.querySelectorAll("main > section"),
  );
  if (!bloky.length) return;

  var bezPohybu =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (bezPohybu || !("IntersectionObserver" in window)) return;

  bloky.forEach(function (blok) {
    blok.classList.add("section-fade");
  });

  var sledovac = new IntersectionObserver(
    function (zaznamy) {
      zaznamy.forEach(function (zaznam) {
        if (!zaznam.isIntersecting) return;
        zaznam.target.classList.add("is-in");
        sledovac.unobserve(zaznam.target);
      });
    },

    { threshold: 0, rootMargin: "0px 0px -10% 0px" },
  );
  bloky.forEach(function (blok) {
    sledovac.observe(blok);
  });
})();

(function () {
  "use strict";
  var polozky = Array.prototype.slice.call(
    document.querySelectorAll("#otazky details"),
  );
  if (!polozky.length || !Element.prototype.animate) return;

  var bezPohybu =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (bezPohybu) return;

  var nastavenie = {
    duration: 280,
    easing: "cubic-bezier(0.2, 0.8, 0.3, 1)",
  };

  polozky.forEach(function (detail) {
    var zhlavie = detail.querySelector("summary");
    var telo = detail.querySelector(".faq-body");
    if (!zhlavie || !telo) return;
    var bezi = null;

    zhlavie.addEventListener("click", function (udalost) {
      udalost.preventDefault();
      if (bezi) bezi.cancel();

      if (detail.open) {
        var zVysky = telo.offsetHeight;
        bezi = telo.animate(
          [
            { height: zVysky + "px", opacity: 1 },
            { height: "0px", opacity: 0 },
          ],
          nastavenie,
        );
        bezi.onfinish = function () {
          detail.open = false;
          bezi = null;
        };
      } else {
        detail.open = true;
        var naVysku = telo.scrollHeight;
        bezi = telo.animate(
          [
            { height: "0px", opacity: 0 },
            { height: naVysku + "px", opacity: 1 },
          ],
          nastavenie,
        );
        bezi.onfinish = function () {
          bezi = null;
        };
      }
    });
  });
})();

(function () {
  "use strict";
  var sluzby = Array.prototype.slice.call(document.querySelectorAll(".sluzba"));
  if (!sluzby.length) return;

  var bezPohybu =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (bezPohybu) return;

  var caka = false;

  /* Pre kazdy blok spocita podiel 0 - 1: nula znamena, ze je este pod
   * ohybom obrazovky, jednicka ze doputoval na svoje miesto. CSS si z toho
   * cez --priblizenie poskladá scale, takze obrazok aj text rastu. */
  function prepocitaj() {
    caka = false;
    var vyska = window.innerHeight || document.documentElement.clientHeight;
    var pasmo = vyska * 0.55;

    sluzby.forEach(function (sluzba) {
      var ramec = sluzba.getBoundingClientRect();
      var podiel = (vyska - ramec.top) / pasmo;
      if (podiel < 0) podiel = 0;
      if (podiel > 1) podiel = 1;
      sluzba.style.setProperty("--priblizenie", podiel.toFixed(3));
    });
  }

  function naplanuj() {
    if (caka) return;
    caka = true;
    window.requestAnimationFrame(prepocitaj);
  }

  window.addEventListener("scroll", naplanuj, { passive: true });
  window.addEventListener("resize", naplanuj);
  prepocitaj();
})();

(function () {
  "use strict";
  var prepinac = document.querySelector(".price-switch");
  var tabulka = document.getElementById("cennik-tabulka");
  if (!prepinac || !tabulka) return;

  prepinac.addEventListener("click", function (udalost) {
    var tlacidlo = udalost.target.closest("button[data-show]");
    if (!tlacidlo) return;
    tabulka.dataset.show = tlacidlo.dataset.show;
    Array.prototype.forEach.call(
      prepinac.querySelectorAll("button"),
      function (b) {
        b.setAttribute("aria-pressed", String(b === tlacidlo));
      },
    );
  });
})();

(function () {
  "use strict";
  var cisla = Array.prototype.slice.call(
    document.querySelectorAll("[data-count]"),
  );
  if (!cisla.length) return;

  var bezPohybu =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (bezPohybu || !("IntersectionObserver" in window)) return;

  function priprav(prvok) {
    prvok.textContent = "0" + (prvok.dataset.suffix || "");
  }

  function spocitaj(prvok) {
    var ciel = parseInt(prvok.dataset.count, 10);
    var pripona = prvok.dataset.suffix || "";
    var trvanie = 1600;
    var start = null;
    function krok(cas) {
      if (start === null) start = cas;
      var podiel = Math.min((cas - start) / trvanie, 1);
      var tlmene = 1 - Math.pow(1 - podiel, 3);
      prvok.textContent = Math.round(ciel * tlmene) + pripona;
      if (podiel < 1) requestAnimationFrame(krok);
    }
    requestAnimationFrame(krok);
  }

  cisla.forEach(priprav);

  var sledovac = new IntersectionObserver(
    function (zaznamy) {
      zaznamy.forEach(function (zaznam) {
        if (!zaznam.isIntersecting) return;
        spocitaj(zaznam.target);
        sledovac.unobserve(zaznam.target);
      });
    },
    { threshold: 0.6 },
  );
  cisla.forEach(function (prvok) {
    sledovac.observe(prvok);
  });
})();

(function () {
  "use strict";
  var formular = document.getElementById("objednavkovy-formular");
  var stav = document.getElementById("stav");
  var tlacidlo = document.getElementById("odoslat");
  if (!formular || !stav || !tlacidlo) return;

  formular.addEventListener("submit", function (udalost) {
    udalost.preventDefault();
    if (!formular.checkValidity()) {
      formular.reportValidity();
      return;
    }
    tlacidlo.disabled = true;
    stav.className = "form-status";
    stav.textContent = "Odesílám…";

    setTimeout(function () {
      stav.className = "form-status is-done";
      stav.innerHTML =
        '<svg class="icon" aria-hidden="true"><use href="#i-fajka" /></svg>' +
        "<span>Toto je ukázkový web, takže požadavek nikam neodešel. Na ostrém webu by v této chvíli přišel salonu e-mail i SMS s termínem a vybranou službou.</span>";
      tlacidlo.disabled = false;
    }, 700);
  });
})();

(function () {
  "use strict";
  var hlavicka = document.querySelector(".site-header");
  var hero = document.querySelector(".hero");
  var prekryv = document.querySelector(".section-prekryv");
  if (!hlavicka || !hero) return;

  function vyska() {
    document.documentElement.style.setProperty(
      "--hlavicka",
      hlavicka.offsetHeight + "px",
    );
  }

  /*
   * Hero je pripnuté, takže jeho spodok sa nahor nikdy nedostane. Hlavičku
   * preto prepíname podľa hornej hrany sekcie, ktorá sa cezeň nasúva; keď
   * taká sekcia nie je, padáme na spodok hero ako predtým.
   */
  function stav() {
    caka = false;
    var hranica = prekryv
      ? prekryv.getBoundingClientRect().top
      : hero.getBoundingClientRect().bottom;
    hlavicka.classList.toggle("je-posunuta", hranica <= hlavicka.offsetHeight);
  }

  var caka = false;
  function naScroll() {
    if (caka) return;
    caka = true;
    requestAnimationFrame(stav);
  }

  vyska();
  stav();

  window.addEventListener("scroll", naScroll, { passive: true });
  window.addEventListener("resize", function () {
    vyska();
    stav();
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      vyska();
      stav();
    });
  }
})();
