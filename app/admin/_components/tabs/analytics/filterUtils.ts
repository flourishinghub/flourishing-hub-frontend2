import { AnalyticsFilterState, AnalyticsStudentEntry, WorkshopAnalyticsRow } from '@/types';

export const emptyAnalyticsFilters: AnalyticsFilterState = {
  course: '',
  topic: '',
  instructor: '',
  batch: '',
  dateFrom: '',
  dateTo: '',
  attendanceStatus: '',
  department: '',
  minScorePct: '',
  maxScorePct: '',
  physicalSheet: '',
};

/**
 * Applies every filter field identically regardless of which sub-tab is consuming the
 * result — keeps Workshop/Student/Instructor views from drifting on filter semantics.
 * Row-level fields (course/topic/instructor/batch/date) decide whether a workshop row
 * survives at all; student-level fields (attendance/department/score) narrow each
 * surviving row's `students` array, and a row is then dropped if that leaves it empty.
 */
export function filterAnalyticsRows(
  rows: WorkshopAnalyticsRow[],
  filters: AnalyticsFilterState,
): WorkshopAnalyticsRow[] {
  const dateFromTs = filters.dateFrom ? new Date(filters.dateFrom).getTime() : null;
  const dateToTs = filters.dateTo ? new Date(filters.dateTo).getTime() : null;
  const minPct = filters.minScorePct !== '' ? Number(filters.minScorePct) : null;
  const maxPct = filters.maxScorePct !== '' ? Number(filters.maxScorePct) : null;
  const needsStudentFilter = Boolean(filters.attendanceStatus || filters.department || minPct !== null || maxPct !== null);

  const matchesStudent = (s: AnalyticsStudentEntry) => {
    if (filters.attendanceStatus) {
      // "Absent" also has to catch NOT_MARKED-and-never-checked-in — a
      // genuinely absent student never gets an explicit ABSENT
      // AttendanceRecord (that only happens via instructor rejection or the
      // 5-day auto-reject cron); most absences just have no record at all.
      // Same definition as computeModuleStatus's ABSENT branch below, so the
      // filter and the displayed status agree on who counts as absent.
      const isAbsent = s.attendanceStatus === 'ABSENT' || (s.attendanceStatus === 'NOT_MARKED' && !s.hasCheckedIn);
      if (filters.attendanceStatus === 'ABSENT') {
        if (!isAbsent) return false;
      } else if (s.attendanceStatus !== filters.attendanceStatus) {
        return false;
      }
    }
    if (filters.department && s.department !== filters.department) return false;
    if (minPct !== null || maxPct !== null) {
      if (s.score == null || s.maxScore == null || s.maxScore === 0) return false;
      const pct = (s.score / s.maxScore) * 100;
      if (minPct !== null && pct < minPct) return false;
      if (maxPct !== null && pct > maxPct) return false;
    }
    return true;
  };

  const out: WorkshopAnalyticsRow[] = [];
  for (const row of rows) {
    if (filters.course && row.courseName !== filters.course) continue;
    if (filters.topic && row.workshopName !== filters.topic) continue;
    if (filters.instructor && row.instructorName !== filters.instructor && row.associateInstructorName !== filters.instructor) continue;
    if (filters.batch && row.batch !== filters.batch) continue;
    if (filters.physicalSheet === 'uploaded' && !row.hasPhysicalSheet) continue;
    if (filters.physicalSheet === 'pending' && row.hasPhysicalSheet) continue;
    if (dateFromTs !== null || dateToTs !== null) {
      const rowTs = new Date(row.date).getTime();
      if (dateFromTs !== null && rowTs < dateFromTs) continue;
      if (dateToTs !== null && rowTs > dateToTs) continue;
    }

    if (!needsStudentFilter) {
      out.push(row);
      continue;
    }
    const students = row.students.filter(matchesStudent);
    if (students.length > 0) out.push({ ...row, students });
  }
  return out;
}

export interface StudentHistoryEntry {
  workshopName: string;
  courseName: string;
  date: string;
  batch: string;
  attendanceStatus: AnalyticsStudentEntry['attendanceStatus'];
  hasCheckedIn: boolean;
  checkInStatus: AnalyticsStudentEntry['checkInStatus'];
  physicalSheetStatus: AnalyticsStudentEntry['physicalSheetStatus'];
  score: number | null;
  maxScore: number | null;
  rating: number | null;
}

