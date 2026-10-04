(function () {
  "use strict";

  /*
   * Coverflow galéria. Bez JS zostane z pásu obyčajný vodorovný scroll so
   * snapom — až tento skript z neho spraví 3D karusel a prihodí šípky a bodky.
   *
   * Jediný zdroj pravdy je `position`: zlomkový index karty, ktorá je v
   * strede. Všetko ostatné sa z nej dopočíta. Kreslí sa priamo do DOM, nie cez
   * stav — šesťdesiat prepočtov za sekundu by inak znamenalo šesťdesiat
   * prekreslení všetkých kariet kvôli číslam, ktoré nikto nepotrebuje vidieť.
   */

  var roots = Array.prototype.slice.call(document.querySelectorAll(".gallery"));
  if (!roots.length) return;

  var noMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* postavené karusely, nech vieme po prepnutí premerať ten odkrytý */
  var instances = [];

  roots.forEach(build);

  setupSwitcher();

  /*
   * Prepínač medzi sadami. Skrytý karusel sa pri štarte nameria na nulu —
   * ResizeObserver si ho po odkrytí síce všimne, ale premerať ho rovno je
   * lacnejšie než spoliehať sa na poradie notifikácií.
   */
  function setupSwitcher() {
    var switcher = document.querySelector(".gallery-switch");
    if (!switcher) return;

    var sets = Array.prototype.slice.call(
      document.querySelectorAll(".gallery[data-set]"),
    );
    if (sets.length < 2) return;

    switcher.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-gallery]");
      if (!button) return;

      var wanted = button.getAttribute("data-gallery");
      sets.forEach(function (set) {
        set.hidden = set.getAttribute("data-set") !== wanted;
      });
      instances.forEach(function (instance) {
        if (!instance.root.hidden) instance.measure();
      });

      Array.prototype.forEach.call(
        switcher.querySelectorAll("button"),
        function (b) {
          b.setAttribute("aria-pressed", String(b === button));
        },
      );
    });

    /* bez JS by prepínač nemal čo prepínať, tak sa odkryje až tu */
    switcher.classList.add("is-live");
  }

  function build(root) {
    var frame = root.querySelector(".gallery-frame");
    var cards = Array.prototype.slice.call(
      root.querySelectorAll(".gallery-card"),
    );
    var prevButton = root.querySelector(".gallery-arrow-left");
    var nextButton = root.querySelector(".gallery-arrow-right");
    var dotsBar = root.querySelector(".gallery-dots");
    var count = cards.length;
    if (!frame || count < 2) return;

    /* pri málo kartách by sa prstenec začal prekrývať sám so sebou */
    var loop = count >= 5;

    var TILT = 44; /* stupne, o ktoré sa nakloní prvá susedná karta */
    var DEPTH = 0.6; /* ako hlboko ustúpi, v násobkoch šírky karty */
    var DAMP = 0.56; /* exponent na vzdialenosť; pod 1 sklon vzdialením mäkne */
    var FADE = 0.1; /* koľko krytia ubudne na každý krok od stredu */
    var GAP = 0.05; /* rozostup kariet, v násobkoch ich šírky */

    var position = 0;
    /*
     * Kam mieri práve prebiehajúce dosadanie. Keby sa krokovalo z `position`,
     * stlačenie šípky uprostred letu by sa stratilo — zaokrúhlenie by vrátilo
     * tú istú kartu, na ktorej sa už aj tak zastavuje.
     */
    var target = 0;
    var width = 0;
    var request = null;
    var drag = null;
    var selected = 0;
    var dots = [];

    function indexAt(p) {
      return ((Math.round(p) % count) + count) % count;
    }

    function clamp(p) {
      return loop ? p : Math.max(0, Math.min(count - 1, p));
    }

    function render() {
      if (!width) return;
      var spacing = width * (1 + GAP);

      cards.forEach(function (card, i) {
        /*
         * Vzdialenosť sa zloží na kratšiu cestu okolo prstenca. V tomto
         * jednom riadku je celé zacyklenie — žiadne klonované uzly, žiadne
         * presúvanie v DOM.
         */
        var offset = i - position;
        if (loop) {
          offset = ((offset % count) + count) % count;
          if (offset > count / 2) offset -= count;
        }

        var distance = Math.abs(offset);
        /*
         * Sklon aj ústup slabnú so vzdialenosťou — dvojnásobná vzdialenosť
         * pridá len asi polovicu navyše. Lineárny nábeh by druhú kartu zavrel
         * naplocho; takto zostane čitateľná.
         */
        var ramp = Math.pow(distance, DAMP);
        var dir = offset < 0 ? -1 : offset > 0 ? 1 : 0;
        /* zastropované pred hranou, nech sa vzdialená karta neotočí chrbtom */
        var tilt = Math.min(TILT * ramp, 82) * dir;

        card.style.transform =
          "translateX(calc(-50% + " +
          offset * spacing +
          "px)) translateZ(" +
          -DEPTH * width * ramp +
          "px) rotateY(" +
          -tilt +
          "deg)";

        /*
         * Karta sa cez prstenec prehodí presne v polovici obrátky, takže do
         * vtedy už musí byť neviditeľná — inak by bolo ten skok vidieť.
         */
        var edge = loop ? Math.min(1, Math.max(0, count / 2 - distance)) : 1;
        card.style.opacity = String(Math.max(0, 1 - FADE * distance) * edge);
        card.style.zIndex = String(100 - Math.round(distance));
      });
    }

    function mark(index) {
      if (index === selected) return;
      selected = index;
      dots.forEach(function (dot, i) {
        dot.setAttribute("aria-current", i === index ? "true" : "false");
      });
    }

    function settle(to) {
      if (request !== null) cancelAnimationFrame(request);
      target = to;
      mark(indexAt(to));

      if (noMotion) {
        position = to;
        render();
        request = null;
        return;
      }

      var step = function () {
        var remaining = target - position;
        if (Math.abs(remaining) < 0.0004) {
          position = target;
          render();
          request = null;
          return;
        }
        /* exponenciálne dobehnutie, nie pružina — dosadnutie nemá prestreliť */
        position += remaining * 0.16;
        render();
        request = requestAnimationFrame(step);
      };
      request = requestAnimationFrame(step);
    }

    function toCard(index) {
      /* kratšou cestou okolo prstenca, nie odvíjaním celého kola */
      var to = loop
        ? index + Math.round((target - index) / count) * count
        : index;
      settle(clamp(to));
    }

    function move(by) {
      settle(clamp(Math.round(target) + by));
    }

    frame.addEventListener("pointerdown", function (e) {
      if (request !== null) {
        cancelAnimationFrame(request);
        request = null;
      }
      frame.setPointerCapture(e.pointerId);
      target = position;
      drag = {
        id: e.pointerId,
        x: e.clientX,
        position: position,
        velocity: 0,
        time: performance.now(),
      };
    });

    frame.addEventListener("pointermove", function (e) {
      if (!drag || drag.id !== e.pointerId) return;
      var spacing = width * (1 + GAP);
      if (!spacing) return;

      var now = performance.now();
      var previous = position;
      position = clamp(drag.position - (e.clientX - drag.x) / spacing);
      /* kariet za sekundu, pre dohodenie */
      drag.velocity =
        ((position - previous) / Math.max(now - drag.time, 1)) * 1000;
      drag.time = now;

      mark(indexAt(position));
      render();
    });

    function endDrag(e) {
      if (!drag || drag.id !== e.pointerId) return;
      var velocity = drag.velocity;
      drag = null;
      /* švih nech nesie, ale nikdy nie o viac než dve karty */
      var momentum = Math.max(-2, Math.min(2, velocity * 0.18));
      settle(clamp(Math.round(position + momentum)));
    }

    frame.addEventListener("pointerup", endDrag);
    frame.addEventListener("pointercancel", endDrag);

    frame.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        move(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        move(1);
      }
    });

    if (prevButton) {
      prevButton.addEventListener("click", function () {
        move(-1);
      });
    }
    if (nextButton) {
      nextButton.addEventListener("click", function () {
        move(1);
      });
    }

    if (dotsBar) {
      cards.forEach(function (card, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "gallery-dot";
        dot.setAttribute("aria-label", "Zobrazit fotku " + (i + 1));
        dot.setAttribute("aria-current", i === 0 ? "true" : "false");
        dot.addEventListener("click", function () {
          toCard(i);
        });
        dotsBar.appendChild(dot);
        dots.push(dot);
      });
    }

    /*
     * Šírka karty určuje rozostup, hĺbku aj perspektívu, takže je to jediné,
     * čo sa oplatí merať — a len vtedy, keď sa rámec naozaj zmení.
     */
    function measure() {
      if (!cards[0]) return;
      width = cards[0].offsetWidth;
      render();
    }

    instances.push({ root: root, measure: measure });
    root.classList.add("is-live");
    frame.setAttribute("tabindex", "0");
    measure();

    if ("ResizeObserver" in window) {
      new ResizeObserver(measure).observe(frame);
    } else {
      var timer = 0;
      window.addEventListener("resize", function () {
        clearTimeout(timer);
        timer = setTimeout(measure, 150);
      });
    }

    /* obrázky sa dolaďujú asynchrónne, prvé meranie môže prísť priskoro */
    window.addEventListener("load", measure);
  }
})();
