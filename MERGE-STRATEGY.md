# Merge Strategy: ui-fixes → main

## Goal: Get UI improvements from ui-fixes + Keep functionality from main

---

## ✅ KEEP MAIN (Functionality Priority)

When resolving conflicts, **KEEP main's version** for these files:

### 1. Settings Page
**File:** `src/app/admin-dashboard/settings/page.tsx`
- **Why:** Main has working async save with loading state & success message
- **ui-fixes:** Only logs to console
- **Action:** Keep main's `handleSave` function

### 2. System Health Page
**File:** `src/app/admin-dashboard/system-health/page.tsx`
- **Why:** Main has working onClick handlers for Settings & Bell buttons
- **ui-fixes:** Buttons wrapped in tooltips but no handlers
- **Action:** Keep main's buttons but ADD tooltip wrappers from ui-fixes

### 3. Bot Analytics
**File:** `src/app/admin-dashboard/analytics/page.tsx`
- **Why:** Main has working Export CSV + See More + Last 30 Days filter
- **ui-fixes:** Removed Export button, no See More
- **Action:** Keep main's functionality, ADD tooltip styling from ui-fixes

### 4. Chatbot Issues
**File:** `src/app/admin-dashboard/chatbot-issues/page.tsx`
- **Why:** Main has working 3-dot dropdown with 4 actions
- **ui-fixes:** Individual buttons with tooltips
- **Action:** Keep main's dropdown OR merge both approaches (dropdown + tooltips)

### 5. Conversations Page
**File:** `src/app/manager-dashboard/conversations/page.tsx`
- **Why:** Main has stopPropagation fix for navigation bug
- **ui-fixes:** Different button layout
- **Action:** Keep main's event handling, ADD ui-fixes modals if desired

### 6. Avatar Functionality
**Files:**
- `src/app/admin-dashboard/profile/page.tsx`
- `src/app/api/admin/profile/avatar/route.ts`
- `src/entities/User.ts`
- `src/migrations/1730900000-AddAvatarToUser.ts`

- **Why:** Main has complete avatar upload system
- **ui-fixes:** Doesn't have this
- **Action:** Keep ALL from main

### 7. Help Section
**File:** `src/app/manager-dashboard/help/page.tsx`
- **Why:** Main has resource creation (Articles, Videos, FAQs)
- **ui-fixes:** Has report issue modal
- **Action:** MERGE both - Keep main's resource creation + ADD ui-fixes modal

---

## ✅ TAKE UI-FIXES (UI Improvements)

**ACCEPT ui-fixes changes** for these (non-conflicting or UI-only):

### 1. New Pages
- ✅ `src/app/user-dashboard/profile/page.tsx` - Take ui-fixes
- ✅ `src/app/user-dashboard/playground/page.tsx` - Take ui-fixes

### 2. Tooltip Components
- ✅ `src/components/ui/tooltip.tsx` - Take ui-fixes
- ✅ All tooltip imports across files - Take ui-fixes

### 3. UI Improvements
- ✅ Table responsive styling - Take ui-fixes
- ✅ Delete confirmation modals - Take ui-fixes
- ✅ Footer improvements - Take ui-fixes
- ✅ Better text colors - Take ui-fixes
- ✅ Improved spacing/layout - Take ui-fixes

### 4. User Management & Team Management
**Files:**
- `src/app/admin-dashboard/user-management/page.tsx`
- `src/components/dashboard/TeamManagement.tsx`

- **Why:** ui-fixes has tooltips + better table layout
- **Action:** Take ui-fixes version (no functionality conflicts)

---

## 🔄 MERGE BOTH (Combine Features)

Some files need **BOTH** sets of changes:

### 1. System Health - Best Approach
**Combine:**
- Main's onClick handlers (`handleServiceSettings`, `handleServiceAlerts`)
- ui-fixes tooltips wrapper

**Result:**
```tsx
<Tooltip content="Service settings" position="top">
  <button
    onClick={() => handleServiceSettings(service.name)}
    className="text-[#6566F1] hover:text-[#5A5BD9] p-2 rounded-lg"
  >
    <Settings className="w-4 h-4" />
  </button>
</Tooltip>
```

### 2. Help Page - Best Approach
**Combine:**
- Main's resource creation functionality
- ui-fixes report issue modal

**Result:** Both features working together

---

## 📋 MERGE CHECKLIST

During conflict resolution:

- [ ] Settings: Keep main's async save function
- [ ] System Health: Keep main's handlers + ADD ui-fixes tooltips
- [ ] Analytics: Keep main's Export/See More + ADD ui-fixes styling
- [ ] Chatbot Issues: Decide on 3-dot vs individual buttons
- [ ] Conversations: Keep main's stopPropagation
- [ ] Avatar: Keep ALL from main
- [ ] User Dashboard pages: Take from ui-fixes
- [ ] Tooltips: Take from ui-fixes
- [ ] Delete modals: Take from ui-fixes
- [ ] Footer: Take from ui-fixes
- [ ] Help: Merge both features

---

## 🎯 EXPECTED RESULT

After merge:

✅ All buttons work (from main)
✅ Tooltips everywhere (from ui-fixes)
✅ Responsive tables (from ui-fixes)
✅ Delete confirmations (from ui-fixes)
✅ Avatar upload (from main)
✅ Export CSV (from main)
✅ See More button (from main)
✅ User dashboard pages (from ui-fixes)
✅ Resource creation (from main)
✅ Report issue modal (from ui-fixes)

= **BEST OF BOTH WORLDS** 🚀
