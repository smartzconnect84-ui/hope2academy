---
name: Username login system
description: Portal login uses username (firstname@hope2academy format), email is stored but only used for password reset.
---

## Rule
Login uses `username` (e.g. `grace@hope2academy`), NOT email.
Email is stored on the user record only for `requestPasswordReset` / `resetPassword`.

## Why
Explicit user request: school portal access by username; email privacy preserved.

## How to apply
- `MockUser.username` — required field; format `firstname@hope2academy`
- `mockAuth.signIn(username, password)` — looks up by `username` first, email as fallback
- `generateUsername(name, existingUsers)` — call on `createUser` to auto-generate; deduplicates with numeric suffix
- `getRememberedUsername()` / `setRememberedUsername()` — remember-me stores username
- `ForgotPasswordDialog` — standalone email field; not linked to the username state
- `DEMO_CREDENTIALS` — each entry has `username` field; login buttons use `c.username`
- `USERS_VERSION = "7"` — migration back-fills username onto existing accounts; bumped again if schema changes

## Superadmin reports
`recipientRolesForSubmitter("superadmin")` returns `""` — superadmin cannot submit reports.
`canSubmit = !isSuperadmin` gates the submit button and "My Submitted Reports" section in `Reports.tsx`.
