(function () {
  "use strict";
  var panel = document.getElementById("mobile-menu");
  var openButton = document.getElementById("open-menu");
  var closeButton = document.getElementById("close-menu");
  if (!panel || !openButton || !closeButton) return;

  function focusable() {
    return Array.prototype.slice.call(
      panel.querySelectorAll("a[href], button"),
    );
  }

  function open() {
    panel.classList.add("is-open");
    document.body.classList.add("nav-locked");
    openButton.setAttribute("aria-expanded", "true");
    closeButton.focus();
  }

  function close(returnFocus) {
    panel.classList.remove("is-open");
    document.body.classList.remove("nav-locked");
    openButton.setAttribute("aria-expanded", "false");
    if (returnFocus) openButton.focus();
  }

  openButton.addEventListener("click", open);
  closeButton.addEventListener("click", function () {
    close(true);
  });

  panel.addEventListener("click", function (event) {
    if (event.target.closest("a[href^='#']")) close(false);
  });

  document.addEventListener("keydown", function (event) {
    if (!panel.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      close(true);
      return;
    }
    if (event.key !== "Tab") return;

    var items = focusable();
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 900 && panel.classList.contains("is-open")) {
      close(false);
    }
  });
})();

(function () {
  "use strict";
  var blocks = Array.prototype.slice.call(
    document.querySelectorAll("main > section"),
  );
  if (!blocks.length) return;

  var noMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (noMotion || !("IntersectionObserver" in window)) return;

  blocks.forEach(function (block) {
    block.classList.add("section-fade");
  });

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },

    { threshold: 0, rootMargin: "0px 0px -10% 0px" },
  );
  blocks.forEach(function (block) {
    observer.observe(block);
  });
})();

(function () {
  "use strict";
  var items = Array.prototype.slice.call(
    document.querySelectorAll("#faq details"),
  );
  if (!items.length || !Element.prototype.animate) return;

  var noMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (noMotion) return;

  var options = {
    duration: 280,
    easing: "cubic-bezier(0.2, 0.8, 0.3, 1)",
  };

  items.forEach(function (detail) {
    var head = detail.querySelector("summary");
    var content = detail.querySelector(".faq-body");
    if (!head || !content) return;
    var running = null;

    head.addEventListener("click", function (event) {
      event.preventDefault();
      if (running) running.cancel();

      if (detail.open) {
        var fromHeight = content.offsetHeight;
        running = content.animate(
          [
            { height: fromHeight + "px", opacity: 1 },
            { height: "0px", opacity: 0 },
          ],
          options,
        );
        running.onfinish = function () {
          detail.open = false;
          running = null;
        };
      } else {
        detail.open = true;
        var toHeight = content.scrollHeight;
        running = content.animate(
          [
            { height: "0px", opacity: 0 },
            { height: toHeight + "px", opacity: 1 },
          ],
          options,
        );
        running.onfinish = function () {
          running = null;
        };
      }
    });
  });
})();

(function () {
  "use strict";
  var services = Array.prototype.slice.call(
    document.querySelectorAll(".service"),
  );
  if (!services.length) return;

  var noMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (noMotion) return;

  var pending = false;

  /* Pre kazdy blok spocita podiel 0 - 1: nula znamena, ze je este pod
   * ohybom obrazovky, jednicka ze doputoval na svoje miesto. CSS si z toho
   * cez --zoom poskladá scale, takze obrazok aj text rastu. */
  function update() {
    pending = false;
    var viewport = window.innerHeight || document.documentElement.clientHeight;
    var band = viewport * 0.55;

    services.forEach(function (service) {
      var rect = service.getBoundingClientRect();
      var ratio = (viewport - rect.top) / band;
      if (ratio < 0) ratio = 0;
      if (ratio > 1) ratio = 1;
      service.style.setProperty("--zoom", ratio.toFixed(3));
    });
  }

  function schedule() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  update();
})();

(function () {
  "use strict";
  var switcher = document.querySelector(".price-switch");
  var table = document.getElementById("pricing-table");
  if (!switcher || !table) return;

  switcher.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-show]");
    if (!button) return;
    table.dataset.show = button.dataset.show;
    Array.prototype.forEach.call(
      switcher.querySelectorAll("button"),
      function (b) {
        b.setAttribute("aria-pressed", String(b === button));
      },
    );
  });
})();

