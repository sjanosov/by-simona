# by simona. — by-simona.eu

Responzívny statický web pripravený pre GitHub Pages. Nahraj obsah priečinka do repozitára.

## Úprava štýlov

`style.scss` je upravený zdroj s premennými pre farby, font a veľkosti, vnorenými selektormi a oddelenými responzívnymi blokmi. Staré opravné bloky sú odstránené. `style.css` je pripravený výsledný CSS s rovnakými deklaráciami. Po každej ďalšej zmene SCSS spusti:

```bash
npx sass style.scss style.css --no-source-map
```

## Obsah

Štyri projekty: Shades Lounge Bar, Ubytovanie Sološnica, Astrokareta a Hair Salon (demo). `script.js` zachováva animácie pri scrollovaní, postupnú animáciu časovej osi, mobilnú navigáciu a kopírovanie e-mailu. Obrázky sú v `assets/`.

Písmo DM Sans je hosťované lokálne v `fonts/` (bez Google Fonts). `robots.txt` a `sitemap.xml` sú v koreni – pri pridaní novej stránky ju doplň do sitemap.

Pred publikovaním over doménu, aktivuj `hello@by-simona.eu`, doplň údaje prevádzkovateľa v `ochrana-osobnych-udajov.html` (meno, IČO, adresa) a doplň odkazy na sociálne siete a projekt Shades, ak sú k dispozícii. Po spustení pridaj web do Google Search Console a odošli `sitemap.xml`.