export type ModuleStatus = 'ABSENT' | 'PENDING' | 'PRESENT' | 'FAIL' | 'NOT_ATTEMPTED' | 'N/A';

// Pending: checked in (hasCheckedIn) but the instructor hasn't reviewed the
//   check-in yet (no AttendanceRecord exists at all — distinct from a real
//   Absent, which happens when an instructor explicitly rejects, the 5-day
//   auto-reject grace period lapses with no review, or the student never
//   checked in at all). Since quiz/feedback/rating now unlock on
//   session-time + check-in alone (not verification — see
//   operation.service.js's isPastMidSession/hasCheckedIn), a student can be
//   fully "Pending" here and still have completed everything.
// Absent: instructor explicitly marked the check-in ABSENT/REJECTED, or the
//   student never checked in at all, for that module's event.
// Pending also: the session hasn't ended yet and there's no quiz score.
// Pending also: attended, quiz-graded course, no score, and this session's
//   topic score sheet hasn't been uploaded yet (row.quizScoresAvailable false).
// Fail: attended, course has quiz-based grading, and the quiz score (in-built
//   submission, else the uploaded topic score sheet) is < 4 out of 10. Shown
//   as "Absent" in the Student-Level Result column (admin rule, 2026-10-01);
//   kept as its own status so Workshop Passed/Failed still count it.
// Not attempted: attended, quiz-graded, the topic's score sheet has been
//   uploaded, but this student has no score in it ("Quiz Not Attempted").
// Present: attended and either the course has no quiz-based grading at all,
//   or the quiz score is >= 4.
// ('N/A' is no longer produced; kept in the type for older callers.)
export function computeModuleStatus(s: AnalyticsStudentEntry, row: WorkshopAnalyticsRow): ModuleStatus {
  const sessionOver = !row.endAt || new Date(row.endAt).getTime() <= Date.now();
  if (!sessionOver && (!row.courseHasQuiz || s.quizScore == null)) return 'PENDING';
  if (s.attendanceStatus === 'NOT_MARKED') return s.hasCheckedIn ? 'PENDING' : 'ABSENT';
  if (s.attendanceStatus !== 'PRESENT') return 'ABSENT';
  if (!row.courseHasQuiz) return 'PRESENT';
  if (s.quizScore == null) return row.quizScoresAvailable ? 'NOT_ATTEMPTED' : 'PENDING';
  return s.quizScore >= 4 ? 'PRESENT' : 'FAIL';
}

// Pure workshop attendance, deliberately ignoring the quiz-pass/fail overlay
// above — a student who showed up but failed (or never took) the quiz still
// physically attended, and the combined moduleStatus column alone can't show
// that (it collapses both facts into one FAIL/N/A badge). This is the same
// three-way PRESENT/PENDING/ABSENT split as computeModuleStatus's first two
// lines, just without the quiz check that follows.
export type AttendanceOnlyStatus = 'PRESENT' | 'ABSENT' | 'PENDING';

function computeAttendanceOnlyStatus(s: AnalyticsStudentEntry): AttendanceOnlyStatus {
  if (s.attendanceStatus === 'NOT_MARKED') return s.hasCheckedIn ? 'PENDING' : 'ABSENT';
  return s.attendanceStatus === 'PRESENT' ? 'PRESENT' : 'ABSENT';
}

// ─── Wellness Workshop grading (admin rule, 2026-10-07) ───
// Wellness is the only graded course. Per topic:
//   Physical attendance — the reconciled physical sheet says PRESENT.
//   Digital attendance  — the student self-checked-in on the website
//                         (pending or verified); not checked in / rejected
//                         is Absent.
//   Quiz result         — PP when the topic quiz score is 4 or more (of 10).
//   Grade / Final attendance — PP / Present only when all three hold.
// Pending only while the grade can't be decided yet: the session hasn't
// ended, or physical + digital both hold but this session's quiz scores
// haven't been uploaded.
export const WELLNESS_COURSE = 'Wellness Workshop';
export const WELLNESS_PASS_SCORE = 4;

export type WellnessFinal = 'PRESENT' | 'ABSENT' | 'PENDING';

export interface WellnessModuleGrade {
  physical: boolean;
  digital: boolean;
  quizScore: number | null;
  quizPass: boolean;
  final: WellnessFinal;
}

