#!/usr/bin/env node


const https = require('https');
const fs = require('fs');
const path = require('path');

const MESTSKE_CASTI = [
  'Staré Mesto', 'Ružinov', 'Nové Mesto', 'Petržalka', 'Karlova Ves',
  'Dúbravka', 'Rača', 'Vrakuňa', 'Podunajské Biskupice', 'Devínska Nová Ves',
  'Lamač', 'Záhorská Bystrica', 'Devín', 'Vajnory', 'Jarovce', 'Rusovce', 'Čunovo',
];

const SKUPINY = {
  bary: ['bar', 'pub', 'wine_bar', 'night_club', 'bar_and_grill'],
  salony: ['hair_salon', 'beauty_salon', 'nail_salon', 'barber_shop', 'spa', 'massage'],
  auta: ['car_repair', 'car_wash', 'auto_parts_store', 'tire_shop', 'car_dealer'],
};


const OHRANICENIE = { low: { latitude: 48.03, longitude: 16.95 }, high: { latitude: 48.29, longitude: 17.30 } };

const POLIA = [
  'places.id', 'places.displayName', 'places.formattedAddress', 'places.websiteUri',
  'places.nationalPhoneNumber', 'places.rating', 'places.userRatingCount',
  'places.googleMapsUri', 'places.primaryTypeDisplayName', 'places.businessStatus',
  'nextPageToken',
].join(',');

function nacitajKluc() {
  if (process.env.GOOGLE_MAPS_API_KEY) return process.env.GOOGLE_MAPS_API_KEY.trim();
  const envSubor = path.join(__dirname, '.env');
  if (fs.existsSync(envSubor)) {
    const zhoda = fs.readFileSync(envSubor, 'utf8').match(/^\s*GOOGLE_MAPS_API_KEY\s*=\s*(.+)$/m);
    if (zhoda) return zhoda[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

function poziadavka(kluc, telo) {
  const data = JSON.stringify(telo);
  const nastavenia = {
    hostname: 'places.googleapis.com',
    path: '/v1/places:searchText',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      'X-Goog-Api-Key': kluc,
      'X-Goog-FieldMask': POLIA,
    },
  };
  return new Promise((splnene, zamietnute) => {
    const req = https.request(nastavenia, (res) => {
      let telo = '';
      res.on('data', (kus) => { telo += kus; });
      res.on('end', () => {
        let json;
        try { json = JSON.parse(telo); } catch (e) { return zamietnute(new Error(`Neplatná odpoveď (HTTP ${res.statusCode}): ${telo.slice(0, 200)}`)); }
        if (res.statusCode !== 200) {
          const sprava = (json.error && json.error.message) || `HTTP ${res.statusCode}`;
          const chyba = new Error(sprava);
          chyba.stav = res.statusCode;
          return zamietnute(chyba);
        }
        splnene(json);
      });
    });
    req.on('error', zamietnute);
    req.write(data);
    req.end();
  });
}

const pauza = (ms) => new Promise((r) => setTimeout(r, ms));

async function hladaj(kluc, dopyt, typ) {
  const vysledky = [];
  let pageToken = null;
  for (let strana = 0; strana < 3; strana++) {
    const telo = {
      textQuery: dopyt,
      includedType: typ,
      languageCode: 'sk',
      regionCode: 'SK',
      locationRestriction: { rectangle: OHRANICENIE },
    };
    if (pageToken) telo.pageToken = pageToken;
    const odpoved = await poziadavka(kluc, telo);
    vysledky.push(...(odpoved.places || []));
    pageToken = odpoved.nextPageToken;
    if (!pageToken) break;
    await pauza(300);
  }
  return vysledky;
}

function doCsv(hodnota) {
  const s = hodnota === undefined || hodnota === null ? '' : String(hodnota);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function hlavna() {
  const kluc = nacitajKluc();
  if (!kluc) {
    console.error('Chýba API kľúč. Daj ho do tools/.env ako GOOGLE_MAPS_API_KEY=...');
    process.exit(1);
  }

  const argumenty = process.argv.slice(2);
  const zvolene = (argumenty.find((a) => a.startsWith('--typy=')) || '--typy=vsetko').split('=')[1];
  const vystup = (argumenty.find((a) => a.startsWith('--out=')) || '--out=tools/leady.csv').split('=')[1];

  let typy;
  if (SKUPINY[zvolene]) typy = SKUPINY[zvolene];
  else typy = Object.values(SKUPINY).flat();

  const najdene = new Map();
  const preskocene = new Set();
  let volani = 0;
  let sWebom = 0;

  for (const cast of MESTSKE_CASTI) {
    for (const typ of typy) {
      if (preskocene.has(typ)) continue;
      const dopyt = `${typ.replace(/_/g, ' ')} Bratislava ${cast}`;
      let miesta;
      try {
        miesta = await hladaj(kluc, dopyt, typ);
        volani++;
      } catch (e) {
        if (/includedType|INVALID_ARGUMENT/i.test(e.message)) {
          preskocene.add(typ);
          console.warn(`  (typ "${typ}" API nepozná, preskakujem)`);
          continue;
        }
        console.error(`  chyba pri "${dopyt}": ${e.message}`);
        if (e.stav === 403 || e.stav === 429) process.exit(1);
        continue;
      }

      for (const m of miesta) {
        if (m.businessStatus && m.businessStatus !== 'OPERATIONAL') continue;
        if (m.websiteUri) { sWebom++; continue; }
        if (najdene.has(m.id)) continue;
        najdene.set(m.id, {
          nazov: m.displayName && m.displayName.text,
          kategoria: (m.primaryTypeDisplayName && m.primaryTypeDisplayName.text) || typ,
          adresa: m.formattedAddress,
          telefon: m.nationalPhoneNumber,
          hodnotenie: m.rating,
          pocetHodnoteni: m.userRatingCount,
          mapa: m.googleMapsUri,
          mestskaCast: cast,
        });
      }
      await pauza(150);
    }
    console.log(`${cast}: spolu ${najdene.size} podnikov bez webu`);
  }

  const zoradene = [...najdene.values()].sort((a, b) => (b.pocetHodnoteni || 0) - (a.pocetHodnoteni || 0));
  const hlavicka = ['Názov', 'Kategória', 'Adresa', 'Telefón', 'Hodnotenie', 'Počet hodnotení', 'Mestská časť', 'Google Maps'];
  const riadky = zoradene.map((z) => [z.nazov, z.kategoria, z.adresa, z.telefon, z.hodnotenie, z.pocetHodnoteni, z.mestskaCast, z.mapa].map(doCsv).join(';'));
  fs.writeFileSync(vystup, '\uFEFF' + [hlavicka.join(';'), ...riadky].join('\r\n'), 'utf8');

  console.log(`\n${volani} dopytov na API`);
  console.log(`${sWebom} podnikov web má (tie sú preč), ${zoradene.length} ho nemá`);
  console.log(`Uložené do ${vystup}`);
  console.log('\nTop 10 podľa počtu hodnotení:');
  zoradene.slice(0, 10).forEach((z, i) => {
    console.log(`${String(i + 1).padStart(2)}. ${z.nazov} — ${z.pocetHodnoteni || 0} hodnotení, ${z.telefon || 'bez telefónu'}`);
  });
}

hlavna().catch((e) => { console.error(e.message); process.exit(1); });
