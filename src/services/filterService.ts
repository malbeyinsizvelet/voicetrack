// ============================================================
// FILTER SERVICE — Phase 11
// Görev ve replik listelerinin filtrele/arama/sıralama mantığı.
// Bileşenler bu servisi çağırır — mantık bileşen dışında tutulur.
// İleride backend'e taşındığında yalnızca bu dosya değişir.
// ============================================================

import type {
  Task,
  RecordingLine,
  TaskFilter,
  LineFilter,
  LineStatus,
  TaskStatus,
  TaskSortKey,
  SearchMatch,
  MyTask,
} from '../types';

// ─── Defaults ────────────────────────────────────────────────

export const DEFAULT_TASK_FILTER: TaskFilter = {
  search:      '',
  status:      'all',
  lineStatus:  'all',
  hasRecorded: null,
  hasPending:  null,
  sort:        'character',
  sortDir:     'asc',
};

export const DEFAULT_LINE_FILTER: LineFilter = {
  search:      '',
  status:      'all',
  hasRecorded: null,
  sort:        'number',
};

// ─── Yardımcı ────────────────────────────────────────────────

/** Bir string'deki query'yi case-insensitive arar */
function includes(text: string | undefined, q: string): boolean {
  if (!text) return false;
  return text.toLowerCase().includes(q.toLowerCase());
}

/** Task'taki aktif replik sayısı (approved + recorded) */
export function countUploaded(task: Pick<Task, 'lines'>): number {
  return (task.lines ?? []).filter(
    (l) => l.status === 'recorded' || l.status === 'approved'
  ).length;
}

export function countPending(task: Pick<Task, 'lines'>): number {
  return (task.lines ?? []).filter((l) => l.status === 'pending').length;
}

export function taskProgressPercent(task: Pick<Task, 'lines'>): number {
  const lines = task.lines ?? [];
  if (lines.length === 0) return 0;
  const done = lines.filter(
    (l) => l.status === 'approved' || l.status === 'recorded'
  ).length;
  return Math.round((done / lines.length) * 100);
}

// ─── Task Status sort weight ──────────────────────────────────

const TASK_STATUS_WEIGHT: Record<TaskStatus, number> = {
  qc_rejected:  0,
  pending:      1,
  in_progress:  2,
  uploaded:     3,
  qc_approved:  4,
  mixed:        5,
  final:        6,
};

// ─── filterTasks ─────────────────────────────────────────────

/**
 * Görev listesini filtrele + sırala.
 * @param tasks - ham Task dizisi (proje veya artist'e ait)
 * @param filter - kullanıcının seçtiği filtre state'i
 * @returns filtrelenmiş + sıralanmış Task dizisi
 */
export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  let list = [...tasks];

  // ── Metin araması ────────────────────────────────────────
  if (filter.search.trim()) {
    const q = filter.search.trim();
    list = list.filter((t) =>
      includes(t.characterName, q) ||
      includes(t.notes, q) ||
      includes(t.assignedArtistName, q) ||
      (t.lines ?? []).some(
        (l) =>
          includes(l.originalText, q) ||
          includes(l.translatedText, q) ||
          includes(l.timecode, q) ||
          includes(l.directorNote, q) ||
          includes(l.sourceFile?.fileName, q) ||
          includes(l.recordedFile?.fileName, q) ||
          String(l.lineNumber).includes(q)
      ) ||
      (t.sourceFiles ?? []).some((f) => includes(f.fileName, q)) ||
      (t.recordedFiles ?? []).some((f) => includes(f.fileName, q))
    );
  }

  // ── Task durum filtresi ──────────────────────────────────
  if (filter.status !== 'all') {
    list = list.filter((t) => t.status === filter.status);
  }

  // ── Replik durum filtresi (en az 1 replik bu durumda) ───
  if (filter.lineStatus !== 'all') {
    list = list.filter((t) =>
      t.lines.some((l) => l.status === filter.lineStatus)
    );
  }

  // ── Kayıt var mı? ────────────────────────────────────────
  if (filter.hasRecorded === true) {
    list = list.filter((t) => countUploaded(t) > 0);
  } else if (filter.hasRecorded === false) {
    list = list.filter((t) => countUploaded(t) === 0);
  }

  // ── Bekleyen replik var mı? ──────────────────────────────
  if (filter.hasPending === true) {
    list = list.filter((t) => countPending(t) > 0);
  } else if (filter.hasPending === false) {
    list = list.filter((t) => countPending(t) === 0);
  }

  // ── Sıralama ─────────────────────────────────────────────
  list.sort((a, b) => {
    let cmp = 0;
    switch (filter.sort as TaskSortKey) {
      case 'character':
        cmp = a.characterName.localeCompare(b.characterName, 'tr');
        break;
      case 'status':
        cmp = (TASK_STATUS_WEIGHT[a.status] ?? 9) - (TASK_STATUS_WEIGHT[b.status] ?? 9);
        break;
      case 'progress':
        cmp = taskProgressPercent(a) - taskProgressPercent(b);
        break;
      case 'updated':
        cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      case 'lines':
        cmp = a.lines.length - b.lines.length;
        break;
    }
    return filter.sortDir === 'desc' ? -cmp : cmp;
  });

  return list;
}