export function computeWellnessGrade(s: AnalyticsStudentEntry, row: WorkshopAnalyticsRow): WellnessModuleGrade {
  const physical = s.physicalSheetStatus === 'PRESENT';
  const digital = s.checkInStatus === 'CHECKED_IN_PENDING' || s.checkInStatus === 'CHECKED_IN_VERIFIED';
  const quizScore = s.quizScore ?? null;
  const quizPass = quizScore != null && quizScore >= WELLNESS_PASS_SCORE;
  const sessionOver = !row.endAt || new Date(row.endAt).getTime() <= Date.now();
  let final: WellnessFinal;
  if (physical && digital && quizPass) final = 'PRESENT';
  else if (!sessionOver) final = 'PENDING';
  else if (physical && digital && quizScore == null && !row.quizScoresAvailable) final = 'PENDING';
  else final = 'ABSENT';
  return { physical, digital, quizScore, quizPass, final };
}

// ─── Mentor Training Course final attendance (admin rule, 2026-10-09) ───
// Digital attendance (app check-in) and the physical sheet are both shown;
// either one makes the student Present (no quiz in MTC). A REJECTED
// check-in doesn't count. A Present already recorded (e.g. instructor-
// verified check-in, admin-approved manual Present) stays Present. Pending
// only while the session hasn't ended; otherwise Absent.
export const MTC_COURSE_PREFIX = 'Mentor Training Course';
export const isMtcCourse = (courseName: string | undefined) => Boolean(courseName?.startsWith(MTC_COURSE_PREFIX));

export function computeMtcFinal(s: AnalyticsStudentEntry, row: WorkshopAnalyticsRow): AttendanceOnlyStatus {
  const digital = s.checkInStatus === 'CHECKED_IN_PENDING' || s.checkInStatus === 'CHECKED_IN_VERIFIED';
  if (s.attendanceStatus === 'PRESENT' || s.physicalSheetStatus === 'PRESENT' || digital) return 'PRESENT';
  const sessionOver = !row.endAt || new Date(row.endAt).getTime() <= Date.now();
  return sessionOver ? 'ABSENT' : 'PENDING';
}

export interface StudentAggregateRow {
  userId: string;
  name: string;
  email: string;
  rollNo: string;
  department: string;
  programme: string;
  batches: string[];
  courses: string[];
  eventsCount: number;
  // Module-wise, not session-wise (admin rule, 2026-10-09): a module the
  // student sat in two sessions of (e.g. D2 then Buffer 2) counts once, with
  // its final result. presentCount = modules Present, markedCount = every
  // module of the student's course(s) in view, completed or still pending.
  presentCount: number;
  markedCount: number;
  attendancePct: number | null;
  avgScorePct: number | null;
  avgRating: number | null;
  history: StudentHistoryEntry[];
  // Keyed by module name (e.g. "M1: Identifying Psychological Concerns in
  // Students") — a module the student has no row for at all is simply absent
  // from this map (rendered as "—" in the UI, distinct from 'ABSENT').
  moduleStatus: Record<string, ModuleStatus>;
  // Same keys as moduleStatus, but pure attendance — see computeAttendanceOnlyStatus.
  moduleAttendance: Record<string, AttendanceOnlyStatus>;
  // Same keys as moduleStatus — the raw self-check-in outcome per module,
  // shown as its own column alongside moduleAttendance/physical-sheet.
  moduleCheckIn: Record<string, AnalyticsStudentEntry['checkInStatus']>;
  // Same keys as moduleStatus — what the physical sign-in sheet said per
  // module, independent of check-in/final status.
  modulePhysicalSheet: Record<string, AnalyticsStudentEntry['physicalSheetStatus']>;
  // Same keys as moduleStatus — the student's quiz score for that module
  // (score/maxScore straight from the analytics entry; populated by an
  // uploaded topic score sheet or an in-built quiz). Absent from the map
  // when no score exists — rendered as "N/A" in the Score column.
  moduleScore: Record<string, { score: number; maxScore: number }>;
  // Same keys as moduleStatus — Wellness grading per topic (computeWellnessGrade);
  // filled for every row, only shown when the Wellness course is selected.
  moduleWellness: Record<string, WellnessModuleGrade>;
  // Same keys as moduleStatus — every session batch the student had for that
  // module, in date order (e.g. ["D2", "Buffer 2"]); shown as "D2 → Buffer 2".
  moduleBatches: Record<string, string[]>;
  // Same keys as moduleStatus — MTC final attendance, check-in or physical
  // sheet (computeMtcFinal); filled for every row, only shown for MTC.
  moduleMtcFinal: Record<string, AttendanceOnlyStatus>;
}

