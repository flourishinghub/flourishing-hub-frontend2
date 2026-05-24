# Course & Module Management Feature Specification

## 📋 Overview
Enable Admin to create structured courses with reusable workshop modules, track workshop history, and link workshops to courses/programs.

## 🎯 Business Requirements

### 1. Course Management
- Admin can create/edit courses (programs)
- Each course has:
  - Title
  - Poster/Banner Image
  - Description
  - Number of modules
  - Status (Active/Inactive/Archived)

### 2. Course Module Management (Workshop Templates)
- Each course contains multiple modules
- Each module represents a workshop template with:
  - **Title** (e.g., "Introduction to Mindfulness")
  - **Brief Description**
  - **Poster/Banner Image**
  - **Quiz Link** (optional)
  - **Feedback Link** (optional)
  - **Duration** (optional)
- Modules are reusable templates for creating actual workshops

### 3. Workshop Creation (Event Creation)
- When creating a workshop/event:
  1. Admin selects a **Course**
  2. Admin selects a **Module** from that course
  3. Module info auto-fills (editable):
     - Title
     - Description
     - Poster
     - Quiz Link
     - Feedback Link
  4. Admin adds workshop-specific info:
     - **Date & Time**
     - **Venue**
     - **Batch/Cohort** (which students)
     - **Capacity**
     - **Instructors/Volunteers**

### 4. Tracking & Analytics
- View all workshops conducted
- Filter by:
  - Course/Program
  - Module type
  - Date range
  - Batch
- Show statistics:
  - How many times each module was conducted
  - Which courses are most active
  - Workshop attendance trends

### 5. Tags & Identifiers
- Each workshop shows which course/program it belongs to
- Easy filtering and searching by course tags

---

## 🗄️ Database Schema Changes

### New Models

#### CourseModule (Workshop Template)
```prisma
model CourseModule {
  id              String    @id @default(cuid())
  courseId        String
  title           String
  description     String?
  posterUrl       String?
  quizLink        String?
  feedbackLink    String?
  duration        String?   // e.g., "2 hours", "1 day"
  order           Int       @default(0)  // Module sequence in course
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  course          Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  events          Event[]   @relation("EventFromModule")
  
  @@index([courseId, order])
  @@index([isActive])
}
```

### Updated Models

#### Course (Enhanced)
```prisma
model Course {
  id                 String          @id @default(cuid())
  name               String
  description        String
  posterUrl          String?         // NEW: Course banner
  duration           String?
  instructorName     String?
  status             CourseStatus    @default(ACTIVE)
  startDate          DateTime?
  endDate            DateTime?
  capacity           Int?
  enrolledCount      Int             @default(0)
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt
  
  modules            CourseModule[]  // NEW: Course modules
  
  @@index([status])
  @@index([startDate])
}
```

#### Event (Enhanced)
```prisma
model Event {
  // ... existing fields ...
  
  courseId           String?         // NEW: Link to course
  courseModuleId     String?         // NEW: Link to module template
  batch              String?         // NEW: Target batch/cohort
  
  course             Course?         @relation(fields: [courseId], references: [id])
  courseModule       CourseModule?   @relation("EventFromModule", fields: [courseModuleId], references: [id])
  
  // ... rest of existing relations ...
}
```

---

## 🎨 Frontend UI Requirements

### 1. Admin Dashboard - Courses Tab

#### Course List View
```
┌─────────────────────────────────────────────────────┐
│ Course Management                    [+ Create Course]│
├─────────────────────────────────────────────────────┤
│                                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 📚 Mentorship Program                           │ │
│ │ 8 modules • 24 workshops conducted              │ │
│ │ [View Modules] [Edit] [Delete]                  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🧘 Wellness Course                              │ │
│ │ 12 modules • 36 workshops conducted             │ │
│ │ [View Modules] [Edit] [Delete]                  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                       │
└─────────────────────────────────────────────────────┘
```

