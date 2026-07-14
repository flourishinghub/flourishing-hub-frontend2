'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, FileQuestion, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuizSetupGuideModalProps {
  open: boolean;
  onClose: () => void;
}

// Kept in sync by hand with backend/scripts/google-form-webhook.gs — copy
// this modal's button output into the Apps Script editor's Code.gs.
const APPS_SCRIPT_CODE = `/**
 * Flourishing Hub — Google Form → Backend Webhook
 *
 * This is NOT a Node.js file — it does not run as part of this backend.
 * It's Google Apps Script (.gs), meant to be pasted into the Apps Script
 * editor attached to a Google Form. It's kept here in the repo just so
 * it's version-controlled and easy to find/copy — see
 * GOOGLE_FORM_QUIZ_SETUP.md in the repo root for full setup steps.
 *
 * What it does: whenever a student submits the Google Form, this script
 * runs automatically and sends the result to the backend, which is how
 * "did they submit the quiz, what score, what rating" gets recorded and
 * shown on the admin Event page. Without this script attached, the
 * backend has no way of knowing a Google Form was ever submitted.
 *
 * Handles TWO independent things, either or both may be present on the
 * same form:
 *   1. A Google Forms "Quiz" (Settings → Make this a quiz) → posts the
 *      score to POST /quiz/submit
 *   2. A rating question (Linear scale, 1–5) → posts it to POST /quiz/feedback
 */

// ─── These two are the same for every workshop — already filled in, no
// need to touch them. If you ever redeploy the backend to a new URL or
// rotate QUIZ_WEBHOOK_SECRET in .env, update them here once. ───
const BACKEND_URL = 'https://flourishing-hub-backend2-xif0.onrender.com/api/v1';
const WEBHOOK_SECRET = 'fh-quiz-secret-2026-iitbfh';

// ─── Nothing below needs editing for a normal copy. The script identifies
// which workshop it belongs to using THIS FORM'S OWN "Send" link — the
// backend matches it against whichever Event(s) have that exact link
// pasted into their Quiz Link field in the admin panel, narrowed to the
// one the submitting student is actually registered for. That covers both
// a single standalone workshop AND a compulsory course bundled across
// multiple batches (same form, several Events sharing the same Quiz Link)
// with zero per-copy configuration — just paste the Send link into the
// right event(s)' Quiz Link field and you're done.
//
// EVENT_ID below is only a manual override for the rare case the
// auto-match doesn't apply (e.g. testing before the Quiz Link is saved
// anywhere yet). Leave it blank unless you specifically need it.
// ───
const EVENT_ID = ''; // manual override only — from admin panel: Events → click the workshop → .../admin/events/<EVENT_ID>

// Question title must CONTAIN one of these (case-insensitive) to be
// recognised as the student's email — edit if your form uses different wording.
const EMAIL_TITLE_KEYWORDS = ['email', 'e-mail'];

// Same idea for the rating question — a Linear Scale (1-5) question.
// NOTE: "instructor rating" contains "rating", so if your form has both an
// overall rating question and an instructor rating question, word them so
// they don't overlap (e.g. "Overall Session Rating" vs "Instructor Rating")
// — findAnswerByTitleKeywords returns the FIRST question matching any
// keyword, in form order.
const RATING_TITLE_KEYWORDS = ['session rating', 'how was this session', 'rate this session', 'overall'];
const INSTRUCTOR_RATING_TITLE_KEYWORDS = ['instructor rating', 'rate the instructor', 'facilitator rating'];

/**
 * Run this once manually from the Apps Script editor (select
 * \`installFormSubmitTrigger\` in the function dropdown, click Run) to wire
 * up the trigger. You only need to do this once per form — after that, it
 * fires automatically on every submission. See the setup guide for why an
 * installable trigger (not a simple \`onFormSubmit(e)\`) is required here:
 * UrlFetchApp needs authorization that simple triggers don't have.
 */
function installFormSubmitTrigger() {
  const form = FormApp.getActiveForm();
  ScriptApp.getProjectTriggers().forEach((t) => {
    if (t.getHandlerFunction() === 'onFormSubmitHandler') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onFormSubmitHandler')
    .forForm(form)
    .onFormSubmit()
    .create();
  Logger.log('Trigger installed on form: ' + form.getTitle());
}

// { eventId } if the manual override is set, otherwise { formId } — this
// form's own Send link, which the backend matches against whichever
// Event's Quiz Link field contains it. No per-copy editing required.
function getWorkshopIdentifier() {
  if (EVENT_ID) return { eventId: EVENT_ID };
  return { formId: FormApp.getActiveForm().getPublishedUrl() };
}

function onFormSubmitHandler(e) {
  try {
    const identifier = getWorkshopIdentifier();

    const formResponse = e.response;
    const itemResponses = formResponse.getItemResponses();

    const email = findAnswerByTitleKeywords(itemResponses, EMAIL_TITLE_KEYWORDS);
    if (!email) {
      Logger.log('No email question found/answered — skipping submission. Check EMAIL_TITLE_KEYWORDS.');
      return;
    }

    const results = [];

    // ── 1. Quiz score (only if this form has grading enabled) ──
    const form = FormApp.getActiveForm();
    if (form.isQuiz()) {
      let totalScore = 0;
      let maxScore = 0;
      itemResponses.forEach((itemResponse) => {
        try {
          const item = itemResponse.getItem();
          const points = item.getPoints(); // only gradable item types (multiple choice, checkbox, etc.) support this
          const grade = itemResponse.getScore(); // awarded score, or null if ungraded
          maxScore += points;
          if (grade !== null) totalScore += grade;
        } catch (err) {
          // Not every item type is gradable (e.g. section headers, plain text) — skip those.
        }
      });

      if (maxScore > 0) {
        const scoreOutOf5 = Math.round((totalScore / maxScore) * 5);
        results.push(postToBackend('/quiz/submit', Object.assign({
          email: email,
          score: scoreOutOf5,
          secret: WEBHOOK_SECRET,
        }, identifier)));
      }
    }

    // ── 2. Rating / feedback ──
    const eventRating = findAnswerByTitleKeywords(itemResponses, RATING_TITLE_KEYWORDS);
    if (eventRating) {
      const instructorRating = findAnswerByTitleKeywords(itemResponses, INSTRUCTOR_RATING_TITLE_KEYWORDS);
      const feedbackPayload = Object.assign({
        email: email,
        eventRating: Number(eventRating),
        secret: WEBHOOK_SECRET,
      }, identifier);
      if (instructorRating) feedbackPayload.instructorRating = Number(instructorRating);
      results.push(postToBackend('/quiz/feedback', feedbackPayload));
    }

    Logger.log('Submitted for ' + email + ': ' + JSON.stringify(results));
  } catch (err) {
    Logger.log('ERROR in onFormSubmitHandler: ' + err.message);
  }
}

function findAnswerByTitleKeywords(itemResponses, keywords) {
  for (const itemResponse of itemResponses) {
    const title = itemResponse.getItem().getTitle().toLowerCase();
    if (keywords.some((k) => title.includes(k))) {
      return itemResponse.getResponse();
    }
  }
  return null;
}

function postToBackend(path, payload) {
  const response = UrlFetchApp.fetch(BACKEND_URL + path, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
  const status = response.getResponseCode();
  const body = response.getContentText();
  if (status >= 400) {
    Logger.log('Backend call to ' + path + ' failed (' + status + '): ' + body);
  }
  return { path: path, status: status, body: body };
}
`;