// ─── filterMyTasks (Artist görünümü) ─────────────────────────

export function filterMyTasks(tasks: MyTask[], filter: TaskFilter): MyTask[] {
  let list = [...tasks];

  if (filter.search.trim()) {
    const q = filter.search.trim();
    list = list.filter(
      (t) =>
        includes(t.characterName, q) ||
        includes(t.projectTitle, q) ||
        includes(t.clientName, q) ||
        includes(t.voiceNotes, q) ||
        includes(t.characterDescription, q) ||
        t.lines.some(
          (l) =>
            includes(l.originalText, q) ||
            includes(l.translatedText, q) ||
            includes(l.timecode, q) ||
            includes(l.directorNote, q) ||
            includes(l.sourceFile?.fileName, q) ||
            String(l.lineNumber).includes(q)
        )
    );
  }

  if (filter.status !== 'all') {
    list = list.filter((t) => t.status === filter.status);
  }

  if (filter.lineStatus !== 'all') {
    list = list.filter((t) =>
      t.lines.some((l) => l.status === filter.lineStatus)
    );
  }

  if (filter.hasRecorded === true) {
    list = list.filter((t) => countUploaded(t) > 0);
  } else if (filter.hasRecorded === false) {
    list = list.filter((t) => countUploaded(t) === 0);
  }

  if (filter.hasPending === true) {
    list = list.filter((t) => countPending(t) > 0);
  } else if (filter.hasPending === false) {
    list = list.filter((t) => countPending(t) === 0);
  }

  // Artist sort: öncelik de var
  list.sort((a, b) => {
    const PRIO: Record<string, number> = {
      critical: 0, high: 1, normal: 2, low: 3,
    };
    let cmp = 0;
    switch (filter.sort as TaskSortKey) {
      case 'character':
        cmp = a.characterName.localeCompare(b.characterName, 'tr');
        break;
      case 'status':
        cmp = (TASK_STATUS_WEIGHT[a.status] ?? 9) - (TASK_STATUS_WEIGHT[b.status] ?? 9);
        break;
      case 'progress':
        cmp = taskProgressPercent(a) - taskProgressPercent(b);
        break;
      case 'updated':
        cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      case 'lines':
        cmp = a.lines.length - b.lines.length;
        break;
    }
    // Aynıysa önceliğe göre ikincil sıra
    if (cmp === 0) {
      cmp = (PRIO[a.characterPriority ?? 'normal'] ?? 2) - (PRIO[b.characterPriority ?? 'normal'] ?? 2);
    }
    return filter.sortDir === 'desc' ? -cmp : cmp;
  });

  return list;
}

// ─── filterLines ─────────────────────────────────────────────

/**
 * Bir task'ın replik listesini filtrele + sırala.
 */
