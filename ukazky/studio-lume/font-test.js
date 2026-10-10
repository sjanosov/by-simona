/*
 * DOČASNÉ, len na skúšanie fontov v prehliadači. Pred ostrým nasadením
 * zmaž tento súbor aj <script> naň v index.html.
 *
 * Stránka beží na štyroch premenných: --display (navigácia, tlačidlá,
 * veľké nadpisy), --body (bežný text), --heading (písané nadpisy sekcií)
 * a --script (ozdobné písmo). Tento súbor ich vie prepísať za hocijaký
 * font z Google Fonts a sám si ho dotiahne.
 *
 * V konzole:
 *   fonts("Playfair Display")                 : zmení len --display
 *   fonts("Playfair Display", "Inter")        : --display a --body
 *   fonts({ heading: "Caveat" })              : hociktorú rolu zvlášť
 *   fonts.pair(2)                             : nasadí dvojicu zo zoznamu
 *   fonts.pairs()                             : vypíše pripravené dvojice
 *   fonts.state()                             : čo je práve nasadené
 *   fonts.reset()                             : späť na pôvodné fonty
 *
 * Nastavenie drží len do obnovenia stránky, v súboroch sa nič nemení.
 */
(function () {
  "use strict";

  var ROLES = {
    display: "--display",
    body: "--body",
    heading: "--heading",
    script: "--script",
  };

  /* záloha pre fonts.state(), čo je v CSS, kým do toho niekto nesiahne */
  var original = {};
  Object.keys(ROLES).forEach(function (role) {
    original[role] = getComputedStyle(document.documentElement)
      .getPropertyValue(ROLES[role])
      .trim();
  });

  var PAIRS = [
    { display: "Playfair Display", body: "Inter" },
    { display: "Cormorant Garamond", body: "Jost" },
    { display: "Bodoni Moda", body: "Work Sans" },
    { display: "Marcellus", body: "Karla" },
    { display: "Syne", body: "Manrope" },
    { display: "Italiana", body: "Mulish" },
  ];

  var applied = {};
  var requested = {};

  /*
   * Google vráti 400, keď font nemá žiadaný rez. Vtedy ho pýtame ešte raz
   * bez váh, radšej jeden rez než nič.
   */
  function load(family, withWeights) {
    var key = family + (withWeights ? "" : " (bez váh)");
    if (requested[key]) return;
    requested[key] = true;

    var slug = family.replace(/ /g, "+");
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.dataset.fontTest = family;
    link.href =
      "https://fonts.googleapis.com/css2?family=" +
      slug +
      (withWeights ? ":wght@400;500;600;700" : "") +
      "&display=swap";

    link.addEventListener("error", function () {
      link.remove();
      if (withWeights) {
        load(family, false);
      } else {
        console.warn(
          "fonts: " + family + " sa nepodarilo načítať, preklep v názve?",
        );
      }
    });

    document.head.appendChild(link);
  }

  function apply(role, family) {
    var fallback =
      role === "heading" || role === "script"
        ? '"Segoe Script", cursive'
        : "system-ui, Arial, sans-serif";

    load(family, true);
    document.documentElement.style.setProperty(
      ROLES[role],
      '"' + family + '", ' + fallback,
    );
    applied[role] = family;
  }

  function fonts(first, second) {
    if (!first) return fonts.state();

    var input =
      typeof first === "string"
        ? second
          ? { display: first, body: second }
          : { display: first }
        : first;

    Object.keys(input).forEach(function (role) {
      if (!ROLES[role]) {
        console.warn(
          "fonts: rola '" +
            role +
            "' neexistuje, poznám " +
            Object.keys(ROLES).join(", "),
        );
        return;
      }
      apply(role, input[role]);
    });

    return fonts.state();
  }

  fonts.pair = function (number) {
    var pair = PAIRS[number - 1];
    if (!pair) return fonts.pairs();
    return fonts(pair);
  };

  fonts.pairs = function () {
    PAIRS.forEach(function (pair, i) {
      console.log(
        "fonts.pair(" + (i + 1) + ")  " + pair.display + " + " + pair.body,
      );
    });
  };

  fonts.state = function () {
    var out = {};
    Object.keys(ROLES).forEach(function (role) {
      out[role] = applied[role] || original[role].replace(/"/g, "");
    });
    return out;
  };

  fonts.reset = function () {
    Object.keys(ROLES).forEach(function (role) {
      document.documentElement.style.removeProperty(ROLES[role]);
    });
    Array.prototype.forEach.call(
      document.querySelectorAll("link[data-font-test]"),
      function (link) {
        link.remove();
      },
    );
    applied = {};
    requested = {};
    return fonts.state();
  };

  window.fonts = fonts;

  console.log(
    "%cfonts()%c skúšanie Google Fonts\n" +
      'fonts("Playfair Display", "Inter")   fonts({ heading: "Caveat" })\n' +
      "fonts.pairs()   fonts.pair(1)   fonts.state()   fonts.reset()\n" +
      "role: display (navigácia, nadpisy), body (text), heading (písané), script",
    "font-weight:700",
    "font-weight:400",
  );
})();
