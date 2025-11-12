# Avatar Column Migration Instructions

## Error
You're seeing this error because the `avatar` column doesn't exist in the `users` table yet:
```
QueryFailedError: column User.avatar does not exist
```

## Quick Fix - Run the Migration

Choose ONE of these methods:

### Method 1: Using npm script (Recommended)
```bash
npm run migration:run
```

### Method 2: Direct SQL (If Method 1 fails)
Connect to your PostgreSQL database and run:
```sql
ALTER TABLE users ADD COLUMN avatar TEXT NULL;
```

### Method 3: Using psql command line
If you have access to `psql`:
```bash
psql $DATABASE_URL -c "ALTER TABLE users ADD COLUMN avatar TEXT NULL;"
```

### Method 4: Using database GUI
If you use a database GUI (pgAdmin, DBeaver, etc.):
1. Connect to your database
2. Find the `users` table
3. Add a new column:
   - Name: `avatar`
   - Type: `TEXT`
   - Nullable: `YES`

## Verify the Fix
After running the migration, restart your application:
```bash
npm run dev
```

The avatar functionality should now work without errors!

## Migration File Location
The migration file is located at:
`src/migrations/1730900000-AddAvatarToUser.ts`
