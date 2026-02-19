# Data Cleanup Guide

## Clearing Test Data via Admin Portal

There are no external scripts or terminal commands required to clear your test data. The cleanup logic is integrated directly into the Admin Portal UI.

To safely delete data:

### 1. Announcements / Updates
1. Navigate to **Admin Dashboard** > **Feed** (Announcements).
2. Locate the test announcement you verifying.
3. Click the **Trash Icon (🗑️)** next to the post.
4. Confirm the deletion in the modal.
   * **Note**: This will permanently remove the post from the website and database.

### 2. Events & Registrations
1. Navigate to **Admin Dashboard** > **Events**.
2. Find the test event card.
3. Click the **Trash Icon (🗑️)** on the card.
4. Confirm deletion.
   * **Important**: This action automatically deletes **all guest registrations** associated with that event, keeping your database clean.

### 3. Donations
1. Navigate to **Admin Dashboard** > **Finances**.
2. Find the test donation record in the table.
3. Click the **Delete** button (often in the actions menu).
4. Confirm deletion.

### 4. Families
1. Navigate to **Admin Dashboard** > **Families**.
2. Locate the test family record.
3. Click the **Trash Icon (🗑️)**.
4. Confirm deletion.
   * **Note**: This removes the family and all associated member records.

## Database Consistency
All deletion actions performed via the Admin Portal are **hard deletes**. The records are permanently removed from Firestore immediately. It is safe to re-populate data with the same names or values as they will be treated as new entries with unique IDs.
