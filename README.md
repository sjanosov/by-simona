# Unoria — statický web

Jednoduchý statický web pripravený na GitHub Pages. Bez WordPressu, Elementoru a pluginov.

## Spustenie
Nahrajte obsah tohto priečinka do koreňa GitHub repozitára. V Settings → Pages zvoľte Deploy from a branch, `main`, `/ (root)`. Lokálne otvorte `index.html`.

## Pred publikovaním
1. Overte názov Unoria, doménu a ochranné známky.
2. Kontaktná sekcia odkazuje na `simona@unoria-studio.sk`. Schránka zatiaľ NIE JE zriadená: pred publikovaním kúpte doménu, aktivujte e-mail a overte prijímanie aj odosielanie.
3. Stránka `ochrana-osobnych-udajov.html` je iba koncept. Doplňte údaje prevádzkovateľa a upravte podľa skutočného spracúvania údajov.
4. Fonty sa zatiaľ načítavajú cez Google Fonts. Pre minimalizáciu externých požiadaviek ich nahraďte lokálnymi súbormi alebo systémovými fontmi; skontrolujte právne požiadavky a hosting.
5. Projektové karty Ubytovanie Sološnica a Astrokareta sú grafické ilustrácie, NIE screenshoty aktuálnych webov. Nahraďte ich skutočnými screenshotmi po schválení. Beauty obrázok je z pôvodnej zálohy PureWebStudio a je označený ako demo vo vývoji.
6. Fotografia Simony je zo zálohy PureWebStudio. Skontrolujte, či ju chcete používať.
7. Preverte finálne znenie marketingových textov a ponúkaných služieb.

## Súbory
- `index.html` — obsah stránky
- `style.scss` — čitateľný zdrojový súbor štýlov
- `style.css` — CSS používané prehliadačom (ponechané pre GitHub Pages)
- `script.js` — mobilné menu a scroll animácie
- `assets/` — iba dva vybrané obrázky z pôvodnej zálohy
- `ochrana-osobnych-udajov.html` — pracovný koncept informácií o údajoch

## Úprava štýlov

Upravujte `style.scss` a po zmene vytvorte CSS príkazom:

```bash
npx --yes sass --no-source-map style.scss style.css
```

GitHub Pages SCSS nekompiluje automaticky; `index.html` a stránka ochrany údajov preto naďalej načítavajú `style.css`.

## Portfólio aktualizované
Štyri karty: Shades Lounge Bar, Ubytovanie Sološnica, Astrokareta a Hair Studio (demo vo vývoji). Screenshoty sú optimalizované do WebP a uložené v `assets/`. Hair Studio používa existujúci obrázok z predchádzajúcej zálohy, nejde o hotový klientsky web.


## Animácie
Jemný nástup hero textu a obrázka, postupné zobrazenie služieb a portfólia, hover kariet a tlačidiel, responzívna časová os a focus formulára. Bez externých JS knižníc. Rešpektuje `prefers-reduced-motion`; bez JS je obsah viditeľný. `style.scss` a `style.css` sú synchronizované.

## Nová kontaktná sekcia
Bez formulára; priame `mailto:` na simona@unoria-studio.sk. E-mail je iba plánovaná adresa, nebol aktivovaný ani otestovaný.

Kontakt: kliknutie na e-mailovú adresu ju kopíruje do schránky (Clipboard API, na HTTPS/GitHub Pages); samostatné tlačidlo Napísať e-mail otvára mailto. Adresu treba najprv aktivovať.

## Kontakt – aktualizácia
Jediným kontaktným prvkom je e-mailová adresa. Kliknutie skopíruje adresu, tooltip zmení text na „Adresa je skopírovaná“. Kopírovanie vyžaduje HTTPS alebo localhost a aktivovanú e-mailovú schránku.