export function filterLines(
  lines: RecordingLine[],
  filter: LineFilter
): RecordingLine[] {
  let list = [...lines];

  // ── Metin araması ────────────────────────────────────────
  if (filter.search.trim()) {
    const q = filter.search.trim();
    list = list.filter(
      (l) =>
        String(l.lineNumber).includes(q) ||
        includes(l.originalText, q) ||
        includes(l.translatedText, q) ||
        includes(l.timecode, q) ||
        includes(l.directorNote, q) ||
        includes(l.artistNote, q) ||
        includes(l.sourceFile?.fileName, q) ||
        includes(l.recordedFile?.fileName, q)
    );
  }

  // ── Durum filtresi ───────────────────────────────────────
  if (filter.status !== 'all') {
    list = list.filter((l) => l.status === (filter.status as LineStatus));
  }

  // ── Kayıt var mı? ────────────────────────────────────────
  if (filter.hasRecorded === true) {
    list = list.filter((l) => !!l.recordedFile);
  } else if (filter.hasRecorded === false) {
    list = list.filter((l) => !l.recordedFile);
  }

  // ── Sıralama ─────────────────────────────────────────────
  if (filter.sort === 'status') {
    const LINE_STATUS_WEIGHT: Record<LineStatus, number> = {
      rejected: 0, retake: 1, pending: 2, recorded: 3, approved: 4,
    };
    list.sort((a, b) => LINE_STATUS_WEIGHT[a.status] - LINE_STATUS_WEIGHT[b.status]);
  } else {
    list.sort((a, b) => a.lineNumber - b.lineNumber);
  }

  return list;
}

// ─── searchTasks (hızlı arama sonuçları) ─────────────────────

/**
 * Arama sorgusuna göre Task listesinde eşleşme bul.
 * İleride backend full-text search'e geçildiğinde bu fonksiyon wrapper'a dönüşür.
 */
export function searchTasks(tasks: Task[], query: string): SearchMatch[] {
  if (!query.trim()) return [];
  const q = query.trim();
  const results: SearchMatch[] = [];

  for (const task of tasks) {
    // Karakter adı eşleşmesi
    if (includes(task.characterName, q)) {
      results.push({
        taskId: task.id,
        characterName: task.characterName,
        matchField: 'character',
        snippet: task.characterName,
        query: q,
      });
      continue; // Task seviyesinde bulduk, line'lara gerek yok
    }

    // Görev notu
    if (includes(task.notes, q)) {
      results.push({
        taskId: task.id,
        characterName: task.characterName,
        matchField: 'note',
        snippet: task.notes!,
        query: q,
      });
    }

    // Dosya adı
    const matchedFile = [
      ...task.sourceFiles,
      ...task.recordedFiles,
    ].find((f) => includes(f.fileName, q));
    if (matchedFile) {
      results.push({
        taskId: task.id,
        characterName: task.characterName,
        matchField: 'fileName',
        snippet: matchedFile.fileName,
        query: q,
      });
    }

    // Replik eşleşmeleri
    for (const line of task.lines) {
      if (includes(line.originalText, q) || includes(line.translatedText, q)) {
        results.push({
          taskId: task.id,
          lineId: line.id,
          characterName: task.characterName,
          matchField: 'lineText',
          snippet: line.translatedText ?? line.originalText ?? '',
          query: q,
        });
      } else if (includes(line.timecode, q)) {
        results.push({
          taskId: task.id,
          lineId: line.id,
          characterName: task.characterName,
          matchField: 'timecode',
          snippet: line.timecode!,
          query: q,
        });
      }
    }
  }

  // Maks 20 sonuç
  return results.slice(0, 20);
}

// ─── countActiveFilters ───────────────────────────────────────

/**
 * Kaç filtre aktif? Badge sayısı için.
 */
export function countActiveFilters(filter: TaskFilter): number {
  let n = 0;
  if (filter.status      !== 'all') n++;
  if (filter.lineStatus  !== 'all') n++;
  if (filter.hasRecorded !== null)  n++;
  if (filter.hasPending  !== null)  n++;
  return n;
}
