# ADR 020: Supabase Security Hardening & Automated Profile Provisioning

**Status**: Accepted  
**Date**: 2026-05-22  

**Context**:  
Knightfall persists personal chess games, custom training drills, gamification stats, and puzzle attempts. It is vital to ensure user data isolation and security at the database layer. Additionally, when a new user registers via Supabase Auth, they require immediate database profiles and starting stats. Relying on client-side requests to create these records introduces latency, write race conditions, and vulnerability to client-side manipulation.

**Decision**:  
We implement SQL-level triggers and enforce strict Row-Level Security (RLS) policies directly within the Supabase database.

Security Architecture Specifications:
1. **Automated Database Trigger (`handle_new_user`)**: Create a PostgreSQL trigger linked to the `auth.users` table. Upon a new user signing up, the database automatically provisions matching public schema entries:
   - A profile in `public.profiles` seeded with default ELO ratings and names.
   - Initial stats in the gamification tables.
2. **Mandatory Row-Level Security (RLS)**: Enforce RLS on all tables in the `public` schema.
3. **Data Isolation Policies**:
   - **Profiles**: Publicly readable (to support search and social features) but updates are strictly checked: `auth.uid() = id`.
   - **Matches & Drills**: Read, write, and delete privileges are scoped exclusively to the owner: `auth.uid() = user_id`.
   - **Puzzle Attempts**: Writing attempts is secured to the logged-in user's UUID.
4. **Mocked CI Environments**: Standardize local development testing by supplying global mock environment variables for Supabase endpoints to bypass network/auth blocks during automated integration runs.

**Technical Shifts**:  
- Created and executed [supabase_security_hardening.sql](file:///Users/thunda/Desktop/Development/Knightfall/supabase_security_hardening.sql) containing SQL trigger definitions and policy declarations.
- Updated the Vitest configuration (`vitest.setup.ts`) to mock IndexedDB and Supabase clients, preventing test suites from crashing on remote connection attempts.

**Consequences**:  
- **Positive**:
  - Secure data isolation enforced at the database level, preventing any user from accessing or modifying another user's private chess library or puzzle attempts.
  - Instant, failure-free profile creation during user sign-up.
- **Negative**:
  - Automated testing pipelines (e.g. Playwright E2E) must bypass or mock Supabase authentication states to run successfully in headless environments.
