# Implementation Plan: Fixes and New Features

## 1. Fix: Time not saving in database and Date range
**Problem:** The `NewTaskForm` sends payload fields like `schedule`, `timePref`, and `timeSpecific` which do not match the Mongoose `Habit` schema (`dateRange`, `scheduledTime`).
**Solution:** 
- Update `NewTaskForm.jsx` to construct the payload matching the schema.
  - `dateRange.isDaily`, `dateRange.startDate`, `dateRange.endDate`
  - `scheduledTime.timeOption`, `scheduledTime.fixedTime`, `scheduledTime.timeRangeStart`, `scheduledTime.timeRangeEnd`
- Modify `Habit.js` schema if needed, but the current schema supports these, we just need to send them correctly.

## 2. Feature: Custom Categories Table
**Problem:** Categories are hardcoded in `NewTaskForm.jsx`. User wants custom categories saved per user.
**Solution:**
- Create a new Mongoose Model: `api/_models/Category.js` with `name` and `userId`.
- Create a new API route: `api/categories/index.js` (GET/POST) to fetch and create categories.
- Update `NewTaskForm.jsx` to fetch categories from the API on mount, merging them with default categories ('General', 'Health', 'Work', 'Productivity').
- When a user creates a new category, POST it to `/api/categories`.

## 3. Fix: Ability to tick tasks is gone
**Problem:** The user reported they can't tick tasks anymore. The event handler might be crashing or the state isn't updating.
**Solution:**
- Verify `task._id` exists. Mongoose returns `_id` by default.
- Verify that `toggleTask` logic handles missing fields safely.
- Ensure the optimistic UI update works flawlessly. I will add a safe-guard for `_id` fallback in `DailyTasks.jsx` (e.g. `t._id || t.id`).
- I will check if any Z-index or pointer-events are blocking the click in CSS.

## 4. Verification
- We will deploy and verify the payload sent by the form.
