# Remaining UI/UX Fixes - Implementation Guide

## ✅ COMPLETED (2/15)
1. ✅ Navigation: Smart CTA buttons redirect to dashboard when logged in
2. ✅ Remove n8n mentions from customer-facing text

## 🚧 IN PROGRESS (1/15)
3. 🚧 Bot deletion + Delete confirmations
   - Import ConfirmDialog added to manager-bots/page.tsx
   - Next: Add state and replace confirm() calls

## 📋 REMAINING FIXES (12/15)

### HIGH PRIORITY

#### 3. Delete Confirmation Dialogs (CRITICAL - Data Safety)
**Status:** Import added, needs implementation
**File:** `src/app/manager-dashboard/manager-bots/page.tsx` (line 903+)
**Implementation:**
```tsx
// Add state (after line 128):
const [deleteConfirm, setDeleteConfirm] = useState<{
  isOpen: boolean;
  botId: string;
  botName: string;
} | null>(null);

// Update handleDeleteBot function (line 903):
const handleDeleteBot = async (bot: {id: string; name: string}) => {
  setDeleteConfirm({ isOpen: true, botId: bot.id, botName: bot.name });
};

const confirmDelete = async () => {
  if (!deleteConfirm) return;
  try {
    const response = await fetch(`/api/manager/delete-bot`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botId: deleteConfirm.botId }),
    });

    if (response.ok) {
      // Refresh bots list
      const refreshResponse = await fetch('/api/manager/bots');
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setBots(data.bots || []);
      }
      alert(`✅ Bot "${deleteConfirm.botName}" deleted successfully`);
    } else {
      const error = await response.json();
      alert(`❌ Failed to delete bot: ${error.message}`);
    }
  } catch (error) {
    alert('❌ Network error. Please try again.');
  } finally {
    setDeleteConfirm(null);
  }
};

// Add to JSX (before closing div):
{deleteConfirm && (
  <ConfirmDialog
    isOpen={deleteConfirm.isOpen}
    onClose={() => setDeleteConfirm(null)}
    onConfirm={confirmDelete}
    title="Delete Bot?"
    message={`Are you sure you want to delete "${deleteConfirm.botName}"? This action cannot be undone.`}
    confirmText="Delete"
    cancelText="Cancel"
    variant="danger"
  />
)}
```

**Apply same pattern to:**
- Knowledge base document deletion
- User unassignment
- Any other delete operations

#### 4. Edit Bot Modal - Fix Overflow
**File:** Search for Edit modal in manager-bots/page.tsx
**Fix:**
```tsx
// Find the modal div, add these classes:
className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/20"
onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}

// Find modal content div, update:
className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
```

#### 5. Users Modal - Blur Backdrop
**Files:** All modals currently using `bg-black/50`
**Find/Replace:**
- Find: `bg-black/50` or `bg-black/60`
- Replace: `backdrop-blur-sm bg-black/20`

### MEDIUM PRIORITY

#### 6. Sidebar Cursor + Right-Click
**File:** Find sidebar component (likely in components/)
**Fix:**
```tsx
<nav className="...existing classes... cursor-pointer">
  <Link
    href="/manager-dashboard/overview"
    className="...existing... cursor-pointer hover:bg-gray-100"
    // Remove any onContextMenu={e => e.preventDefault()} if present
  >
```

#### 7. Issues Page - Sidebar Active State
**File:** Sidebar component
**Fix:**
```tsx
const pathname = usePathname();

<Link
  href="/manager-dashboard/issues"
  className={`... ${pathname === '/manager-dashboard/issues' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
>
```

#### 8. Overview - Clickable Stats
**File:** `src/app/manager-dashboard/page.tsx` or Overview component
**Implementation:**
```tsx
<div
  onClick={() => router.push('/manager-dashboard/team-management')}
  className="bg-white rounded-xl p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
>
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-600">Total Users</p>
      <p className="text-3xl font-bold">{totalUsers}</p>
    </div>
    <Users className="w-10 h-10 text-purple-600" />
  </div>
</div>

// Similar for other 3 cards:
- Active Chats → /manager-dashboard/conversations
- Pending Users → /manager-dashboard/team-management (with filter)
- Resolved Today → /manager-dashboard/issues
```

#### 9. Conversations Table - Center Align
**File:** Find conversations table component
**Fix:**
```tsx
<thead>
  <tr>
    <th className="text-center">MESSAGES</th>
    <th className="text-center">DURATION</th>
    <th className="text-center">RATING</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td className="text-center">{messages}</td>
    <td className="text-center">{duration}</td>
    <td className="text-center">{rating}</td>
  </tr>
</tbody>
```

### LOWER PRIORITY

#### 10. Pricing - Monthly/Yearly Toggle
**File:** `src/app/pricing/page.tsx`
**Implementation:**
```tsx
const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

const plans = {
  basic: { monthly: 29, yearly: 290 },
  professional: { monthly: 99, yearly: 990 },
  enterprise: { monthly: 299, yearly: 2990 }
};

<div className="flex items-center justify-center gap-4 mb-12">
  <span className={billingPeriod === 'monthly' ? 'font-bold' : ''}>Monthly</span>
  <button
    onClick={() => setBillingPeriod(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
    className="relative w-14 h-7 bg-blue-600 rounded-full transition-colors"
  >
    <span className={`absolute top-1 ${billingPeriod === 'monthly' ? 'left-1' : 'left-7'} w-5 h-5 bg-white rounded-full transition-all`} />
  </button>
  <span className={billingPeriod === 'yearly' ? 'font-bold' : ''}>
    Yearly <span className="text-green-600 text-sm">(Save 17%)</span>
  </span>
</div>

<p className="text-3xl font-bold">
  ${plans.basic[billingPeriod]}
  <span className="text-lg text-gray-600">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
</p>
```

#### 11. Playground - Remove Chat Icon
**File:** `src/app/user-dashboard/playground/page.tsx`
**Implementation:**
```tsx
useEffect(() => {
  // Hide chat widget on playground
  const widget = document.querySelector('[id*="chat"]') as HTMLElement;
  if (widget) {
    widget.style.display = 'none';
  }

  return () => {
    // Restore on unmount
    if (widget) {
      widget.style.display = 'block';
    }
  };
}, []);
```

#### 12. Watch Demo - Open Widget
**Files:** All pages with "Watch Demo" button
**Implementation:**
```tsx
<button
  onClick={() => {
    // Trigger chat widget
    const widget = document.querySelector('[id*="chat-widget"]') as HTMLElement;
    if (widget) {
      widget.click();
    }
  }}
  className="..."
>
  Watch Demo
</button>
```

#### 13. Help Center Link
**Files:** Navigation components
**Fix:** Change all help links to always go to `/support` regardless of auth status

---

## Testing Checklist

After implementing each fix:

- [ ] Test with manager account
- [ ] Test with user account
- [ ] Test with admin account
- [ ] Test without being logged in
- [ ] Test on mobile viewport
- [ ] Test keyboard navigation
- [ ] Test with screen reader if applicable

## Priority Order for Implementation

1. Delete confirmations (#3) - Prevents accidental data loss
2. Edit modal overflow (#4) - Blocking UI issue
3. Modal backdrop blur (#5) - Professional appearance
4. Sidebar fixes (#6, #7) - Navigation UX
5. Clickable stats (#8) - Dashboard functionality
6. Conversations alignment (#9) - Visual consistency
7. Pricing toggle (#10) - Feature completeness
8. Playground icon (#11) - Polish
9. Watch demo (#12) - Demo functionality
10. Help link (#13) - Support access