export const formatModuleBatches = (batches: string[] | undefined) => (batches?.length ? batches.join(' → ') : '—');

// One student, one line per module (admin rule, 2026-10-09). When a student
// has several sessions of one module (original batch + a Buffer make-up),
// every module column is taken from a single chosen session, so Result,
// Check-in, Physical Sheet and Score never mix two different sessions:
//   1. the best result (Present > attended-but-failed/unscored > Pending > Absent),
//   2. then the session with a score,
//   3. then the session with a physical-sheet signature or a check-in,
//   4. then the latest session.
// The score falls back to any other session's score when the chosen one has
// none, so a quiz the student did take still shows.
const MODULE_STATUS_RANK: Record<ModuleStatus, number> = {
  PRESENT: 5, FAIL: 4, NOT_ATTEMPTED: 4, PENDING: 2, ABSENT: 1, 'N/A': 0,
};
const WELLNESS_FINAL_RANK: Record<WellnessFinal, number> = { PRESENT: 3, PENDING: 2, ABSENT: 1 };

interface ModuleSession { s: AnalyticsStudentEntry; row: WorkshopAnalyticsRow }

function sessionRank({ s, row }: ModuleSession): number[] {
  const result = row.courseName === WELLNESS_COURSE
    ? WELLNESS_FINAL_RANK[computeWellnessGrade(s, row).final]
    : isMtcCourse(row.courseName)
      ? WELLNESS_FINAL_RANK[computeMtcFinal(s, row)]
      : MODULE_STATUS_RANK[computeModuleStatus(s, row)];
  const hasScore = s.quizScore != null || s.score != null ? 1 : 0;
  const evidence = (s.physicalSheetStatus === 'PRESENT' ? 1 : 0) + (s.hasCheckedIn ? 1 : 0);
  return [result, hasScore, evidence, new Date(row.date).getTime()];
}

function pickModuleSession(sessions: ModuleSession[]): ModuleSession {
  return sessions.reduce((best, cur) => {
    const a = sessionRank(cur);
    const b = sessionRank(best);
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return a[i] > b[i] ? cur : best;
    }
    return best;
  });
}

// The module's single result for the module-wise Attendance %: Wellness uses
// its graded final attendance, MTC check-in or sheet, every other course
// plain attendance.
function moduleFinal({ s, row }: ModuleSession): AttendanceOnlyStatus {
  if (row.courseName === WELLNESS_COURSE) return computeWellnessGrade(s, row).final;
  if (isMtcCourse(row.courseName)) return computeMtcFinal(s, row);
  const sessionOver = !row.endAt || new Date(row.endAt).getTime() <= Date.now();
  if (!sessionOver) return 'PENDING';
  return computeAttendanceOnlyStatus(s);
}

