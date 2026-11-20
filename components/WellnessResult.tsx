'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock, MinusCircle, Info } from 'lucide-react';
import { apiCall } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';

// The student's own Wellness PP/NP per module (backend /student/wellness-result,
// the same grade as the admin Student view, the live sheet and the NP emails).
// "Attended" elsewhere on the site only means present in a session; this card
// is the one place that says whether a module is passed and what is missing.

type ModuleResult = 'PP' | 'NP' | 'PENDING' | 'NOT_ATTENDED';
type Reason = 'NO_SHEET_SIGN' | 'NO_CHECK_IN' | 'NO_QUIZ' | 'QUIZ_LOW';

interface WellnessModule {
  title: string;
  result: ModuleResult;
  reasons: Reason[];
  physical?: boolean;
  digital?: boolean;
  quizScore?: number | null;
  session?: { batch: string; date: string };
  upcoming: { eventId: string; batch: string | null; startAt: string; venue: string | null }[];
}

export interface WellnessResultData {
  courseName: string;
  passScore: number;
  totalModules: number;
  passedModules: number;
  courseResult: 'PP' | 'NP' | 'PENDING';
  modules: WellnessModule[];
  sessionResults?: WellnessSessionResult[];
}

// One past session on its own (what that day gave), for the session list.
export interface WellnessSessionResult {
  eventId: string;
  module: string;
  result: ModuleResult;
  reasons: Reason[];
  quizScore: number | null;
  moduleResult?: ModuleResult;
}

// Badge for one session row: PP / what made it NP / pending / not present.
export function WellnessSessionBadge({ r, passScore = 4 }: { r: WellnessSessionResult; passScore?: number }) {
  const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border';
  if (r.result === 'PP') {
    return <span className={`${base} bg-emerald-500/15 text-emerald-400 border-emerald-500/30`}><CheckCircle2 className="w-3 h-3" /> PP: module cleared</span>;
  }
  if (r.result === 'PENDING') {
    return <span className={`${base} bg-amber-500/15 text-amber-400 border-amber-500/30`}><Clock className="w-3 h-3" /> Result pending</span>;
  }
  if (r.result === 'NOT_ATTENDED') {
    return (
      <span className={`${base} bg-white/10 text-white/50 border-white/15`}>
        <MinusCircle className="w-3 h-3" /> {r.moduleResult === 'PP' ? 'Not present (module already PP)' : 'Not present'}
      </span>
    );
  }
  const has = (x: Reason) => r.reasons.includes(x);
  const what = has('NO_SHEET_SIGN') && !has('NO_CHECK_IN')
    ? 'Checked in, not on sheet'
    : has('NO_CHECK_IN') && !has('NO_SHEET_SIGN')
      ? 'Signed sheet, no app check-in'
      : has('QUIZ_LOW')
        ? `Attended, quiz ${r.quizScore}/10 (need ${passScore})`
        : 'Attended, quiz not submitted';
  // Sheet/check-in both fine: the quiz is the only gap, name it.
  const label = !has('NO_SHEET_SIGN') && !has('NO_CHECK_IN') ? what : what + (has('NO_QUIZ') ? ', no quiz' : has('QUIZ_LOW') ? `, quiz ${r.quizScore}/10` : '');
  return (
    <span className={`${base} bg-red-500/15 text-red-400 border-red-500/30`}>
      <XCircle className="w-3 h-3" /> {label} → NP{r.moduleResult === 'PP' ? ' (module already PP)' : ''}
    </span>
  );
}