const PART_A_STEPS = [
  'Make a new Google Form. Add an "Email" question (Short answer, Required).',
  'Settings → Quizzes tab → turn ON "Make this a quiz". Add a few placeholder questions, each with an answer key + points — you\'ll edit the real questions per workshop later.',
  'Add a rating question: Linear scale, 1 to 5, titled exactly "Overall Session Rating".',
  'Form editor → ⋮ (top right) → Script editor. Delete everything in Code.gs, paste in the script below.',
  'Rename the Apps Script project to "FH Quiz Webhook", and rename the form to "FH Quiz Template — DO NOT EDIT, COPY ME".',
];

const PART_B_STEPS = [
  'Google Drive → find the master template → right-click → Make a copy. Rename it to the real workshop name.',
  'Edit the quiz questions/answers for this workshop\'s actual content. Leave the Email and "Overall Session Rating" questions as they are.',
  'Copied form → ⋮ → Script editor → function dropdown → select "installFormSubmitTrigger" → click Run (▶). First time ever, it\'ll ask you to authorize — click through.',
  'Copy this form\'s Send link (the long docs.google.com/forms/d/e/.../viewform one — not a shortened forms.gle link) and paste it into the workshop\'s Quiz Link field in the admin panel. For a compulsory course spanning multiple batches, paste the same link into every batch\'s event.',
];

export default function QuizSetupGuideModal({ open, onClose }: QuizSetupGuideModalProps) {
  const copyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    toast.success('Script copied — paste it into the Google Form\'s Script editor (Code.gs)');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            style={{ background: 'rgb(var(--color-card))' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <FileQuestion className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Google Form Quiz Setup</h3>
                  <p className="text-xs text-white/50">One-time master template, then a couple of minutes per workshop</p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-400">
                  Every copy of the script is identical — nothing to fill in per workshop. It reads its own
                  form&apos;s Send link and the backend matches that against whichever event&apos;s Quiz Link
                  field it was pasted into.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Part A — Master template (once only)</h4>
                <ol className="space-y-2.5">
                  {PART_A_STEPS.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-white/70">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px] font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <button
                  onClick={copyScript}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold btn-primary"
                >
                  <Copy className="w-4 h-4" /> Copy Apps Script Code
                </button>
                <p className="text-xs text-white/30 mt-1.5 text-center">Paste this into the Script editor in step 4 above</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Part B — Every new workshop</h4>
                <ol className="space-y-2.5">
                  {PART_B_STEPS.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-white/70">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-accent/15 border border-accent/30 text-accent text-[11px] font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <p className="text-xs text-white/40">
                  Full written guide with troubleshooting: <span className="text-white/60 font-mono">GOOGLE_FORM_QUIZ_SETUP.md</span> in the backend repo.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