/** One line per student (deduped by userId, else roll number), one result per module. */
export function aggregateStudents(rows: WorkshopAnalyticsRow[]): StudentAggregateRow[] {
  const map = new Map<string, StudentAggregateRow>();
  // student key -> module key -> that module's sessions. Rows without a
  // module (standalone events) are their own module, keyed by event id.
  const sessionsByStudent = new Map<string, Map<string, ModuleSession[]>>();

  rows.forEach((row) => {
    row.students.forEach((s) => {
      // Pending (no-account-yet) physical-sheet signers have no userId — the
      // backend can't give them one since they've never signed up. Grouping
      // them under a synthetic roll-number/email key (instead of skipping
      // them outright) is what keeps this view's totals matching the
      // Workshop tab's, which already counts them via row.totalAttended.
      // userId here is only ever used as a React list key downstream, never
      // for navigation or an API call, so a non-real value is safe.
      // Keyed by roll number (not roll+email) so a no-account student's sheet
      // row and CSV-absent row in two sessions of a module stay one line.
      const roll = s.rollNo && s.rollNo !== '—' ? s.rollNo.toUpperCase() : '';
      const key = s.userId || (roll ? `pending:${roll}` : `pending:${s.email}`);
      let agg = map.get(key);
      if (!agg) {
        agg = {
          userId: key,
          name: s.name,
          email: s.email,
          rollNo: s.rollNo,
          department: s.department || '—',
          programme: s.programme || '—',
          batches: [],
          courses: [],
          eventsCount: 0,
          presentCount: 0,
          markedCount: 0,
          attendancePct: null,
          avgScorePct: null,
          avgRating: null,
          history: [],
          moduleStatus: {},
          moduleAttendance: {},
          moduleCheckIn: {},
          modulePhysicalSheet: {},
          moduleScore: {},
          moduleWellness: {},
          moduleBatches: {},
          moduleMtcFinal: {},
        };
        map.set(key, agg);
        sessionsByStudent.set(key, new Map());
      }
      agg.eventsCount += 1;
      if (s.batch && s.batch !== '—' && !agg.batches.includes(s.batch)) agg.batches.push(s.batch);
      if (row.courseName && row.courseName !== '—' && !agg.courses.includes(row.courseName)) agg.courses.push(row.courseName);
      const moduleKey = row.moduleName && row.moduleName !== '—' ? row.moduleName : `event:${row.id}`;
      const modules = sessionsByStudent.get(key)!;
      if (!modules.has(moduleKey)) modules.set(moduleKey, []);
      modules.get(moduleKey)!.push({ s, row });
      agg.history.push({
        workshopName: row.workshopName,
        courseName: row.courseName,
        date: row.date,
        batch: s.batch,
        attendanceStatus: s.attendanceStatus,
        hasCheckedIn: s.hasCheckedIn,
        checkInStatus: s.checkInStatus,
        physicalSheetStatus: s.physicalSheetStatus,
        score: s.score,
        maxScore: s.maxScore,
        rating: s.rating,
      });
    });
  });

  // Attendance % denominator (admin rule, 2026-10-09): every module of the
  // course, completed or pending, whether or not the student has a session
  // in it yet — taken from the rows in view, so a topic filter narrows it.
  const courseModules = new Map<string, Set<string>>();
  rows.forEach((row) => {
    if (!row.moduleName || row.moduleName === '—') return;
    if (!courseModules.has(row.courseName)) courseModules.set(row.courseName, new Set());
    courseModules.get(row.courseName)!.add(row.moduleName);
  });

  map.forEach((agg, key) => {
    agg.markedCount = agg.courses.reduce((n, c) => n + (courseModules.get(c)?.size ?? 0), 0);
    sessionsByStudent.get(key)!.forEach((sessions, moduleKey) => {
      const chosen = pickModuleSession(sessions);
      if (moduleFinal(chosen) === 'PRESENT') agg.presentCount += 1;
      if (moduleKey.startsWith('event:')) {
        agg.markedCount += 1;
        return;
      }
      const { s, row } = chosen;
      agg.moduleStatus[moduleKey] = computeModuleStatus(s, row);
      agg.moduleAttendance[moduleKey] = computeAttendanceOnlyStatus(s);
      agg.moduleCheckIn[moduleKey] = s.checkInStatus;
      agg.modulePhysicalSheet[moduleKey] = s.physicalSheetStatus;
      const grade = computeWellnessGrade(s, row);
      const scored = s.score != null && s.maxScore != null
        ? s
        : sessions.map((x) => x.s).find((x) => x.score != null && x.maxScore != null);
      if (scored) agg.moduleScore[moduleKey] = { score: scored.score as number, maxScore: scored.maxScore as number };
      // Score display only — the grade's final stays the chosen session's.
      if (grade.quizScore == null) {
        const other = sessions.map((x) => x.s.quizScore).find((q) => q != null);
        if (other != null) {
          grade.quizScore = other;
          grade.quizPass = other >= WELLNESS_PASS_SCORE;
        }
      }
      agg.moduleWellness[moduleKey] = grade;
      agg.moduleMtcFinal[moduleKey] = computeMtcFinal(s, row);
      agg.moduleBatches[moduleKey] = [...sessions]
        .sort((a, b) => new Date(a.row.date).getTime() - new Date(b.row.date).getTime())
        .map((x) => x.row.batch || x.s.batch)
        .filter((b) => b && b !== '—');
    });
  });

  return Array.from(map.values())
    .map((agg) => {
      // Weighted average (sum of scores / sum of max scores), not a mean of
      // per-event percentages — avoids overweighting a low-maxScore event.
      const scored = agg.history.filter((h) => h.score != null && h.maxScore != null && h.maxScore > 0);
      const scoreSum = scored.reduce((sum, h) => sum + (h.score as number), 0);
      const maxSum = scored.reduce((sum, h) => sum + (h.maxScore as number), 0);
      const rated = agg.history.filter((h) => h.rating != null);
      return {
        ...agg,
        attendancePct: agg.markedCount > 0 ? Math.round((agg.presentCount / agg.markedCount) * 100) : null,
        avgScorePct: maxSum > 0 ? Math.round((scoreSum / maxSum) * 100) : null,
        avgRating: rated.length
          ? Number((rated.reduce((sum, h) => sum + (h.rating as number), 0) / rated.length).toFixed(1))
          : null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface InstructorAggregateRow {
  key: string;
  instructorId: string | null;
  name: string;
  workshopsCount: number;
  studentsTaught: number;
  avgRating: number | null;
  avgPassRate: number | null;
  courses: string[];
  batches: string[];
  workshops: WorkshopAnalyticsRow[];
}

/**
 * Groups the (already filtered) rows by instructor, counting a workshop toward
 * whichever person conducted it as INSTRUCTOR and/or ASSOCIATE_INSTRUCTOR — a row
 * with neither role assigned lands in an explicit "Unassigned" bucket rather than
 * being silently dropped, so totals still reconcile with the Workshop tab.
 */
export function aggregateInstructors(rows: WorkshopAnalyticsRow[]): InstructorAggregateRow[] {
  const map = new Map<string, InstructorAggregateRow>();

  // staffKey is the backend's first+last-name identity (utils/staffName.js),
  // so an account and a typed no-account name for one person share a bucket.
  const addAppearance = (id: string | null, name: string, row: WorkshopAnalyticsRow, staffKey?: string | null) => {
    const hasName = Boolean(name && name !== '—');
    const key = staffKey ? `staff:${staffKey}` : id || (hasName ? `name:${name}` : 'unassigned');
    let agg = map.get(key);
    if (!agg) {
      agg = {
        key,
        instructorId: id,
        name: hasName ? name : 'Unassigned',
        workshopsCount: 0,
        studentsTaught: 0,
        avgRating: null,
        avgPassRate: null,
        courses: [],
        batches: [],
        workshops: [],
      };
      map.set(key, agg);
    }
    if (!agg.workshops.some((w) => w.id === row.id)) {
      agg.workshops.push(row);
      agg.workshopsCount += 1;
      if (row.courseName && row.courseName !== '—' && !agg.courses.includes(row.courseName)) agg.courses.push(row.courseName);
      if (row.batch && row.batch !== '—' && !agg.batches.includes(row.batch)) agg.batches.push(row.batch);
    }
  };

  rows.forEach((row) => {
    const hasInstructor = Boolean(row.instructorId || (row.instructorName && row.instructorName !== '—'));
    const hasAssociate = Boolean(row.associateInstructorId || (row.associateInstructorName && row.associateInstructorName !== '—'));
    if (hasInstructor) addAppearance(row.instructorId, row.instructorName, row, row.instructorKey);
    if (hasAssociate) addAppearance(row.associateInstructorId, row.associateInstructorName, row, row.associateInstructorKey);
    if (!hasInstructor && !hasAssociate) addAppearance(null, '—', row);
  });

  return Array.from(map.values())
    .map((agg) => {
      const studentIds = new Set<string>();
      let ratingSum = 0;
      let ratingCount = 0;
      let passSum = 0;
      let registeredSum = 0;
      agg.workshops.forEach((w) => {
        w.students.forEach((s) => { if (s.userId) studentIds.add(s.userId); });
        if (w.avgRating != null) {
          ratingSum += Number(w.avgRating);
          ratingCount += 1;
        }
        passSum += w.totalAttended || 0;
        registeredSum += w.totalRegistered || 0;
      });
      return {
        ...agg,
        studentsTaught: studentIds.size,
        avgRating: ratingCount ? Number((ratingSum / ratingCount).toFixed(1)) : null,
        avgPassRate: registeredSum > 0 ? Math.round((passSum / registeredSum) * 100) : null,
      };
    })
    .sort((a, b) => b.workshopsCount - a.workshopsCount);
}