const RESULT_STYLE: Record<ModuleResult, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  PP: { label: 'PP (Passed)', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', Icon: CheckCircle2 },
  NP: { label: 'NP (Not Passed)', cls: 'bg-red-500/15 text-red-400 border-red-500/30', Icon: XCircle },
  PENDING: { label: 'Result pending', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30', Icon: Clock },
  NOT_ATTENDED: { label: 'Not attended (NP)', cls: 'bg-white/10 text-white/60 border-white/20', Icon: MinusCircle },
};

const reasonText = (r: Reason, m: WellnessModule, passScore: number) => {
  if (r === 'NO_QUIZ') return 'Quiz not submitted';
  if (r === 'QUIZ_LOW') return `Quiz score ${m.quizScore}/10 (need ${passScore} or more)`;
  if (r === 'NO_SHEET_SIGN') return 'Not signed on the attendance sheet';
  return 'App check-in missing';
};

function Check({ ok, label, badLabel }: { ok: boolean | undefined; label: string; badLabel?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
      ok ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-red-500/10 text-red-400 border-red-500/25'
    }`}>
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} {ok ? label : badLabel ?? label}
    </span>
  );
}

function ModuleRow({ m, passScore }: { m: WellnessModule; passScore: number }) {
  const style = RESULT_STYLE[m.result];
  const needsAction = m.result === 'NP' || m.result === 'NOT_ATTENDED';
  const next = m.upcoming[0];
  const quizOk = m.quizScore != null && m.quizScore >= passScore;
  return (
    <div className="px-3 py-3 rounded-xl bg-white/[0.03] border border-white/8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-sm font-medium text-white/90">{m.title}</p>
        <span className={`self-start sm:self-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${style.cls}`}>
          <style.Icon className="w-3.5 h-3.5" /> {style.label}
        </span>
      </div>

      {m.result !== 'NOT_ATTENDED' && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <Check ok={m.physical} label="Sheet signed" badLabel="Sheet not signed" />
          <Check ok={m.digital} label="App check-in done" badLabel="No app check-in" />
          {m.result === 'PENDING' && m.quizScore == null ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-amber-500/10 text-amber-400 border-amber-500/25">
              <Clock className="w-3 h-3" /> Quiz: awaiting upload
            </span>
          ) : (
            <Check ok={quizOk} label={m.quizScore != null ? `Quiz ${m.quizScore}/10` : 'Quiz not submitted'} />
          )}
          {m.session && (
            <span className="text-[11px] text-white/35 ml-1">{m.session.batch} · {formatDate(new Date(m.session.date))}</span>
          )}
        </div>
      )}

      {m.result === 'NP' && m.reasons.length > 0 && (
        <p className="text-xs text-red-300/90 mt-2">Why NP: {m.reasons.map((r) => reasonText(r, m, passScore)).join(', ')}</p>
      )}
      {m.result === 'PENDING' && (
        <p className="text-xs text-amber-300/80 mt-2">Your attendance is recorded; the result appears once this session&apos;s quiz scores are uploaded.</p>
      )}
      {needsAction && (
        <p className="text-xs text-white/55 mt-2">
          {next
            ? <>Next step: you are registered for <span className="text-white/80 font-medium">{next.batch || 'a session'}</span> on {formatDate(new Date(next.startAt))}, {formatTime(new Date(next.startAt))}. Attend it, sign the sheet, check in on the app and take the quiz.</>
            : <>Next step: register for a Buffer session of this module, attend it, sign the sheet, check in on the app and take the quiz.</>}
        </p>
      )}
    </div>
  );
}

export default function WellnessResult({ compact = false, onLoaded, data: given }: { compact?: boolean; onLoaded?: (data: WellnessResultData | null) => void; data?: WellnessResultData | null }) {
  const [fetched, setData] = useState<WellnessResultData | null>(null);
  const data = given !== undefined ? given : fetched;

  useEffect(() => {
    if (given !== undefined) return; // the page fetched it already
    let cancelled = false;
    apiCall('/student/wellness-result')
      .then((res: any) => {
        if (cancelled) return;
        const d = res?.data ?? null;
        setData(d);
        onLoaded?.(d);
      })
      .catch(() => { if (!cancelled) onLoaded?.(null); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return null;

  const summary =
    data.courseResult === 'PP'
      ? { text: 'Course result: PP (Passed)', cls: 'text-emerald-400' }
      : data.courseResult === 'PENDING'
        ? { text: 'Course result: in progress', cls: 'text-amber-400' }
        : { text: 'Course result right now: NP (Not Passed)', cls: 'text-red-400' };

  const body = (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 mb-3">
        <div>
          {!compact && <h2 className="text-base font-semibold text-white">Wellness Workshop: Your Result</h2>}
          <p className={`text-sm font-semibold ${summary.cls}`}>{summary.text}</p>
        </div>
        <p className="text-xs text-white/50">{data.passedModules} of {data.totalModules} modules passed (PP)</p>
      </div>
      <div className="flex items-start gap-2 mb-3 text-[11px] text-white/45">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <p>
          PP = Passed, NP = Not Passed. A module is PP only when all three are done in the same session:
          signed the attendance sheet, checked in on the app, and quiz score {data.passScore} or more out of 10.
          &quot;Attended&quot; on a session only means you were present; it does not mean the module is passed.
        </p>
      </div>
      <div className="space-y-2">
        {data.modules.map((m) => <ModuleRow key={m.title} m={m} passScore={data.passScore} />)}
      </div>
    </>
  );

  return compact ? <div className="mb-4">{body}</div> : <div className="glass-card rounded-2xl p-6">{body}</div>;
}
