(function () {
  "use strict";

  /*
   * Coverflow galéria. Bez JS zostane z pásu obyčajný vodorovný scroll so
   * snapom — až tento skript z neho spraví 3D karusel a prihodí šípky a bodky.
   *
   * Jediný zdroj pravdy je `poloha`: zlomkový index karty, ktorá je v strede.
   * Všetko ostatné sa z nej dopočíta. Kreslí sa priamo do DOM, nie cez stav —
   * šesťdesiat prepočtov za sekundu by inak znamenalo šesťdesiat prekreslení
   * všetkých kariet kvôli číslam, ktoré nikto nepotrebuje vidieť.
   */

  var korene = Array.prototype.slice.call(document.querySelectorAll(".galeria"));
  if (!korene.length) return;

  var bezPohybu =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* postavené karusely, nech vieme po prepnutí premerať ten odkrytý */
  var instancie = [];

  korene.forEach(postavit);

  prepnutie();

  /*
   * Prepínač medzi sadami. Skrytý karusel sa pri štarte nameria na nulu —
   * ResizeObserver si ho po odkrytí síce všimne, ale premerať ho rovno je
   * lacnejšie než spoliehať sa na poradie notifikácií.
   */
  function prepnutie() {
    var prepinac = document.querySelector(".galeria-prepinac");
    if (!prepinac) return;

    var sady = Array.prototype.slice.call(
      document.querySelectorAll(".galeria[data-sada]"),
    );
    if (sady.length < 2) return;

    prepinac.addEventListener("click", function (udalost) {
      var tlacidlo = udalost.target.closest("button[data-galeria]");
      if (!tlacidlo) return;

      var ktoru = tlacidlo.getAttribute("data-galeria");
      sady.forEach(function (sada) {
        sada.hidden = sada.getAttribute("data-sada") !== ktoru;
      });
      instancie.forEach(function (i) {
        if (!i.koren.hidden) i.premerat();
      });

      Array.prototype.forEach.call(
        prepinac.querySelectorAll("button"),
        function (b) {
          b.setAttribute("aria-pressed", String(b === tlacidlo));
        },
      );
    });

    /* bez JS by prepínač nemal čo prepínať, tak sa odkryje až tu */
    prepinac.classList.add("je-zive");
  }

  function postavit(koren) {
    var ramec = koren.querySelector(".galeria-ramec");
    var karty = Array.prototype.slice.call(
      koren.querySelectorAll(".galeria-karta"),
    );
    var vlavo = koren.querySelector(".galeria-sip-vlavo");
    var vpravo = koren.querySelector(".galeria-sip-vpravo");
    var pasBodiek = koren.querySelector(".galeria-bodky");
    var pocet = karty.length;
    if (!ramec || pocet < 2) return;

    /* pri málo kartách by sa prstenec začal prekrývať sám so sebou */
    var smycka = pocet >= 5;

    var OTOCENIE = 44; /* stupne, o ktoré sa nakloní prvá susedná karta */
    var HLBKA = 0.6; /* ako hlboko ustúpi, v násobkoch šírky karty */
    var UTLM = 0.56; /* exponent na vzdialenosť; pod 1 sklon vzdialením mäkne */
    var ZOSLABENIE = 0.1; /* koľko krytia ubudne na každý krok od stredu */
    var MEDZERA = 0.05; /* rozostup kariet, v násobkoch ich šírky */

    var poloha = 0;
    /*
     * Kam mieri práve prebiehajúce dosadanie. Keby sa krokovalo z `poloha`,
     * stlačenie šípky uprostred letu by sa stratilo — zaokrúhlenie by vrátilo
     * tú istú kartu, na ktorej sa už aj tak zastavuje.
     */
    var ciel = 0;
    var sirka = 0;
    var ziadost = null;
    var tah = null;
    var vybrana = 0;
    var bodky = [];

    function indexNa(p) {
      return ((Math.round(p) % pocet) + pocet) % pocet;
    }

    function orezat(p) {
      return smycka ? p : Math.max(0, Math.min(pocet - 1, p));
    }

    function vykreslit() {
      if (!sirka) return;
      var rozostup = sirka * (1 + MEDZERA);

      karty.forEach(function (karta, i) {
        /*
         * Vzdialenosť sa zloží na kratšiu cestu okolo prstenca. V tomto
         * jednom riadku je celé zacyklenie — žiadne klonované uzly, žiadne
         * presúvanie v DOM.
         */
        var odstup = i - poloha;
        if (smycka) {
          odstup = ((odstup % pocet) + pocet) % pocet;
          if (odstup > pocet / 2) odstup -= pocet;
        }

        var vzdialenost = Math.abs(odstup);
        /*
         * Sklon aj ústup slabnú so vzdialenosťou — dvojnásobná vzdialenosť
         * pridá len asi polovicu navyše. Lineárny nábeh by druhú kartu zavrel
         * naplocho; takto zostane čitateľná.
         */
        var rampa = Math.pow(vzdialenost, UTLM);
        var smer = odstup < 0 ? -1 : odstup > 0 ? 1 : 0;
        /* zastropované pred hranou, nech sa vzdialená karta neotočí chrbtom */
        var sklon = Math.min(OTOCENIE * rampa, 82) * smer;

        karta.style.transform =
          "translateX(calc(-50% + " +
          odstup * rozostup +
          "px)) translateZ(" +
          -HLBKA * sirka * rampa +
          "px) rotateY(" +
          -sklon +
          "deg)";

        /*
         * Karta sa cez prstenec prehodí presne v polovici obrátky, takže do
         * vtedy už musí byť neviditeľná — inak by bolo ten skok vidieť.
         */
        var hrana = smycka
          ? Math.min(1, Math.max(0, pocet / 2 - vzdialenost))
          : 1;
        karta.style.opacity = String(
          Math.max(0, 1 - ZOSLABENIE * vzdialenost) * hrana,
        );
        karta.style.zIndex = String(100 - Math.round(vzdialenost));
      });
    }

    function oznacit(index) {
      if (index === vybrana) return;
      vybrana = index;
      bodky.forEach(function (bodka, i) {
        bodka.setAttribute("aria-current", i === index ? "true" : "false");
      });
    }

    function dosadnut(kam) {
      if (ziadost !== null) cancelAnimationFrame(ziadost);
      ciel = kam;
      oznacit(indexNa(kam));

      if (bezPohybu) {
        poloha = kam;
        vykreslit();
        ziadost = null;
        return;
      }

      var krok = function () {
        var zostava = ciel - poloha;
        if (Math.abs(zostava) < 0.0004) {
          poloha = ciel;
          vykreslit();
          ziadost = null;
          return;
        }
        /* exponenciálne dobehnutie, nie pružina — dosadnutie nemá prestreliť */
        poloha += zostava * 0.16;
        vykreslit();
        ziadost = requestAnimationFrame(krok);
      };
      ziadost = requestAnimationFrame(krok);
    }

    function nasKartu(index) {
      /* kratšou cestou okolo prstenca, nie odvíjaním celého kola */
      var kam = smycka
        ? index + Math.round((ciel - index) / pocet) * pocet
        : index;
      dosadnut(orezat(kam));
    }

    function posunut(o) {
      dosadnut(orezat(Math.round(ciel) + o));
    }

    ramec.addEventListener("pointerdown", function (e) {
      if (ziadost !== null) {
        cancelAnimationFrame(ziadost);
        ziadost = null;
      }
      ramec.setPointerCapture(e.pointerId);
      ciel = poloha;
      tah = {
        id: e.pointerId,
        x: e.clientX,
        poloha: poloha,
        rychlost: 0,
        cas: performance.now(),
      };
    });

    ramec.addEventListener("pointermove", function (e) {
      if (!tah || tah.id !== e.pointerId) return;
      var rozostup = sirka * (1 + MEDZERA);
      if (!rozostup) return;

      var teraz = performance.now();
      var predtym = poloha;
      poloha = orezat(tah.poloha - (e.clientX - tah.x) / rozostup);
      /* kariet za sekundu, pre dohodenie */
      tah.rychlost =
        ((poloha - predtym) / Math.max(teraz - tah.cas, 1)) * 1000;
      tah.cas = teraz;

      oznacit(indexNa(poloha));
      vykreslit();
    });

    function koniecTahu(e) {
      if (!tah || tah.id !== e.pointerId) return;
      var rychlost = tah.rychlost;
      tah = null;
      /* švih nech nesie, ale nikdy nie o viac než dve karty */
      var zotrvacnost = Math.max(-2, Math.min(2, rychlost * 0.18));
      dosadnut(orezat(Math.round(poloha + zotrvacnost)));
    }

    ramec.addEventListener("pointerup", koniecTahu);
    ramec.addEventListener("pointercancel", koniecTahu);

    ramec.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        posunut(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        posunut(1);
      }
    });

    if (vlavo) {
      vlavo.addEventListener("click", function () {
        posunut(-1);
      });
    }
    if (vpravo) {
      vpravo.addEventListener("click", function () {
        posunut(1);
      });
    }

    if (pasBodiek) {
      karty.forEach(function (karta, i) {
        var bodka = document.createElement("button");
        bodka.type = "button";
        bodka.className = "galeria-bodka";
        bodka.setAttribute("aria-label", "Zobrazit fotku " + (i + 1));
        bodka.setAttribute("aria-current", i === 0 ? "true" : "false");
        bodka.addEventListener("click", function () {
          nasKartu(i);
        });
        pasBodiek.appendChild(bodka);
        bodky.push(bodka);
      });
    }

    /*
     * Šírka karty určuje rozostup, hĺbku aj perspektívu, takže je to jediné,
     * čo sa oplatí merať — a len vtedy, keď sa rámec naozaj zmení.
     */
    function premerat() {
      if (!karty[0]) return;
      sirka = karty[0].offsetWidth;
      vykreslit();
    }

    instancie.push({ koren: koren, premerat: premerat });
    koren.classList.add("je-zive");
    ramec.setAttribute("tabindex", "0");
    premerat();

    if ("ResizeObserver" in window) {
      new ResizeObserver(premerat).observe(ramec);
    } else {
      var cakanie = 0;
      window.addEventListener("resize", function () {
        clearTimeout(cakanie);
        cakanie = setTimeout(premerat, 150);
      });
    }

    /* obrázky sa dolaďujú asynchrónne, prvé meranie môže prísť priskoro */
    window.addEventListener("load", premerat);
  }
})();