(function () {
  "use strict";
  var numbers = Array.prototype.slice.call(
    document.querySelectorAll("[data-count]"),
  );
  if (!numbers.length) return;

  var noMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (noMotion || !("IntersectionObserver" in window)) return;

  function prepare(element) {
    element.textContent = "0" + (element.dataset.suffix || "");
  }

  function countUp(element) {
    var target = parseInt(element.dataset.count, 10);
    var suffix = element.dataset.suffix || "";
    var duration = 1600;
    var start = null;
    function step(now) {
      if (start === null) start = now;
      var ratio = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - ratio, 3);
      element.textContent = Math.round(target * eased) + suffix;
      if (ratio < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  numbers.forEach(prepare);

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.6 },
  );
  numbers.forEach(function (element) {
    observer.observe(element);
  });
})();

(function () {
  "use strict";
  var form = document.getElementById("booking-form");
  var status = document.getElementById("booking-status");
  var button = document.getElementById("submit-booking");
  if (!form || !status || !button) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    button.disabled = true;
    status.className = "form-status";
    status.textContent = "Odesílám…";

    setTimeout(function () {
      status.className = "form-status is-done";
      status.innerHTML =
        '<svg class="icon" aria-hidden="true"><use href="#i-check" /></svg>' +
        "<span>Toto je ukázkový web, takže požadavek nikam neodešel. Na ostrém webu by v této chvíli přišel salonu e-mail i SMS s termínem a vybranou službou.</span>";
      button.disabled = false;
    }, 700);
  });
})();

(function () {
  "use strict";
  var header = document.querySelector(".site-header");
  if (!header) return;

  /* na podstránkach bez hero nemá byť hlavička nikdy priehľadná */
  var hero = document.querySelector(".hero");

  function measure() {
    document.documentElement.style.setProperty(
      "--header-h",
      header.offsetHeight + "px",
    );
  }

  /* nad hero je hlavička priehľadná, pod ním dostane plnú tmavú plochu */
  function update() {
    pending = false;
    header.classList.toggle(
      "is-scrolled",
      !hero || hero.getBoundingClientRect().bottom <= header.offsetHeight,
    );
  }

  var pending = false;
  function onScroll() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(update);
  }

  measure();
  update();

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () {
    measure();
    update();
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      measure();
      update();
    });
  }
})();

/*
 * Nábeh hero (ružová plocha sprava, text s ňou) má fill: both, takže
 * animácia ostáva na prvkoch „živá" aj po dobehnutí a prehliadač ju vie pri
 * prekresľovaní na okamih nasadiť od začiatku. Plocha potom prebehne sprava
 * doľava. Po dobehnutí ju preto vypneme; koncový stav keyframov je rovnaký
 * ako základný stav prvkov, takže sa nič neposunie.
 */
(function () {
  "use strict";
  var hero = document.querySelector(".hero");
  if (!hero) return;

  var INTROS = ["hero-panel", "hero-text"];
  var finished = 0;

  function disable() {
    hero.classList.add("is-ready");
  }

  hero.addEventListener("animationend", function (event) {
    if (INTROS.indexOf(event.animationName) === -1) return;
    finished += 1;
    if (finished >= INTROS.length) disable();
  });

  /* poistka, keď animácie vôbec nebežia (obmedzený pohyb, starý prehliadač) */
  setTimeout(disable, 2500);
})();

/*
 * Pri odchode z hero sa ružová plocha rozpína doľava, až prekryje celé hero.
 * Podiel už odscrollovanej výšky ide do --tint-shift a CSS si z neho poskladá
 * scaleX, rovnako, ako sa pri službách počíta --zoom.
 */
(function () {
  "use strict";
  var hero = document.querySelector(".hero");
  if (!hero) return;

  var noMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (noMotion) return;

  /* celé hero je červené už po 60 % jeho výšky, nech koniec stihne byť vidieť */
  var BAND = 0.6;
  var pending = false;

  function update() {
    pending = false;
    var rect = hero.getBoundingClientRect();
    if (!rect.height) return;

    var ratio = -rect.top / (rect.height * BAND);
    if (ratio < 0) ratio = 0;
    if (ratio > 1) ratio = 1;
    hero.style.setProperty("--tint-shift", ratio.toFixed(3));
  }

  function schedule() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  update();
})();
