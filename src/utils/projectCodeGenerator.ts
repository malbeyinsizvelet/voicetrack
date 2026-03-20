// ============================================================
// PROJECT CODE GENERATOR
// Proje adından HF klasör kodu üretir.
//
// Kural:
//   "Resident Evil 7"  → "RE7"   → HF klasör: "Project RE7"
//   "Kara Şehir"       → "KS"    → HF klasör: "Project KS"
//   "Galaksi Savaşçıları" → "GS" → HF klasör: "Project GS"
//
// Öncelik sırası:
//   1. Bilinen kısaltmalar sözlüğü
//   2. Büyük harf + rakam pattern (ResidentEvil7 → RE7)
//   3. Kelime baş harfleri (max 4) + sondaki rakam
//   4. Fallback: ilk 2-4 harf büyük
// ============================================================

// ─── Bilinen kısaltmalar sözlüğü ─────────────────────────────
// Yaygın oyun/yapım isimlerini buraya ekle.
// Anahtar: küçük harf, normalize edilmiş.
const KNOWN_CODES: Record<string, string> = {
  'resident evil 7':          'RE7',
  'resident evil 2':          'RE2',
  'resident evil 3':          'RE3',
  'resident evil 4':          'RE4',
  'resident evil village':    'REV',
  'final fantasy vii':        'FF7',
  'final fantasy xvi':        'FF16',
  'the witcher 3':            'TW3',
  'the witcher':              'TW',
  'cyberpunk 2077':           'CP77',
  'god of war':               'GOW',
  'red dead redemption':      'RDR',
  'red dead redemption 2':    'RDR2',
  'the last of us':           'TLOU',
  'the last of us part ii':   'TLOU2',
  'death stranding':          'DS',
  'ghost of tsushima':        'GOT',
  'horizon zero dawn':        'HZD',
  'horizon forbidden west':   'HFW',
  'assassins creed':          'AC',
  "assassin's creed":        'AC',
  'galaksi savaşçıları':      'GS',
  'minik kaşifler':           'MK',
  'kara şehir':               'KS',
};

// ─── Türkçe özel karakter normalizasyonu ─────────────────────
function normalizeTurkish(str: string): string {
  return str
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U');
}

// ─── Yaygın stop words (kısa tutmak için atlanır) ──────────────
const STOP_WORDS = new Set([
  'the', 'of', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for',
  'bir', 've', 'ile', 'da', 'de', 'ta', 'te', 'bu', 'şu',
]);

// ─── Ana üretici fonksiyon ────────────────────────────────────

/**
 * Proje adından kısa, temiz bir kod üretir.
 *
 * @param projectTitle Proje/oyun adı
 * @returns Örn: "RE7", "GS", "MK2"
 */
export function generateProjectCode(projectTitle: string): string {
  if (!projectTitle?.trim()) return 'PROJ';

  const normalized = projectTitle.trim().toLowerCase();

  // 1. Bilinen kısaltmalar sözlüğü
  for (const [key, code] of Object.entries(KNOWN_CODES)) {
    if (normalized.includes(key) || normalized === key) {
      return code;
    }
  }

  // 2. Büyük harf + rakam pattern (CamelCase veya akronim)
  //    "ResidentEvil7" → büyük harfler + rakamlar → RE7
  const camelMatch = normalizeTurkish(projectTitle)
    .match(/[A-Z][a-z]*/g);
  if (camelMatch && camelMatch.length >= 2) {
    const initials = camelMatch.map((w) => w[0]).join('');
    const trailingNum = projectTitle.match(/\d+$/)?.[0] ?? '';
    if (initials.length >= 2 && initials.length <= 6) {
      return (initials + trailingNum).toUpperCase();
    }
  }

  // 3. Kelime baş harfleri (stop word'ler atlanır) + sondaki rakam
  const words = normalized.split(/\s+/).filter(Boolean);
  const sOnce = words.filter((w) => !STOP_WORDS.has(w));
  const trailingNumMatch = normalized.match(/(\d+)\s*$/);
  const trailingNum = trailingNumMatch ? trailingNumMatch[1] : '';
  const baseWords = trailingNum ? sOnce.filter((w) => isNaN(Number(w))) : sOnce;

  if (baseWords.length > 0) {
    const initials = baseWords
      .slice(0, 4)
      .map((w) => normalizeTurkish(w)[0].toUpperCase())
      .join('');
    return initials + trailingNum;
  }

  // 4. Fallback: ilk 2-4 alfanumerik karakter büyük
  const fallback = normalizeTurkish(projectTitle)
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase();

  return fallback || 'PROJ';
}

/**
 * HF repo kök klasör adını üretir.
 * Format: "Project {CODE}"
 *
 * @example
 *   buildProjectFolderName("Resident Evil 7") → "Project RE7"
 *   buildProjectFolderName("Galaksi Savaşçıları") → "Project GS"
 */
export function buildProjectFolderName(projectTitle: string): string {
  const code = generateProjectCode(projectTitle);
  return `Project ${code}`;
}

/**
 * Proje klasörü altındaki 3 ana alt klasör sabitleri.
 * Mixed ileride mix/master aşaması için hazır.
 */
export const PROJECT_SUBFOLDERS = {
  originals: 'Originals',
  recorded:  'Recorded',
  mixed:     'Mixed',
} as const;

export type ProjectSubfolder = typeof PROJECT_SUBFOLDERS[keyof typeof PROJECT_SUBFOLDERS];
