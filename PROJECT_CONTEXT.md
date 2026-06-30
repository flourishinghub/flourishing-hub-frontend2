# Flourishing Hub — Full Project Context

## Project Overview
IIT Bombay Student Wellness Center ka management platform.
Naam: **Flourishing Hub**
Admin email: web@iitbfh.com

---

## Repositories

| Part | Local Path | GitHub |
|------|-----------|--------|
| Frontend | `C:\Users\kunde\flourishing-hub-frontend` | https://github.com/Abbagal/flourishing-hub-frontend2 |
| Backend | `C:\2026\flourishing_hub_original\backend\flourishing-hub-backend\backend` | https://github.com/Abbagal/flourishing-hub-backend2 |

## Deployment
- Frontend → **Vercel**
- Backend → **Render**
- Database → **Supabase** (PostgreSQL)

---

## Tech Stack

### Frontend
- Next.js 14.2.5 (App Router)
- React 18, TypeScript 5
- Tailwind CSS + Radix UI
- Glassmorphic dark theme: bg `#0F0F1A`, primary `#6C63FF`, accent `#00C9A7`
- `ignoreBuildErrors: true` in next.config.js (TypeScript errors don't block build)

### Backend
- Node.js + Express.js (ES Modules — use `import/export`)
- Prisma ORM + Supabase PostgreSQL
- JWT auth (stored in localStorage + cookies)
- nodemailer (Gmail) for emails
- node-cron for scheduled jobs
- exceljs for Excel generation
- multer for file uploads

### Key Frontend Files
- `lib/api.ts` — centralized `apiCall()` function, base URL from `NEXT_PUBLIC_API_URL`
- `lib/utils.ts` — formatDate, formatTime, renderStars
- `lib/dateUtils.ts` — isEventLive, isEventUpcoming, isEventPast
- `types/index.ts` — all TypeScript types

### Key Backend Folders
```
backend/
  routes/        — Express routers
  controllers/   — Request handlers
  services/      — Business logic + Prisma queries
  middleware/    — auth.js (authenticate), errorHandler.js
  cron/          — reminder.cron.js
  prisma/        — schema.prisma
  config/        — index.js (API_PREFIX = /api/v1)
```

---

## Roles
- `student` — attends events, views portfolio
- `instructor` — leads events
- `associate-instructor` — assists events
- `volunteer` — helps at events
- `admin` — full access

---

## Database Key Models (Prisma)

### Course
```
id, name, code(optional), description, posterUrl, duration,
instructorName, status(ACTIVE/INACTIVE/ARCHIVED), isCompulsory(bool),
startDate, endDate, capacity, enrolledCount
→ has many: CourseModule[], Event[]
```

### CourseModule (Workshop Template)
```
id, courseId, title, description, posterUrl, quizLink,
feedbackLink, duration, order, isActive
```

### Event
```
id, title, slug, description, type, status(PUBLISHED/DRAFT/etc),
venue, meetLink, startAt, endAt, capacity, batch,
courseId(optional), courseModuleId(optional),
registrationOpensAt, registrationClosesAt,
isCampusWide, allowVolunteerSignup, requiresCheckIn
```

### EventRegistration
```
id, eventId, userId, status, isVolunteer, checkedInAt, registeredAt
```

### Programme type
`'BTech' | 'MTech' | 'PhD' | 'MSc' | 'Staff' | 'Dual Degree'`

---

## API Routes Summary

### Auth
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `GET  /api/v1/auth/me`

### Courses
- `GET    /api/v1/courses` — list all
- `POST   /api/v1/courses` — create course
- `GET    /api/v1/courses/:courseId` — get one
- `PUT    /api/v1/courses/:courseId` — update
- `DELETE /api/v1/courses/:courseId` — delete
- `POST   /api/v1/courses/:courseId/bulk-enroll` — enroll list of emails
- `POST   /api/v1/courses/:courseId/self-enroll` — student self-enrolls (backend only, no frontend button yet)
- `GET    /api/v1/courses/:courseId/modules` — list modules
- `POST   /api/v1/courses/:courseId/modules` — create module

### Events
- `GET  /api/v1/events`
- `POST /api/v1/events` (admin)
- `PUT  /api/v1/events/:id` (admin)
- `DELETE /api/v1/events/:id` (admin)

### Registrations
- `POST /api/v1/registrations` — register for event
- `GET  /api/v1/registrations/me` — my registrations

### Admin
- `GET  /api/v1/admin/events`
- `GET  /api/v1/admin/analytics/workshops` — workshop analytics table
- `GET  /api/v1/admin/analytics/export-excel` — download 4-sheet Excel report
- `GET  /api/v1/admin/members`
- `POST /api/v1/admin/assign-staff`
- `GET  /api/v1/admin/pending-approvals`

### Imports
- `POST /api/v1/imports/upload` — bulk import CSV/Excel

### Quiz
- `POST /api/v1/quiz/submit` — webhook (secured by QUIZ_WEBHOOK_SECRET env var)

### Student
- `GET /api/v1/student/bundle-progress` — course bundle progress

---

## Features Implemented (Complete List)

### Admin Dashboard
1. **Create Course Template**
   - Form: name, code, description, poster URL, duration (optional), status, compulsory toggle
   - Workshop count input → generates numbered topic fields
   - On save: creates Course + CourseModule entries via API
   - Button: "Create Course Template"

2. **Bulk Import Events**
   - Course dropdown → Workshop dropdown (fetched from modules)
   - Description auto-fills from selected workshop
   - Download CSV template (columns: date, day, time, venue, tutorial/batch, instructor, workshop name)
   - Upload CSV → backend parses and creates events linked to course+module

3. **Export Master Excel** (Analytics tab)
   - Button: "Export Master Excel"
   - Calls `GET /admin/analytics/export-excel`
   - Downloads `.xlsx` with 4 sheets:
     - A: Course-Level Summary
     - B: Workshop & Session Report
     - C: Facilitator Evaluation
     - D: Student Performance Transcripts

4. **User Approval** — admin approves/declines new signups
5. **Role Management** — change user roles
6. **Member Directory** — filter by dept/year/programme
7. **Volunteer Management**
8. **Event Management** — create/edit/delete events
9. **Assign Staff** — assign instructor/associate-instructor to events
10. **Analytics Console** — cascading filters (course→topic→instructor→batch), facilitator telemetry, roll number lookup

### Student Dashboard
1. **Welcome section** with programme, dept, year, roll number
2. **1-Hour Reminder Banner** — amber banner shows upcoming registered events within 60 min
3. **Bundle Progress** — radial progress cards for each enrolled course bundle
4. **Live Events** section — red pulsing indicator
5. **Upcoming Events** — filter all/registered/unregistered
6. **Past Records table** — Event Name, Date, Venue, Marks, Status (Rating column REMOVED)
7. **Portfolio section**
8. **Registered Courses** shown on home
9. **Registration toast** — shows "Successfully registered for Course Bundle (CODE)!" for course-linked events

### Signup
- Programme options: BTech, MTech, PhD, MSc, Staff, **Dual Degree**

### Quiz System
- Webhook: `POST /api/v1/quiz/submit` with `{ email, eventId, score, secret }`
- Dynamic pass threshold: compulsory course → ≥4/5, others → ≥3/5
- On pass: attendance marked PRESENT, success notification + email
- On fail: attendance reverted to ABSENT, warning notification + email

### Email Notifications
- Registration confirmation email
- Course bundle enrollment email (lists all workshop titles)
- Quiz result email (green=pass, red=fail)
- Event reminder emails (24h before + 1h before)

### Reminders (Cron — runs every hour)
- 24-hour reminder window: 23–25h before event
- 1-hour reminder window: 55–65 min before event
- Both: email + in-app notification with venue

---

## Admin Dashboard Tabs
`overview | new-events | event-status | past-records | calendar | events | courses | members | volunteers | approvals | roles | settings | analytics | videos`

---

## Important Code Patterns

### apiCall usage (frontend)
```typescript
// Always use apiCall from lib/api.ts
const response = await apiCall('/courses', {
  method: 'POST',
  body: JSON.stringify({ name: '...', description: '' })
});
const id = response?.data?.id;
```

### Backend service pattern
```javascript
// services/something.service.js
import { prisma } from "../database/prisma.js";
export const doSomething = async (data) => {
  return prisma.model.create({ data: { ... } });
};
```

### Backend controller pattern
```javascript
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
export const myController = asyncHandler(async (req, res) => {
  if (req.user.role !== 'ADMIN') throw new ApiError(403, "Admin only");
  const result = await myService(req.body);
  res.status(200).json({ success: true, data: result });
});
```

### Email (non-blocking pattern)
```javascript
sendSomeEmail(user.email, user.name, ...).catch(() => {});
```

---

## Known Issues / Notes

1. **Course creation `description` field** — always send `description: value || ''`, never `undefined` (Prisma rejects undefined for required String field)
2. **`event.service.js` vs `admin.service.js` createEvent** — both exist. Admin routes use `admin.service.js:createEvent` (uses `...eventData` spread). Import routes use `event.service.js:createEvent` (explicit fields, safer).
3. **Course self-enroll** — backend endpoint exists (`POST /courses/:id/self-enroll`) but no frontend button yet
4. **TypeScript errors** — pre-existing errors are ignored via `ignoreBuildErrors: true`. Don't worry about tsc errors on build.
5. **CORS** — `CLIENT_URLS` env var on Render must include the Vercel frontend URL

---

## Git Workflow
```bash
# Frontend
cd C:\Users\kunde\flourishing-hub-frontend
git add <files>
git commit -m "message"
git push origin main   # auto-deploys to Vercel

# Backend
cd C:\2026\flourishing_hub_original\backend\flourishing-hub-backend\backend
git add <files>
git commit -m "message"
git push origin main   # auto-deploys to Render
```

**PowerShell note:** Use `git commit -m "message"` with double quotes for simple messages. For multi-line, use here-string `@'...'@` syntax.

---

## Last Session Summary (June 2026)

### Changes made in last sessions:
1. Course form: removed instructor/startDate/endDate/capacity, added workshopCount + topics
2. Bulk Import: course dropdown + workshop dropdown + description auto-fill + CSV template
3. Backend bulk import: courseId/courseModuleId support in import.service.js, event.service.js
4. Quiz: dynamic pass threshold (4/5 compulsory, 3/5 others) + quiz result emails
5. Email service: sendQuizResultEmail + sendCourseBundleEmail added
6. Registration: sends course bundle email + course-aware notification
7. Cron: 1-hour reminder added alongside 24h reminder
8. Admin Excel export: 4-sheet workbook (admin.service.js + controller + route)
9. Signup: Dual Degree programme added
10. Student dashboard: 1-hour reminder banner + course-specific registration toast
11. Analytics tab: Export Master Excel button
12. Student past records: Rating column removed
13. Course save fix: better error message, description guard, refresh isolated
