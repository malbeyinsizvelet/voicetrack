import type { Project, RecordingLine } from '../types';

// ============================================================
// MOCK PROJECTS — Phase 15 (Final Demo)
// 3 gerçekçi proje: aktif animasyon, aktif oyun, beklemede AAA
// Gerçek backend entegrasyonunda bu dosya kaldırılır.
// ============================================================

function makeLine(
  overrides: Partial<RecordingLine> & Pick<RecordingLine, 'id' | 'taskId' | 'lineNumber' | 'status'>
): RecordingLine {
  return {
    originalText: undefined, translatedText: undefined, timecode: undefined,
    sourceFile: undefined, recordedFile: undefined,
    directorNote: undefined, artistNote: undefined,
    retakeCount: 0,
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2025-01-10T09:00:00Z',
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────
// PROJE 1 — Galaksi Savaşçıları
// ──────────────────────────────────────────────────────────────

const task1Lines: RecordingLine[] = [
  makeLine({
    id: 'line1_1', taskId: 'task1', lineNumber: 1, status: 'approved',
    originalText: 'All hands on deck! We have incoming fire!',
    translatedText: 'Herkes güverteye! Düşman ateşi geliyor!',
    timecode: '00:01:14:08', retakeCount: 0,
    sourceFile: {
      id: 'sf_l1_1', taskId: 'task1', type: 'source',
      fileName: 'nova_ep01_ln001_src.wav', fileSize: 1_240_000, duration: 3.1,
      url: '/mock/audio/nova_ep01_ln001_src.wav', uploadedBy: 'u2',
      uploadedAt: '2025-01-10T09:00:00Z',
    },
    recordedFile: {
      id: 'rf_l1_1', taskId: 'task1', type: 'recorded',
      fileName: 'nova_ep01_ln001_rec.wav', fileSize: 1_380_000, duration: 3.1,
      url: '/mock/audio/nova_ep01_ln001_rec.wav', uploadedBy: 'u3',
      uploadedAt: '2025-01-18T11:00:00Z',
    },
    updatedAt: '2025-01-18T11:00:00Z',
  }),
  makeLine({
    id: 'line1_2', taskId: 'task1', lineNumber: 2, status: 'approved',
    originalText: 'Zara, charge the shields! Full power!',
    translatedText: 'Zara, kalkanları güçlendir! Tam güç!',
    timecode: '00:01:18:22', retakeCount: 1,
    directorNote: 'İkinci retake çok daha iyi.',
    sourceFile: {
      id: 'sf_l1_2', taskId: 'task1', type: 'source',
      fileName: 'nova_ep01_ln002_src.wav', fileSize: 980_000, duration: 2.4,
      url: '/mock/audio/nova_ep01_ln002_src.wav', uploadedBy: 'u2',
      uploadedAt: '2025-01-10T09:00:00Z',
    },
    recordedFile: {
      id: 'rf_l1_2', taskId: 'task1', type: 'recorded',
      fileName: 'nova_ep01_ln002_rec_v2.wav', fileSize: 1_050_000, duration: 2.4,
      url: '/mock/audio/nova_ep01_ln002_rec_v2.wav', uploadedBy: 'u3',
      uploadedAt: '2025-01-19T14:30:00Z',
    },
    updatedAt: '2025-01-19T14:30:00Z',
  }),
  makeLine({
    id: 'line1_3', taskId: 'task1', lineNumber: 3, status: 'recorded',
    originalText: 'This is not the end. We fight until the last star goes dark.',
    translatedText: 'Bu son değil. Son yıldız sönene kadar savaşırız.',
    timecode: '00:03:44:10', retakeCount: 0,
    artistNote: 'Duygusal sahne, biraz daha ağır okudum.',
    sourceFile: {
      id: 'sf_l1_3', taskId: 'task1', type: 'source',
      fileName: 'nova_ep01_ln003_src.wav', fileSize: 2_100_000, duration: 5.2,
      url: '/mock/audio/nova_ep01_ln003_src.wav', uploadedBy: 'u2',
      uploadedAt: '2025-01-10T09:00:00Z',
    },
    recordedFile: {
      id: 'rf_l1_3', taskId: 'task1', type: 'recorded',
      fileName: 'nova_ep01_ln003_rec.wav', fileSize: 2_250_000, duration: 5.2,
      url: '/mock/audio/nova_ep01_ln003_rec.wav', uploadedBy: 'u3',
      uploadedAt: '2025-01-20T09:15:00Z',
    },
    updatedAt: '2025-01-20T09:15:00Z',
  }),
  makeLine({
    id: 'line1_4', taskId: 'task1', lineNumber: 4, status: 'rejected',
    originalText: 'Robotik-7, calculate our escape vector immediately!',
    translatedText: 'Robotik-7, kaçış vektörümüzü hemen hesapla!',
    timecode: '00:05:12:04', retakeCount: 2,
    directorNote: 'Aciliyet hissedilmiyor. Daha hızlı ve gergin oku. Retake gerekiyor.',
    sourceFile: {
      id: 'sf_l1_4', taskId: 'task1', type: 'source',
      fileName: 'nova_ep01_ln004_src.wav', fileSize: 1_560_000, duration: 3.9,
      url: '/mock/audio/nova_ep01_ln004_src.wav', uploadedBy: 'u2',
      uploadedAt: '2025-01-10T09:00:00Z',
    },
    recordedFile: {
      id: 'rf_l1_4', taskId: 'task1', type: 'recorded',
      fileName: 'nova_ep01_ln004_rec_v2.wav', fileSize: 1_480_000, duration: 3.9,
      url: '/mock/audio/nova_ep01_ln004_rec_v2.wav', uploadedBy: 'u3',
      uploadedAt: '2025-01-20T16:00:00Z',
    },
    updatedAt: '2025-01-21T10:00:00Z',
  }),
  makeLine({
    id: 'line1_5', taskId: 'task1', lineNumber: 5, status: 'pending',
    originalText: 'Set course for Nebula Station. Maximum warp.',
    translatedText: "Rotayı Nebula İstasyonu'na ayarla. Maksimum hız.",
    timecode: '00:07:33:18', retakeCount: 0,
    sourceFile: {
      id: 'sf_l1_5', taskId: 'task1', type: 'source',
      fileName: 'nova_ep01_ln005_src.wav', fileSize: 890_000, duration: 2.2,
      url: '/mock/audio/nova_ep01_ln005_src.wav', uploadedBy: 'u2',
      uploadedAt: '2025-01-10T09:00:00Z',
    },
  }),
  makeLine({
    id: 'line1_6', taskId: 'task1', lineNumber: 6, status: 'pending',
    originalText: "I won't abandon my crew. Not now, not ever.",
    translatedText: 'Ekibimi terk etmem. Şimdi değil, asla.',
    timecode: '00:09:05:03', retakeCount: 0,
    directorNote: 'Duygusal ağırlık var, yürek sesi gerekiyor.',
    sourceFile: {
      id: 'sf_l1_6', taskId: 'task1', type: 'source',
      fileName: 'nova_ep01_ln006_src.wav', fileSize: 1_120_000, duration: 2.8,
      url: '/mock/audio/nova_ep01_ln006_src.wav', uploadedBy: 'u2',
      uploadedAt: '2025-01-10T09:00:00Z',
    },
  }),
  makeLine({
    id: 'line1_7', taskId: 'task1', lineNumber: 7, status: 'pending',
    originalText: "Fire all cannons! Show them what we're made of!",
    translatedText: 'Tüm topları ateşle! Ne olduğumuzu göster onlara!',
    timecode: '00:11:48:20', retakeCount: 0,
    sourceFile: {
      id: 'sf_l1_7', taskId: 'task1', type: 'source',
      fileName: 'nova_ep01_ln007_src.wav', fileSize: 1_350_000, duration: 3.4,
      url: '/mock/audio/nova_ep01_ln007_src.wav', uploadedBy: 'u2',
      uploadedAt: '2025-01-10T09:00:00Z',
    },
  }),
  makeLine({
    id: 'line1_8', taskId: 'task1', lineNumber: 8, status: 'pending',
    originalText: "Victory is ours. But stay sharp — this isn't over.",
    translatedText: 'Zafer bizim. Ama dikkatli olun — bu bitmedi.',
    timecode: '00:18:22:12', retakeCount: 0,
  }),
];

const task2Lines: RecordingLine[] = [
  makeLine({
    id: 'line2_1', taskId: 'task2', lineNumber: 1, status: 'approved',
    originalText: 'Captain, shields are at forty percent.',
    translatedText: 'Kaptan, kalkanlar yüzde kırk.',
    timecode: '00:01:15:02', retakeCount: 0,
    sourceFile: {
      id: 'sf_l2_1', taskId: 'task2', type: 'source',
      fileName: 'zara_ep01_ln001_src.wav', fileSize: 850_000, duration: 2.1,
      url: '/mock/audio/zara_ep01_ln001_src.wav', uploadedBy: 'u2',
      uploadedAt: '2025-01-10T09:00:00Z',
    },
    recordedFile: {
      id: 'rf_l2_1', taskId: 'task2', type: 'recorded',
      fileName: 'zara_ep01_ln001_rec.wav', fileSize: 920_000, duration: 2.1,
      url: '/mock/audio/zara_ep01_ln001_rec.wav', uploadedBy: 'u4',
      uploadedAt: '2025-01-22T10:00:00Z',
    },
    updatedAt: '2025-01-22T10:00:00Z',
  }),
  makeLine({
    id: 'line2_2', taskId: 'task2', lineNumber: 2, status: 'approved',
    originalText: 'Initiating emergency protocols. All crew brace for impact.',
    translatedText: 'Acil protokoller başlatılıyor. Tüm mürettebat çarpışmaya hazırlanın.',
    timecode: '00:01:19:15', retakeCount: 0,
    sourceFile: {
      id: 'sf_l2_2', taskId: 'task2', type: 'source',
      fileName: 'zara_ep01_ln002_src.wav', fileSize: 1_420_000, duration: 3.6,
      url: '/mock/audio/zara_ep01_ln002_src.wav', uploadedBy: 'u2',
      uploadedAt: '2025-01-10T09:00:00Z',
    },
    recordedFile: {
      id: 'rf_l2_2', taskId: 'task2', type: 'recorded',
      fileName: 'zara_ep01_ln002_rec.wav', fileSize: 1_550_000, duration: 3.6,
      url: '/mock/audio/zara_ep01_ln002_rec.wav', uploadedBy: 'u4',
      uploadedAt: '2025-01-22T11:00:00Z',
    },
    updatedAt: '2025-01-22T11:00:00Z',
  }),
  makeLine({
    id: 'line2_3', taskId: 'task2', lineNumber: 3, status: 'approved',
    originalText: 'Calculations complete. Escape window is seventeen seconds.',
    translatedText: 'Hesaplar tamamlandı. Kaçış penceresi on yedi saniye.',
    timecode: '00:05:44:08', retakeCount: 0,
    sourceFile: {
      id: 'sf_l2_3', taskId: 'task2', type: 'source',
      fileName: 'zara_ep01_ln003_src.wav', fileSize: 1_180_000, duration: 2.9,
      url: '/mock/audio/zara_ep01_ln003_src.wav', uploadedBy: 'u2',
      uploadedAt: '2025-01-10T09:00:00Z',
    },
    recordedFile: {
      id: 'rf_l2_3', taskId: 'task2', type: 'recorded',
      fileName: 'zara_ep01_ln003_rec.wav', fileSize: 1_260_000, duration: 2.9,
      url: '/mock/audio/zara_ep01_ln003_rec.wav', uploadedBy: 'u4',
      uploadedAt: '2025-01-22T11:30:00Z',
    },
    updatedAt: '2025-01-22T11:30:00Z',
  }),
];

const task3Lines: RecordingLine[] = [
  makeLine({
    id: 'line3_1', taskId: 'task3', lineNumber: 1, status: 'pending',
    originalText: 'Affirmative, Captain. Processing...',
    translatedText: 'Anlaşıldı, Kaptan. İşleniyor...',
    timecode: '00:01:45:00', retakeCount: 0,
    directorNote: 'Robotik ton, mekanik duraksamalar ekle.',
  }),
  makeLine({
    id: 'line3_2', taskId: 'task3', lineNumber: 2, status: 'pending',
    originalText: 'Warning. Hull integrity at sixty-two percent.',
    translatedText: 'Uyarı. Gövde bütünlüğü yüzde altmış iki.',
    timecode: '00:02:10:14', retakeCount: 0,
  }),
  makeLine({
    id: 'line3_3', taskId: 'task3', lineNumber: 3, status: 'pending',
    originalText: 'Scanning... No life forms detected in sector seven.',
    translatedText: 'Taranıyor... Yedinci sektörde yaşam formu tespit edilmedi.',
    timecode: '00:04:33:21', retakeCount: 0,
  }),
];

// ──────────────────────────────────────────────────────────────
// PROJE 2 — Minik Kaşifler
// ──────────────────────────────────────────────────────────────

const task4Lines: RecordingLine[] = [
  makeLine({
    id: 'line4_1', taskId: 'task4', lineNumber: 1, status: 'approved',
    originalText: 'Look at that! A glowing crystal!',
    translatedText: 'Bak şuna! Işıldayan bir kristal!',
    timecode: '00:00:45:10', retakeCount: 0,
    sourceFile: {
      id: 'sf_l4_1', taskId: 'task4', type: 'source',
      fileName: 'ela_s02_ln001_src.wav', fileSize: 760_000, duration: 1.9,
      url: '/mock/audio/ela_s02_ln001_src.wav', uploadedBy: 'u2',
      uploadedAt: '2025-01-06T09:00:00Z',
    },
    recordedFile: {
      id: 'rf_l4_1', taskId: 'task4', type: 'recorded',
      fileName: 'ela_s02_ln001_rec.wav', fileSize: 820_000, duration: 1.9,
      url: '/mock/audio/ela_s02_ln001_rec.wav', uploadedBy: 'u4',
      uploadedAt: '2025-01-14T10:00:00Z',
    },
    updatedAt: '2025-01-15T09:00:00Z',
  }),
  makeLine({
    id: 'line4_2', taskId: 'task4', lineNumber: 2, status: 'approved',
    originalText: "If we follow the river, we'll find the hidden valley!",
    translatedText: 'Nehri takip edersek gizli vadiyi buluruz!',
    timecode: '00:02:18:06', retakeCount: 0,
    sourceFile: {
      id: 'sf_l4_2', taskId: 'task4', type: 'source',
      fileName: 'ela_s02_ln002_src.wav', fileSize: 1_380_000, duration: 3.4,
      url: '/mock/audio/ela_s02_ln002_src.wav', uploadedBy: 'u2',
      uploadedAt: '2025-01-06T09:00:00Z',
    },
    recordedFile: {
      id: 'rf_l4_2', taskId: 'task4', type: 'recorded',
      fileName: 'ela_s02_ln002_rec.wav', fileSize: 1_450_000, duration: 3.4,
      url: '/mock/audio/ela_s02_ln002_rec.wav', uploadedBy: 'u4',
      uploadedAt: '2025-01-15T14:00:00Z',
    },
    updatedAt: '2025-01-18T12:00:00Z',
  }),
];

const task5Lines: RecordingLine[] = [
  makeLine({
    id: 'line5_1', taskId: 'task5', lineNumber: 1, status: 'approved',
    originalText: 'Eureka! The formula is complete!',
    translatedText: 'Eureka! Formül tamamlandı!',
    timecode: '00:01:02:18', retakeCount: 0,
    sourceFile: {
      id: 'sf_l5_1', taskId: 'task5', type: 'source',
      fileName: 'prof_s02_ln001_src.wav', fileSize: 920_000, duration: 2.3,
      url: '/mock/audio/prof_s02_ln001_src.wav', uploadedBy: 'u2',
      uploadedAt: '2025-01-07T09:00:00Z',
    },
    recordedFile: {
      id: 'rf_l5_1', taskId: 'task5', type: 'recorded',
      fileName: 'prof_s02_ln001_rec.wav', fileSize: 1_010_000, duration: 2.3,
      url: '/mock/audio/prof_s02_ln001_rec.wav', uploadedBy: 'u3',
      uploadedAt: '2025-01-14T11:00:00Z',
    },
    updatedAt: '2025-01-14T11:00:00Z',
  }),
  makeLine({
    id: 'line5_2', taskId: 'task5', lineNumber: 2, status: 'recorded',
    originalText: 'My dear children, science is the greatest adventure of all!',
    translatedText: 'Sevgili çocuklar, bilim en büyük maceradan!',
    timecode: '00:03:44:10', retakeCount: 0,
    artistNote: 'Biraz abartılı okudum, yönetmen onayını bekleyeyim.',
    sourceFile: {
      id: 'sf_l5_2', taskId: 'task5', type: 'source',
      fileName: 'prof_s02_ln002_src.wav', fileSize: 1_880_000, duration: 4.7,
      url: '/mock/audio/prof_s02_ln002_src.wav', uploadedBy: 'u2',
      uploadedAt: '2025-01-07T09:00:00Z',
    },
    recordedFile: {
      id: 'rf_l5_2', taskId: 'task5', type: 'recorded',
      fileName: 'prof_s02_ln002_rec.wav', fileSize: 2_010_000, duration: 4.7,
      url: '/mock/audio/prof_s02_ln002_rec.wav', uploadedBy: 'u3',
      uploadedAt: '2025-01-16T10:00:00Z',
    },
    updatedAt: '2025-01-16T10:00:00Z',
  }),
  makeLine({
    id: 'line5_3', taskId: 'task5', lineNumber: 3, status: 'pending',
    originalText: 'Oh no, I forgot where I put my glasses again!',
    translatedText: 'Of, gözlüklerimi yine nereye koyduğumu unuttum!',
    timecode: '00:06:22:05', retakeCount: 0,
    directorNote: 'Komik ama çok abartmadan. Yaşlı, dalgın ton.',
    sourceFile: {
      id: 'sf_l5_3', taskId: 'task5', type: 'source',
      fileName: 'prof_s02_ln003_src.wav', fileSize: 1_140_000, duration: 2.8,
      url: '/mock/audio/prof_s02_ln003_src.wav', uploadedBy: 'u2',
      uploadedAt: '2025-01-07T09:00:00Z',
    },
  }),
  makeLine({
    id: 'line5_4', taskId: 'task5', lineNumber: 4, status: 'pending',
    originalText: 'The machine will malfunction if you press that button!',
    translatedText: 'O düğmeye basarsan makine bozulur!',
    timecode: '00:09:10:22', retakeCount: 0,
  }),
];

// ──────────────────────────────────────────────────────────────
// PROJE 3 — Kara Şehir (AAA Oyun — on_hold, cast var ama henüz ses yok)
// ──────────────────────────────────────────────────────────────

const task6Lines: RecordingLine[] = [
  makeLine({
    id: 'line6_1', taskId: 'task6', lineNumber: 1, status: 'pending',
    originalText: "The city never sleeps. Neither do I.",
    translatedText: 'Şehir hiç uyumaz. Ben de.',
    timecode: '00:00:12:05', retakeCount: 0,
    directorNote: 'Noir ton. Yavaş, kasıtlı, yorgun ama keskin.',
  }),
  makeLine({
    id: 'line6_2', taskId: 'task6', lineNumber: 2, status: 'pending',
    originalText: "Everyone has a price. Find out what yours is.",
    translatedText: 'Herkesin bir bedeli vardır. Seninkileri öğren.',
    timecode: '00:00:45:18', retakeCount: 0,
    directorNote: 'Tehdit içermiyor, sadece gerçeği söylüyor gibi.',
  }),
  makeLine({
    id: 'line6_3', taskId: 'task6', lineNumber: 3, status: 'pending',
    originalText: "I trusted you. That was my first mistake.",
    translatedText: 'Sana güvendim. Bu ilk hatam oldu.',
    timecode: '00:02:30:00', retakeCount: 0,
  }),
];

const task7Lines: RecordingLine[] = [
  makeLine({
    id: 'line7_1', taskId: 'task7', lineNumber: 1, status: 'pending',
    originalText: "You shouldn't be here. Leave while you still can.",
    translatedText: 'Burada olmamalısın. Henüz yapabilecekken git.',
    timecode: '00:01:10:04', retakeCount: 0,
    directorNote: 'Gizemli. Korku değil, uyarı tonu.',
  }),
  makeLine({
    id: 'line7_2', taskId: 'task7', lineNumber: 2, status: 'pending',
    originalText: "The past doesn't let go. It never does.",
    translatedText: 'Geçmiş bırakmaz. Hiçbir zaman bırakmaz.',
    timecode: '00:04:22:14', retakeCount: 0,
  }),
];

// ──────────────────────────────────────────────────────────────
// EXPORT
// ──────────────────────────────────────────────────────────────

export const MOCK_PROJECTS: Project[] = [
  // ── PROJE 1: Galaksi Savaşçıları ───────────────────────────
  {
    id: 'proj1',
    title: 'Galaksi Savaşçıları – Türkçe Dublaj',
    clientName: 'Nebula Film A.Ş.',
    description:
      'Amerikan yapımı animasyon dizisinin 1. sezon Türkçe dublajı. Toplam 13 bölüm, bölüm başına ~22 dk.',
    status: 'active',
    managerId: 'u2',
    managerName: 'Selin Kaya',
    coverColor: '#6366f1',
    dueDate: '2025-03-31',
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2025-01-21T10:00:00Z',
    characters: [
      {
        id: 'ch1', projectId: 'proj1', name: 'Kaptan Nova',
        description: 'Ana kahraman, cesur ve kararlı',
        voiceNotes: 'Orta-derin erkek sesi, otoriter ama sıcak. Ep01-03 öncelikli.',
        gender: 'male', priority: 'critical',
        lineCount: 148, completedCount: 62,
        assignedArtistId: 'u3', assignedArtistName: 'Mert Demir',
        taskId: 'task1', order: 1,
        createdAt: '2025-01-10T09:00:00Z', updatedAt: '2025-01-21T10:00:00Z',
      },
      {
        id: 'ch2', projectId: 'proj1', name: 'Zara',
        description: 'Bilim subayı, zeki ve analitik',
        voiceNotes: 'Tiz kadın sesi, net telaffuz',
        gender: 'female', priority: 'high',
        lineCount: 92, completedCount: 92,
        assignedArtistId: 'u4', assignedArtistName: 'Ayşe Çelik',
        taskId: 'task2', order: 2,
        createdAt: '2025-01-10T09:00:00Z', updatedAt: '2025-01-22T11:30:00Z',
      },
      {
        id: 'ch3', projectId: 'proj1', name: 'Robotik-7',
        description: 'Robot yardımcı, mekanik konuşma tarzı',
        voiceNotes: 'Hafif robotik efekt uygulanacak, base ses doğal olmalı',
        gender: 'neutral', priority: 'normal',
        lineCount: 55, completedCount: 0,
        assignedArtistId: 'u3', assignedArtistName: 'Mert Demir',
        taskId: 'task3', order: 3,
        createdAt: '2025-01-10T09:00:00Z', updatedAt: '2025-01-10T09:00:00Z',
      },
    ],
    tasks: [
      {
        id: 'task1', projectId: 'proj1', characterId: 'ch1',
        characterName: 'Kaptan Nova',
        assignedTo: 'u3', assignedArtistName: 'Mert Demir',
        lineCount: 148, status: 'in_progress',
        sourceFiles: [{
          id: 'af1', taskId: 'task1', type: 'source',
          fileName: 'kaptan_nova_ep01_source.wav',
          fileSize: 45_200_000, duration: 940,
          url: '/mock/audio/source1.wav', uploadedBy: 'u2',
          uploadedAt: '2025-01-10T09:00:00Z',
        }],
        recordedFiles: [],
        lines: task1Lines,
        notes: 'Ep01-03 öncelikli olarak tamamlanmalı.',
        dueDate: '2025-02-15',
        createdAt: '2025-01-10T09:00:00Z', updatedAt: '2025-01-21T10:00:00Z',
      },
      {
        id: 'task2', projectId: 'proj1', characterId: 'ch2',
        characterName: 'Zara',
        assignedTo: 'u4', assignedArtistName: 'Ayşe Çelik',
        lineCount: 92, status: 'uploaded',
        sourceFiles: [{
          id: 'af2', taskId: 'task2', type: 'source',
          fileName: 'zara_ep01_source.wav',
          fileSize: 28_500_000, duration: 595,
          url: '/mock/audio/source2.wav', uploadedBy: 'u2',
          uploadedAt: '2025-01-10T09:00:00Z',
        }],
        recordedFiles: [{
          id: 'af3', taskId: 'task2', type: 'recorded',
          fileName: 'zara_ep01_recorded_v1.wav',
          fileSize: 31_000_000, duration: 595,
          url: '/mock/audio/recorded2.wav', uploadedBy: 'u4',
          uploadedAt: '2025-01-22T11:30:00Z',
        }],
        lines: task2Lines,
        dueDate: '2025-02-20',
        createdAt: '2025-01-10T09:00:00Z', updatedAt: '2025-01-22T11:30:00Z',
      },
      {
        id: 'task3', projectId: 'proj1', characterId: 'ch3',
        characterName: 'Robotik-7',
        assignedTo: 'u3', assignedArtistName: 'Mert Demir',
        lineCount: 55, status: 'pending',
        sourceFiles: [], recordedFiles: [],
        lines: task3Lines,
        dueDate: '2025-03-01',
        createdAt: '2025-01-10T09:00:00Z', updatedAt: '2025-01-10T09:00:00Z',
      },
    ],
  },

  // ── PROJE 2: Minik Kaşifler ────────────────────────────────
  {
    id: 'proj2',
    title: 'Minik Kaşifler – Bölüm 2',
    clientName: 'Gökkuşağı Prodüksiyon',
    description: 'Çocuk animasyon serisi, 2. sezon seslendirme çalışması. 8 bölüm, bölüm başına ~15 dk.',
    status: 'active',
    managerId: 'u2',
    managerName: 'Selin Kaya',
    coverColor: '#10b981',
    dueDate: '2025-04-30',
    createdAt: '2025-01-05T08:00:00Z',
    updatedAt: '2025-01-18T12:00:00Z',
    characters: [
      {
        id: 'ch4', projectId: 'proj2', name: 'Ela',
        description: 'Meraklı 8 yaşında kız çocuğu',
        voiceNotes: 'Neşeli, enerjik, çocuksu ses',
        gender: 'female', priority: 'critical',
        lineCount: 210, completedCount: 210,
        assignedArtistId: 'u4', assignedArtistName: 'Ayşe Çelik',
        taskId: 'task4', order: 1,
        createdAt: '2025-01-06T09:00:00Z', updatedAt: '2025-01-18T12:00:00Z',
      },
      {
        id: 'ch5', projectId: 'proj2', name: 'Profesör Kıvılcım',
        description: 'Yaşlı, bilge ama komik bilim insanı',
        voiceNotes: 'Boğuk, yaşlı erkek sesi. Komik aksanlar serbest.',
        gender: 'male', priority: 'high',
        lineCount: 87, completedCount: 40,
        assignedArtistId: 'u3', assignedArtistName: 'Mert Demir',
        taskId: 'task5', order: 2,
        createdAt: '2025-01-06T09:00:00Z', updatedAt: '2025-01-16T10:00:00Z',
      },
    ],
    tasks: [
      {
        id: 'task4', projectId: 'proj2', characterId: 'ch4',
        characterName: 'Ela',
        assignedTo: 'u4', assignedArtistName: 'Ayşe Çelik',
        lineCount: 210, status: 'qc_approved',
        sourceFiles: [{
          id: 'af4', taskId: 'task4', type: 'source',
          fileName: 'ela_s02_source.wav',
          fileSize: 62_000_000, duration: 1280,
          url: '/mock/audio/source4.wav', uploadedBy: 'u2',
          uploadedAt: '2025-01-06T09:00:00Z',
        }],
        recordedFiles: [{
          id: 'af5', taskId: 'task4', type: 'recorded',
          fileName: 'ela_s02_recorded_v2.wav',
          fileSize: 65_000_000, duration: 1280,
          url: '/mock/audio/recorded4.wav', uploadedBy: 'u4',
          uploadedAt: '2025-01-15T14:00:00Z',
        }],
        lines: task4Lines,
        dueDate: '2025-02-28',
        createdAt: '2025-01-06T09:00:00Z', updatedAt: '2025-01-18T12:00:00Z',
      },
      {
        id: 'task5', projectId: 'proj2', characterId: 'ch5',
        characterName: 'Profesör Kıvılcım',
        assignedTo: 'u3', assignedArtistName: 'Mert Demir',
        lineCount: 87, status: 'in_progress',
        sourceFiles: [{
          id: 'af6', taskId: 'task5', type: 'source',
          fileName: 'prof_kivarcim_s02_source.wav',
          fileSize: 24_000_000, duration: 510,
          url: '/mock/audio/source5.wav', uploadedBy: 'u2',
          uploadedAt: '2025-01-07T09:00:00Z',
        }],
        recordedFiles: [],
        lines: task5Lines,
        dueDate: '2025-03-15',
        createdAt: '2025-01-06T09:00:00Z', updatedAt: '2025-01-16T10:00:00Z',
      },
    ],
  },

  // ── PROJE 3: Kara Şehir (on_hold — cast var, ses yüklenmemiş) ─
  {
    id: 'proj3',
    title: 'Kara Şehir – Oyun Seslendirmesi',
    clientName: 'PixelStorm Games',
    description:
      'AAA noir oyun projesi. 40+ karakter seslendirmesi, ana hikaye + yan görevler. Script onay sürecinde beklemede.',
    status: 'on_hold',
    managerId: 'u1',
    managerName: 'Ahmet Yılmaz',
    coverColor: '#f59e0b',
    dueDate: '2025-09-30',
    createdAt: '2024-11-20T10:00:00Z',
    updatedAt: '2025-01-05T09:00:00Z',
    characters: [
      {
        id: 'ch6', projectId: 'proj3', name: 'Dedektif Kara',
        description: 'Yorgun, cynical dedektif. Noir film tadında.',
        voiceNotes: 'Derin, kısık erkek sesi. Film noir tonu. Ses geride kalacak şekilde mikrofon mesafesi ayarlanacak.',
        gender: 'male', priority: 'critical',
        lineCount: 320, completedCount: 0,
        assignedArtistId: 'u3', assignedArtistName: 'Mert Demir',
        taskId: 'task6', order: 1,
        createdAt: '2024-11-25T10:00:00Z', updatedAt: '2025-01-05T09:00:00Z',
      },
      {
        id: 'ch7', projectId: 'proj3', name: 'Gizem',
        description: 'Gizemli bilgi kaynağı. Güvenilirliği tartışmalı.',
        voiceNotes: 'Orta, biraz tok kadın sesi. Kontrollü, her kelimeyi ölçüp biçiyor gibi.',
        gender: 'female', priority: 'high',
        lineCount: 145, completedCount: 0,
        assignedArtistId: undefined, assignedArtistName: undefined,
        taskId: 'task7', order: 2,
        createdAt: '2024-11-25T10:00:00Z', updatedAt: '2024-11-25T10:00:00Z',
      },
    ],
    tasks: [
      {
        id: 'task6', projectId: 'proj3', characterId: 'ch6',
        characterName: 'Dedektif Kara',
        assignedTo: 'u3', assignedArtistName: 'Mert Demir',
        lineCount: 320, status: 'pending',
        sourceFiles: [],
        recordedFiles: [],
        lines: task6Lines,
        notes: 'Script onayı bekleniyor. Kaynak sesler script onayı sonrasında yüklenecek.',
        dueDate: '2025-08-01',
        createdAt: '2024-11-25T10:00:00Z', updatedAt: '2025-01-05T09:00:00Z',
      },
      {
        id: 'task7', projectId: 'proj3', characterId: 'ch7',
        characterName: 'Gizem',
        assignedTo: undefined, assignedArtistName: undefined,
        lineCount: 145, status: 'pending',
        sourceFiles: [],
        recordedFiles: [],
        lines: task7Lines,
        notes: 'Sanatçı atanmamış. Casting sürecinde.',
        dueDate: '2025-08-15',
        createdAt: '2024-11-25T10:00:00Z', updatedAt: '2024-11-25T10:00:00Z',
      },
    ],
  },
];
