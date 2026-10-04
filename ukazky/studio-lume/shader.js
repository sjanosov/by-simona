(function () {
  "use strict";

  /*
   * Hero fotka ide do WebGL ako textura: shader ju jemne vlni a prelieva
   * cez nu teple svetlo. Fotka v <picture> zostava v DOM ako zaloha —
   * platno sa zobrazi az ked je program prelozeny a textura nahrata, takze
   * bez WebGL, bez JS alebo pri obmedzenom pohybe sa nic nestane.
   */

  var hero = document.querySelector(".hero");
  var platno = document.querySelector(".hero-platno");
  var foto = document.querySelector(".hero-bg img");
  if (!hero || !platno || !foto) return;

  var bezPohybu =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (bezPohybu || !("IntersectionObserver" in window)) return;

  var gl = null;
  try {
    gl = platno.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
  } catch (e) {
    return;
  }
  if (!gl) return;

  var VRCHOLY = [
    "attribute vec2 a_poloha;",
    "void main() {",
    "  gl_Position = vec4(a_poloha, 0.0, 1.0);",
    "}",
  ].join("\n");

  var BODY = [
    "#ifdef GL_FRAGMENT_PRECISION_HIGH",
    "precision highp float;",
    "#else",
    "precision mediump float;",
    "#endif",
    "",
    "uniform sampler2D u_foto;",
    "uniform vec2 u_rozmer;",
    "uniform vec2 u_mierka;",
    "uniform float u_cas;",
    "uniform vec2 u_mys;",
    "uniform float u_sila;",
    "",
    "/*",
    " * Tri sinusy s nesudelitelnymi frekvenciami. Je to podstatne lacnejsie",
    " * nez sumovy fraktal a na pomaly svetelny zaves to vyzera rovnako",
    " * organicky - pri 60 fps cez cely hero na tom zalezi.",
    " */",
    "float pole(vec2 p, float t, float f) {",
    "  float v = sin(p.x * 2.9 + t + f);",
    "  v += sin(p.y * 2.3 - t * 0.83 + f * 1.7);",
    "  v += sin((p.x * 0.8 + p.y * 1.9) * 1.7 + t * 0.61 + f * 2.3);",
    "  return v * 0.3333;",
    "}",
    "",
    "void main() {",
    "  vec2 uv = gl_FragCoord.xy / u_rozmer;",
    "  float t = u_cas * 0.35;",
    "",
    "  /*",
    "   * uv sa nasobi 5.5 zamerne. Pri uv v rozsahu 0..1 sa faza cez cely",
    "   * zaber zmeni len o par radianov, pole je potom takmer rovnake pre",
    "   * kazdy bod a fotka sa miesto vlnenia posuva ako celok.",
    "   */",
    "  vec2 vlna = vec2(pole(uv * 5.5, t * 0.6, 0.0), pole(uv * 5.5, t * 0.6, 2.4));",
    "  vec2 mys = (u_mys - 0.5) * 0.006;",
    "  vec2 uvFoto = (uv - 0.5 + (vlna * 0.0012 + mys) * u_sila) * u_mierka;",
    "  vec3 snimka = texture2D(u_foto, clamp(uvFoto + 0.5, 0.0, 1.0)).rgb;",
    "  float jas = dot(snimka, vec3(0.299, 0.587, 0.114));",
    "",
    "  /*",
    "   * Stmavenie robi shader, nie CSS. Scrim lezal nad platnom a tlmil aj",
    "   * svetlo, ktore shader pridal - takto sa svetlo pridava az po nom.",
    "   * Kriva je ta ista ako v .hero::after.",
    "   */",
    "  vec2 d = (uv - vec2(0.5, 0.52)) / vec2(0.95, 0.8);",
    "  float r = min(length(d), 1.0);",
    "  float kruh = mix(0.64, 0.72, clamp(r / 0.58, 0.0, 1.0));",
    "  kruh = mix(kruh, 0.88, clamp((r - 0.58) / 0.42, 0.0, 1.0));",
    "  float spodok = 0.6 * (1.0 - clamp(uv.y / 0.55, 0.0, 1.0));",
    "  float tma = 1.0 - (1.0 - kruh) * (1.0 - spodok);",
    "  vec3 farba = mix(snimka, vec3(0.055, 0.043, 0.039), tma);",
    "",
    "  vec3 teplo = vec3(1.0, 0.86, 0.72);",
    "",
    "  /* svetelny pas s ostrejsim hrebenom, nech ma tvar */",
    "  float svetlo = pole(uv * vec2(2.2, 1.6), t * 0.7, 5.1);",
    "  svetlo = smoothstep(0.1, 0.75, svetlo);",
    "  farba += teplo * svetlo * 0.26 * u_sila;",
    "",
    "  /* len naozaj presvetlene body - ziarovky okolo zrkadla */",
    "  float odlesk = smoothstep(0.8, 0.98, jas);",
    "  float tep = 0.45 + 0.55 * sin(u_cas * 0.5 + uv.x * 5.0 + uv.y * 3.0);",
    "  farba += teplo * odlesk * tep * 0.5 * u_sila;",
    "",
    "  gl_FragColor = vec4(farba, 1.0);",
    "}",
  ].join("\n");

  function prelozit(typ, zdroj) {
    var kus = gl.createShader(typ);
    gl.shaderSource(kus, zdroj);
    gl.compileShader(kus);
    if (!gl.getShaderParameter(kus, gl.COMPILE_STATUS)) {
      /* jedine miesto, kde by tiche zlyhanie nebolo dohladatelne */
      window.console && console.error(gl.getShaderInfoLog(kus));
      gl.deleteShader(kus);
      return null;
    }
    return kus;
  }

  var vrcholovy = prelozit(gl.VERTEX_SHADER, VRCHOLY);
  var bodovy = prelozit(gl.FRAGMENT_SHADER, BODY);
  if (!vrcholovy || !bodovy) return;

  var program = gl.createProgram();
  gl.attachShader(program, vrcholovy);
  gl.attachShader(program, bodovy);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    window.console && console.error(gl.getProgramInfoLog(program));
    return;
  }
  gl.useProgram(program);
  gl.uniform1i(gl.getUniformLocation(program, "u_foto"), 0);

  var obdlznik = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, obdlznik);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );

  var aPoloha = gl.getAttribLocation(program, "a_poloha");
  gl.enableVertexAttribArray(aPoloha);
  gl.vertexAttribPointer(aPoloha, 2, gl.FLOAT, false, 0, 0);

  var uRozmer = gl.getUniformLocation(program, "u_rozmer");
  var uMierka = gl.getUniformLocation(program, "u_mierka");
  var uCas = gl.getUniformLocation(program, "u_cas");
  var uMys = gl.getUniformLocation(program, "u_mys");
  var uSila = gl.getUniformLocation(program, "u_sila");

  var textura = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, textura);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  /* fotky nie su mocninou dvojky, takze ziadne mipmapy a len CLAMP_TO_EDGE */
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  var nahrataZ = "";

  function nahratFotku() {
    if (!foto.complete || !foto.naturalWidth) return false;
    var zdroj = foto.currentSrc || foto.src;
    if (zdroj === nahrataZ) return true;
    try {
      gl.bindTexture(gl.TEXTURE_2D, textura);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, foto);
    } catch (e) {
      /* fotka z ineho zdroja by platno znecistila — radsej nechame <img> */
      return false;
    }
    nahrataZ = zdroj;
    return true;
  }

  /*
   * Strop na pocet bodov, ktore shader za snimok spracuje. Na 2x displeji by
   * hero 1600x900 vyslo na 5,8 Mpx, co uz integrovana grafika nedava. Fotku to
   * na retine vykresli asi na 1,3x — pod scrimom a pod „Lumé" to nevidno.
   */
  var STROP_BODOV = 2600000;

  function prisposobit() {
    var sirka = hero.clientWidth;
    var vyska = hero.clientHeight;
    if (!sirka || !vyska) return;

    var hustota = Math.min(window.devicePixelRatio || 1, 2);
    var plocha = sirka * vyska * hustota * hustota;
    if (plocha > STROP_BODOV) hustota *= Math.sqrt(STROP_BODOV / plocha);

    var w = Math.max(1, Math.round(sirka * hustota));
    var h = Math.max(1, Math.round(vyska * hustota));
    if (platno.width !== w || platno.height !== h) {
      platno.width = w;
      platno.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRozmer, w, h);

    /* vyrez ako object-fit: cover */
    var pomerPlatna = w / h;
    var pomerFoto = (foto.naturalWidth || w) / (foto.naturalHeight || h);
    if (pomerPlatna > pomerFoto) {
      gl.uniform2f(uMierka, 1, pomerFoto / pomerPlatna);
    } else {
      gl.uniform2f(uMierka, pomerPlatna / pomerFoto, 1);
    }
  }

  var cielMysi = [0.5, 0.5];
  var mys = [0.5, 0.5];

  hero.addEventListener("mousemove", function (e) {
    var ramec = hero.getBoundingClientRect();
    if (!ramec.width || !ramec.height) return;
    cielMysi[0] = (e.clientX - ramec.left) / ramec.width;
    cielMysi[1] = 1 - (e.clientY - ramec.top) / ramec.height;
  });

  hero.addEventListener("mouseleave", function () {
    cielMysi[0] = 0.5;
    cielMysi[1] = 0.5;
  });

  var SNIMOK = 1000 / 30;
  var bezi = false;
  var ziadost = 0;
  var cas = 0;
  var predosly = 0;
  var sila = 0;
  var zive = false;

  function kreslit(teraz) {
    ziadost = requestAnimationFrame(kreslit);
    if (teraz - predosly < SNIMOK) return;
    var krok = predosly ? Math.min((teraz - predosly) / 1000, 0.1) : 0;
    predosly = teraz;

    if (!nahratFotku()) return;

    /* efekt nabehne az po tom, co sa platno prelinalo cez fotku */
    if (sila < 1) sila = Math.min(1, sila + krok / 1.2);
    mys[0] += (cielMysi[0] - mys[0]) * 0.05;
    mys[1] += (cielMysi[1] - mys[1]) * 0.05;

    cas += krok;
    gl.uniform1f(uCas, cas);
    gl.uniform2f(uMys, mys[0], mys[1]);
    gl.uniform1f(uSila, sila);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    if (!zive) {
      zive = true;
      hero.classList.add("ma-shader");
      platno.classList.add("je-zive");
    }
  }

  function spustit() {
    if (bezi) return;
    bezi = true;
    predosly = 0;
    ziadost = requestAnimationFrame(kreslit);
  }

  function zastavit() {
    if (!bezi) return;
    bezi = false;
    cancelAnimationFrame(ziadost);
  }

  prisposobit();
  if (!nahratFotku()) {
    foto.addEventListener("load", function () {
      prisposobit();
    });
  }

  var vidno = false;

  var sledovac = new IntersectionObserver(
    function (zaznamy) {
      vidno = zaznamy[0].isIntersecting;
      if (vidno && !document.hidden) spustit();
      else zastavit();
    },
    { threshold: 0 },
  );
  sledovac.observe(hero);

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) zastavit();
    else if (vidno) spustit();
  });

  var cakanie = 0;
  window.addEventListener("resize", function () {
    clearTimeout(cakanie);
    cakanie = setTimeout(prisposobit, 150);
  });

  platno.addEventListener("webglcontextlost", function (e) {
    e.preventDefault();
    zastavit();
    zive = false;
    hero.classList.remove("ma-shader");
    platno.classList.remove("je-zive");
  });
})();
