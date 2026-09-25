#!/usr/bin/env node

const fs = require('fs');

const SEGMENT = {
  'Kúpele': 10, 'Masáže': 10, 'Massage spa': 10, 'Sauna': 9, 'Starostlivosť o nohy': 9,
  'Salón krásy': 9, 'Kozmetik': 9, 'Maskér': 8, 'Salónik': 8,
  'Kaderníctvo': 7, 'Holičstvo': 7, 'Nechtové štúdio': 7,
  'Reštaurácia': 5, 'Pizzeria': 5, 'Bistro': 5, 'Kaviareň': 5, 'Pekáreň': 5,
  'Nočný klub': 5, 'Športový klub': 5,
  'Vináreň': 4, 'Piváreň': 4,
  'Bar': 3, 'Športový bar': 3, 'Irish Pub': 3, 'Predajňa liehovín': 3,
  'Krčma': 2, 'Gastronomická krčma': 2, 'Poliklinika': 2,
};

const DOVOD = {
  10: 'vysoká cena úkonu, zákazník si podnik pred návštevou overuje',
  9: 'objednávkový model + cenník, ktorý sa na IG nedá udržať',
  8: 'objednávkový model + cenník, ktorý sa na IG nedá udržať',
  7: 'objednávky cez Messenger sa dajú nahradiť rezervačným systémom',
  5: 'menu a otváracie hodiny, čiastočne pokryté Google profilom',
  4: 'eventy a súkromné akcie, inak stačí Google profil',
  3: 'návštevu neplánujú dopredu, web pridá málo',
  2: 'návštevu neplánujú dopredu, web pridá málo',
};

const riadky = fs.readFileSync('tools/leady.csv', 'utf8').replace(/^\uFEFF/, '').trim().split(/\r?\n/);
const hlavicka = riadky.shift();

function rozdel(riadok) {
  const out = []; let akt = ''; let vUvodzovkach = false;
  for (let i = 0; i < riadok.length; i++) {
    const z = riadok[i];
    if (z === '"') { if (vUvodzovkach && riadok[i + 1] === '"') { akt += '"'; i++; } else vUvodzovkach = !vUvodzovkach; }
    else if (z === ';' && !vUvodzovkach) { out.push(akt); akt = ''; }
    else akt += z;
  }
  out.push(akt); return out;
}

const leady = riadky.map((r) => {
  const [nazov, kategoria, adresa, telefon, hodnotenie, pocet, cast, mapa] = rozdel(r);
  const n = parseInt(pocet, 10) || 0;
  const segment = SEGMENT[kategoria] !== undefined ? SEGMENT[kategoria] : 4;

  const dopyt = Math.min(10, Math.log10(n + 1) * 5);
  return {
    nazov, kategoria, adresa, telefon, hodnotenie, pocet: n, cast, mapa,
    segment, skore: Math.round((segment * 1.5 + dopyt) * 10) / 10,
    dovod: DOVOD[segment] || 'zmiešaný prípad',
  };
});

const uroven = (s) => (s >= 19 ? 'A' : s >= 15 ? 'B' : s >= 11 ? 'C' : 'D');
leady.forEach((l) => { l.uroven = uroven(l.skore); });
leady.sort((a, b) => b.skore - a.skore);

const esc = (v) => (/[";\n]/.test(String(v ?? '')) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ''));
const hlav = ['Priorita', 'Skóre', 'Názov', 'Kategória', 'Prečo web', 'Telefón', 'Hodnotení', 'Mestská časť', 'Adresa', 'Google Maps'];
const von = leady.map((l) => [l.uroven, l.skore, l.nazov, l.kategoria, l.dovod, l.telefon, l.pocet, l.cast, l.adresa, l.mapa].map(esc).join(';'));
fs.writeFileSync('tools/leady-prioritne.csv', '\uFEFF' + [hlav.join(';'), ...von].join('\r\n'), 'utf8');

for (const u of ['A', 'B', 'C', 'D']) {
  const sk = leady.filter((l) => l.uroven === u);
  const sTel = sk.filter((l) => l.telefon).length;
  console.log(`\n--- Priorita ${u}: ${sk.length} podnikov (${sTel} s telefónom) ---`);
  const podlaKat = {};
  sk.forEach((l) => { podlaKat[l.kategoria] = (podlaKat[l.kategoria] || 0) + 1; });
  console.log(Object.entries(podlaKat).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} ${v}`).join(', '));
  sk.slice(0, 5).forEach((l) => console.log(`   ${l.skore}  ${l.nazov} — ${l.kategoria}, ${l.pocet} hodnotení`));
}
console.log('\nUložené do tools/leady-prioritne.csv');