#### Course Detail View (Modules)
```
┌─────────────────────────────────────────────────────┐
│ ← Back to Courses                                    │
│                                                       │
│ Mentorship Program                                   │
│ 8 modules                          [+ Add Module]    │
├─────────────────────────────────────────────────────┤
│                                                       │
│ Module 1: Introduction to Mindfulness               │
│ ├─ Description: Learn basics of mindfulness...      │
│ ├─ Quiz: https://forms.gle/...                      │
│ ├─ Feedback: https://forms.gle/...                  │
│ └─ Used in: 5 workshops                             │
│    [Edit] [Delete] [Create Workshop from this]      │
│                                                       │
│ Module 2: Stress Management Techniques              │
│ ├─ Description: Practical stress management...      │
│ └─ Used in: 3 workshops                             │
│    [Edit] [Delete] [Create Workshop from this]      │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### 2. Create/Edit Course Modal
```
┌─────────────────────────────────────────────────────┐
│ Create New Course                              [X]   │
├─────────────────────────────────────────────────────┤
│                                                       │
│ Course Title *                                       │
│ [_____________________________________________]      │
│                                                       │
│ Description                                          │
│ [_____________________________________________]      │
│ [_____________________________________________]      │
│                                                       │
│ Course Poster/Banner                                 │
│ [Upload Image] or [Enter URL]                       │
│                                                       │
│ Instructor Name                                      │
│ [_____________________________________________]      │
│                                                       │
│ Duration                                             │
│ [_____________________________________________]      │
│                                                       │
│ Status                                               │
│ [Active ▼]                                           │
│                                                       │
│                    [Cancel]  [Create Course]         │
└─────────────────────────────────────────────────────┘
```

### 3. Create/Edit Module Modal
```
┌─────────────────────────────────────────────────────┐
│ Add Module to: Mentorship Program             [X]   │
├─────────────────────────────────────────────────────┤
│                                                       │
│ Module Title *                                       │
│ [_____________________________________________]      │
│                                                       │
│ Brief Description                                    │
│ [_____________________________________________]      │
│ [_____________________________________________]      │
│                                                       │
│ Module Poster/Banner                                 │
│ [Upload Image] or [Enter URL]                       │
│                                                       │
│ Quiz Link (optional)                                 │
│ [_____________________________________________]      │
│                                                       │
│ Feedback Link (optional)                             │
│ [_____________________________________________]      │
│                                                       │
│ Duration (optional)                                  │
│ [_____________________________________________]      │
│                                                       │
│                    [Cancel]  [Add Module]            │
└─────────────────────────────────────────────────────┘
```

### 4. Enhanced Event/Workshop Creation
```
┌─────────────────────────────────────────────────────┐
│ Create Workshop                                [X]   │
├─────────────────────────────────────────────────────┤
│                                                       │
│ Select Course/Program *                              │
│ [Mentorship Program ▼]                               │
│                                                       │
│ Select Module *                                      │
│ [Module 1: Introduction to Mindfulness ▼]            │
│                                                       │
│ ─────────── Auto-filled from Module ───────────     │
│                                                       │
│ Workshop Title * (editable)                          │
│ [Introduction to Mindfulness - Batch 2024]          │
│                                                       │
│ Description (editable)                               │
│ [Learn basics of mindfulness...]                    │
│                                                       │
│ Poster (editable)                                    │
│ [https://...]                                        │
│                                                       │
│ Quiz Link (editable)                                 │
│ [https://forms.gle/...]                             │
│                                                       │
│ Feedback Link (editable)                             │
│ [https://forms.gle/...]                             │
│                                                       │
│ ─────────── Workshop-Specific Info ───────────      │
│                                                       │
│ Date *                                               │
│ [2024-05-25]                                         │
│                                                       │
│ Time *                                               │
│ [14:00]                                              │
│                                                       │
│ Venue *                                              │
│ [Lecture Hall 1]                                     │
│                                                       │
│ Target Batch/Cohort *                                │
│ [BTech 2024, MTech 2023]                            │
│                                                       │
│ Capacity                                             │
│ [50]                                                 │
│                                                       │
│                    [Cancel]  [Create Workshop]       │
└─────────────────────────────────────────────────────┘
```

### 5. Workshop Analytics View
```
┌─────────────────────────────────────────────────────┐
│ Workshop Analytics                                   │
├─────────────────────────────────────────────────────┤
│                                                       │
│ Filters:                                             │
│ Course: [All ▼]  Module: [All ▼]  Date: [All ▼]    │
│                                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Total Workshops Conducted: 63                   │ │
│ │ Unique Modules Used: 20                         │ │
│ │ Active Courses: 3                               │ │
│ └─────────────────────────────────────────────────┘ │
│                                                       │
│ Most Conducted Modules:                              │
│ 1. Introduction to Mindfulness (12 times)           │
│ 2. Stress Management (8 times)                      │
│ 3. Time Management (7 times)                        │
│                                                       │
│ Recent Workshops:                                    │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 📚 Mentorship Program > Module 1                │ │
│ │ Introduction to Mindfulness - Batch 2024        │ │
│ │ May 25, 2024 • LH-1 • 45/50 attended            │ │
│ └─────────────────────────────────────────────────┘ │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Backend API Endpoints

### Course APIs
```
GET    /api/v1/courses                    - List all courses
GET    /api/v1/courses/:id                - Get course details
POST   /api/v1/courses                    - Create course (admin)
PUT    /api/v1/courses/:id                - Update course (admin)
DELETE /api/v1/courses/:id                - Delete course (admin)
GET    /api/v1/courses/:id/analytics      - Course analytics
```

### Course Module APIs
```
GET    /api/v1/courses/:courseId/modules           - List modules in course
GET    /api/v1/courses/:courseId/modules/:id       - Get module details
POST   /api/v1/courses/:courseId/modules           - Create module (admin)
PUT    /api/v1/courses/:courseId/modules/:id       - Update module (admin)
DELETE /api/v1/courses/:courseId/modules/:id       - Delete module (admin)
GET    /api/v1/courses/:courseId/modules/:id/usage - Module usage stats
```

### Enhanced Event APIs
```
POST   /api/v1/admin/events/from-module   - Create event from module template
GET    /api/v1/admin/events/analytics     - Workshop analytics
```

---

## 📝 Implementation Steps

### Phase 1: Database Schema
1. Create migration for CourseModule model
2. Update Course model (add posterUrl, modules relation)
3. Update Event model (add courseId, courseModuleId, batch)
4. Run migration on Supabase

### Phase 2: Backend APIs
1. Create course.service.js enhancements
2. Create courseModule.service.js
3. Create courseModule.controller.js
4. Create courseModule.routes.js
5. Update event.service.js (add from-module creation)
6. Add analytics endpoints

### Phase 3: Frontend - Course Management
1. Update Courses tab in admin dashboard
2. Add Course detail view (with modules list)
3. Create Course form modal (enhanced)
4. Create Module form modal
5. Add module management UI

### Phase 4: Frontend - Workshop Creation
1. Update Event creation modal
2. Add course/module selection
3. Add auto-fill logic from module
4. Add batch/cohort field
5. Update event list to show course tags

### Phase 5: Analytics & Reporting
1. Create analytics view
2. Add filtering by course/module
3. Show usage statistics
4. Export functionality

---

## ✅ Acceptance Criteria

1. ✅ Admin can create courses with title, description, poster
2. ✅ Admin can add multiple modules to each course
3. ✅ Each module has title, description, poster, quiz link, feedback link
4. ✅ When creating workshop, admin selects course → module
5. ✅ Module info auto-fills into workshop form (editable)
6. ✅ Admin adds date, venue, batch to workshop
7. ✅ Workshop list shows course/program tags
8. ✅ Analytics show which modules used how many times
9. ✅ Can filter workshops by course/module
10. ✅ All data is editable later

---

## 🚀 Priority

**HIGH PRIORITY** - Core feature for workshop management and tracking

---

## 📌 Notes

- Keep existing Event/EventModule structure for backward compatibility
- CourseModule is a template, Event is an instance
- One CourseModule can be used to create many Events
- Batch field helps track which student cohorts attended
- Analytics help understand which workshops are most popular
