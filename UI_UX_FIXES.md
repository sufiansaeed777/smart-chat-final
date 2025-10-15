# UI/UX Fixes - Comprehensive List

## 1. Navigation Redirects (CRITICAL)
**Issue:** "Get Started Free", "Launch My Chatbot", "Start Building Free" buttons go to /signup even when logged in
**Fix:** Check session, redirect to appropriate dashboard
- Manager role → `/manager-dashboard`
- Admin role → `/admin-dashboard`
- User role → `/user-dashboard`
**Files:**
- `src/app/page.tsx` (lines 128, 284)
- `src/app/pricing/page.tsx`
- `src/app/product/page.tsx`

## 2. Watch Demo Button (ALL PAGES)
**Issue:** Watch Demo button should open AI chat widget
**Fix:** Add chat widget trigger on all pages
**Files:** All page components with "Watch Demo" button

## 3. Get Expert Help Link
**Issue:** Should go to help center regardless of login status
**Fix:** Always link to `/support` or `/help` page
**Files:** Navigation components

## 4. Pricing Page - Monthly/Yearly Toggle
**Issue:** No toggle for billing period, prices are static
**Fix:** Add toggle button, update prices dynamically
- Basic: $29/mo or $290/yr (save $58)
- Professional: $99/mo or $990/yr (save $198)
- Enterprise: $299/mo or $2990/yr (save $598)
**File:** `src/app/pricing/page.tsx`

## 5. Overview Stats - Make Clickable
**Issue:** 4 stat cards (Total Users, Active Chats, Pending Users, Resolved Today) not clickable
**Fix:** Add onClick handlers:
- Total Users → `/manager-dashboard/team-management`
- Active Chats → `/manager-dashboard/conversations`
- Pending Users → `/manager-dashboard/team-management` (filter pending)
- Resolved Today → `/manager-dashboard/issues`
**File:** `src/app/manager-dashboard/page.tsx` or Overview component

## 6. Sidebar Cursor & Context Menu
**Issue:** Arrow cursor instead of pointer, no right-click menu
**Fix:**
- Add `cursor-pointer` class
- Enable native browser context menu (remove `onContextMenu` preventDefault if exists)
**File:** Sidebar component

## 7. Bot Deletion Not Working
**Issue:** Delete bot button doesn't work
**Fix:** Check API endpoint, add proper error handling
**File:** `src/app/manager-dashboard/bots/page.tsx`

## 8. Modal Backdrop - Blur Instead of Black
**Issue:** Users modal has black background overlay
**Fix:** Change from `bg-black/50` to `backdrop-blur-sm bg-black/20`
**Files:** All modal components

## 9. Remove Google Default Popups
**Issue:** Using browser's default `alert()`, `confirm()` dialogs
**Fix:** Create custom modal components:
- `<ConfirmDialog>`
- `<AlertDialog>`
- `<SuccessToast>`
**Example:** Screenshot shows "smart-chat-finale.vercel.app says" - this is browser default
**Files:** Replace all `alert()`, `confirm()`, `window.alert()` calls

## 10. Remove n8n Mentions
**Issue:** Customer-facing text mentions "n8n" and "train with n8n"
**Fix:** Replace with generic terms:
- "train with n8n" → "train your bot"
- "n8n webhook" → "AI training"
**Files:** Grep for "n8n" in customer-facing pages

## 11. Edit Bot Modal - Overflow & Close
**Issue:** Modal goes off-screen, can't see close button or OK button
**Fix:**
- Add `max-h-[90vh] overflow-y-auto`
- Add click-outside-to-close: `onClick={(e) => e.target === e.currentTarget && onClose()}`
**File:** Edit bot modal component

## 12. Delete Confirmation Warnings
**Issue:** Delete buttons have no confirmation
**Fix:** Add confirmation dialog before ALL delete actions:
```tsx
const handleDelete = async () => {
  const confirmed = await confirmDialog({
    title: "Delete Document?",
    message: "This action cannot be undone.",
    confirmText: "Delete",
    cancelText: "Cancel"
  });
  if (confirmed) {
    // proceed with deletion
  }
};
```
**Files:** All pages with delete functionality

## 13. Conversations Table - Center Align
**Issue:** MESSAGES, DURATION, RATING columns not centered
**Fix:** Add `text-center` class to table cells
**File:** Conversations table component

## 14. Issues Page - Sidebar Active State
**Issue:** When on `/manager-dashboard/issues`, sidebar shows "Overview" as active
**Fix:** Update sidebar active state logic to match pathname
**File:** Sidebar component

## 15. Playground - Remove Chat Icon
**Issue:** Blue chat icon visible at bottom right
**Fix:** Hide the floating chat widget on playground page
```tsx
// In playground page
useEffect(() => {
  const widget = document.getElementById('chat-widget');
  if (widget) widget.style.display = 'none';
  return () => { if (widget) widget.style.display = 'block'; };
}, []);
```
**File:** `src/app/user-dashboard/playground/page.tsx`

---

## Priority Order
1. ✅ Delete confirmations (#12) - Data safety
2. ✅ Edit modal overflow (#11) - Blocking users
3. ✅ Bot deletion fix (#7) - Core functionality
4. ✅ Navigation redirects (#1) - User experience
5. ✅ Remove n8n mentions (#10) - Professional appearance
6. Sidebar fixes (#6, #14)
7. Modal backdrop blur (#8)
8. Clickable stats (#5)
9. Pricing toggle (#4)
10. Custom dialogs (#9)
11. Conversations alignment (#13)
12. Watch demo (#2)
13. Help link (#3)
14. Playground icon (#15)
