
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
    document.querySelectorAll("main > section, main > .trust-bar"),
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
  var mriezka = document.querySelector(".services");
  if (!mriezka) return;
  var karty = Array.prototype.slice.call(
    mriezka.querySelectorAll(".service-card"),
  );
  if (!karty.length) return;

  var bezPohybu =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (bezPohybu || !("IntersectionObserver" in window)) return;

  var oneskorenia = karty.map(function (_, i) {
    return i * 90;
  });
  for (var i = oneskorenia.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var pom = oneskorenia[i];
    oneskorenia[i] = oneskorenia[j];
    oneskorenia[j] = pom;
  }

  mriezka.classList.add("is-armed");

  var sledovac = new IntersectionObserver(
    function (zaznamy) {
      zaznamy.forEach(function (zaznam) {
        if (!zaznam.isIntersecting) return;
        karty.forEach(function (karta, k) {
          setTimeout(function () {
            karta.classList.add("is-in");
          }, oneskorenia[k]);
        });
        sledovac.disconnect();
      });
    },
    { threshold: 0.12 },
  );
  sledovac.observe(mriezka);
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

  function odkial(prvok) {
    return parseInt(prvok.dataset.from || "0", 10);
  }

  function priprav(prvok) {
    prvok.textContent = odkial(prvok) + (prvok.dataset.suffix || "");
  }

  function spocitaj(prvok) {
    var zac = odkial(prvok);
    var ciel = parseInt(prvok.dataset.count, 10);
    var pripona = prvok.dataset.suffix || "";
    var trvanie = 1600;
    var start = null;
    function krok(cas) {
      if (start === null) start = cas;
      var podiel = Math.min((cas - start) / trvanie, 1);

      var tlmene = 1 - Math.pow(1 - podiel, 3);
      prvok.textContent =
        Math.round(zac + (ciel - zac) * tlmene) + pripona;
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
  var ecv = document.getElementById("ecv");

  ecv.addEventListener("input", function () {
    var poloha = ecv.selectionStart;
    ecv.value = ecv.value.toUpperCase().replace(/\s+/g, "");
    ecv.setSelectionRange(poloha, poloha);
  });

  formular.addEventListener("submit", function (udalost) {
    udalost.preventDefault();
    if (!formular.checkValidity()) {
      formular.reportValidity();
      return;
    }
    tlacidlo.disabled = true;
    stav.className = "form-status";
    stav.textContent = "Odosielam…";

    setTimeout(function () {
      stav.className = "form-status is-done";
      stav.innerHTML =
        '<svg class="icon" aria-hidden="true"><use href="#i-fajka" /></svg>' +
        "<span>Toto je ukážkový web, takže požiadavka nikam neodišla. Na ostrom webe by v tejto chvíli prišiel servisu e-mail s EČV aj popisom poruchy.</span>";
      tlacidlo.disabled = false;
    }, 700);
  });
})();
