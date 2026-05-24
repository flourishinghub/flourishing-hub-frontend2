# Instructions for Claude Code

## 🎯 Task: Implement Course & Module Management Feature

Read the complete specification in `COURSE_MODULE_FEATURE_SPEC.md` first.

## 📋 Implementation Checklist

### Step 1: Database Schema (Backend)
- [ ] Update `backend/prisma/schema.prisma`:
  - [ ] Add `CourseModule` model
  - [ ] Update `Course` model (add `posterUrl`, `modules` relation)
  - [ ] Update `Event` model (add `courseId`, `courseModuleId`, `batch`)
- [ ] Create SQL migration file in `backend/migrations/`
- [ ] Test schema with `npx prisma db push` (or provide SQL for Supabase)

### Step 2: Backend Services & Controllers
- [ ] Create `backend/services/courseModule.service.js`:
  - [ ] `createModule(courseId, data)`
  - [ ] `getModulesByCourse(courseId)`
  - [ ] `getModuleById(id)`
  - [ ] `updateModule(id, data)`
  - [ ] `deleteModule(id)`
  - [ ] `getModuleUsageStats(id)` - count events using this module
  
- [ ] Update `backend/services/course.service.js`:
  - [ ] Add `posterUrl` to create/update
  - [ ] Add `getCoursesWithModuleCount()`
  - [ ] Add `getCourseAnalytics(courseId)`
  
- [ ] Update `backend/services/event.service.js`:
  - [ ] Add `createEventFromModule(moduleId, eventData)`
  - [ ] Add `getEventAnalytics()` - group by course/module

- [ ] Create `backend/controllers/courseModule.controller.js`
- [ ] Update `backend/controllers/course.controller.js`
- [ ] Update `backend/controllers/event.controller.js`

### Step 3: Backend Routes
- [ ] Create `backend/routes/courseModule.routes.js`:
  ```javascript
  GET    /courses/:courseId/modules
  GET    /courses/:courseId/modules/:id
  POST   /courses/:courseId/modules
  PUT    /courses/:courseId/modules/:id
  DELETE /courses/:courseId/modules/:id
  GET    /courses/:courseId/modules/:id/usage
  ```
  
- [ ] Update `backend/routes/course.routes.js`:
  - [ ] Add analytics endpoint
  
- [ ] Update `backend/routes/event.routes.js`:
  - [ ] Add `POST /events/from-module`
  - [ ] Add `GET /events/analytics`

- [ ] Register routes in `backend/routes/index.js`

### Step 4: Frontend - Course Management UI
- [ ] Update `flourishing-hub-frontend/app/admin/page.tsx`:
  
  **Courses Tab Enhancement:**
  - [ ] Show course list with module count and workshop count
  - [ ] Add "View Modules" button for each course
  - [ ] Update Course form modal to include `posterUrl` field
  
  **New: Course Detail View (Modules):**
  - [ ] Create expandable/modal view showing course modules
  - [ ] List all modules with their details
  - [ ] Show usage count for each module
  - [ ] Add "Create Workshop from Module" button
  
  **New: Module Form Modal:**
  - [ ] Title, Description, Poster URL
  - [ ] Quiz Link, Feedback Link
  - [ ] Duration
  - [ ] Order/Sequence number

### Step 5: Frontend - Enhanced Workshop Creation
- [ ] Update Event creation modal in `flourishing-hub-frontend/app/admin/page.tsx`:
  
  **Add Course/Module Selection:**
  - [ ] Dropdown: Select Course
  - [ ] Dropdown: Select Module (filtered by course)
  - [ ] Auto-fill fields when module selected:
    - Title (editable)
    - Description (editable)
    - Poster URL (editable)
    - Quiz Link (editable)
    - Feedback Link (editable)
  
  **Add Workshop-Specific Fields:**
  - [ ] Date & Time (existing)
  - [ ] Venue (existing)
  - [ ] **NEW: Batch/Cohort** (text input, e.g., "BTech 2024, MTech 2023")
  - [ ] Capacity (existing)
  
  **Update Event List:**
  - [ ] Show course tag/badge for each event
  - [ ] Add filter by course
  - [ ] Add filter by module

### Step 6: Frontend - Analytics View (Optional for MVP)
- [ ] Create new tab or section in admin dashboard
- [ ] Show workshop statistics:
  - [ ] Total workshops conducted
  - [ ] Workshops by course
  - [ ] Most used modules
  - [ ] Recent workshops with course/module info
- [ ] Add filters: Course, Module, Date Range

### Step 7: Testing
- [ ] Test course CRUD operations
- [ ] Test module CRUD operations
- [ ] Test creating workshop from module (auto-fill)
- [ ] Test editing workshop created from module
- [ ] Test analytics/usage stats
- [ ] Test filtering events by course/module

### Step 8: Deployment
- [ ] Commit backend changes
- [ ] Push to GitHub (triggers Render deployment)
- [ ] Run database migration on Supabase
- [ ] Commit frontend changes
- [ ] Push to GitHub (triggers Vercel deployment)
- [ ] Verify in production

---

## 🎨 UI/UX Guidelines

### Design Consistency
- Use existing component patterns from admin dashboard
- Match the glass-card, gradient, and animation styles
- Use lucide-react icons (BookOpen, Layers, etc.)
- Follow the color scheme: primary (purple), accent (teal)

### Module Cards
```tsx
<div className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10">
  <div className="p-6">
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30">
        <Layers className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <h4 className="text-base font-bold text-white">Module Title</h4>
        <p className="text-sm text-white/50">Description...</p>
        <div className="flex gap-2 mt-2">
          <span className="badge-blue">Used in 5 workshops</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

### Course Tags in Event List
```tsx
<span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs">
  <BookOpen className="w-3 h-3" />
  Mentorship Program
</span>
```

---

## ⚠️ Important Notes

1. **Database Migration**: Since we're using Supabase, provide SQL migration that can be run in Supabase SQL Editor
2. **Backward Compatibility**: Don't break existing events that don't have courseId/moduleId
3. **Validation**: Ensure course exists before creating module, module exists before creating event from it
4. **Error Handling**: Proper error messages for all operations
5. **Loading States**: Show loading spinners during API calls
6. **Success Messages**: Toast notifications for all CRUD operations

---

## 🚀 Start Here

1. Read `COURSE_MODULE_FEATURE_SPEC.md` completely
2. Start with database schema changes
3. Then backend APIs
4. Then frontend UI
5. Test thoroughly before deployment

Good luck! 🎉
