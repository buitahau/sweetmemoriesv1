# 01 Provision the Neon dev branch and a least-privilege role

**Status:** todo
**Side:** backend
**Size:** S
**Dependencies:** ADR 0004 accepted
**Feature spec:** [dev-test-database](../../features/dev-test-database.md)
**Mockup:** none

## What to change

Ops setup, no code. Create (or reuse) the SweetMemories Neon project. Create a `dev` branch off main and a non-owner role scoped to the dev branch database. Record names (not secrets) in `docs/infra/dev-environment.md`.

## Checklist

- [ ] Neon project exists
- [ ] Branch `dev` created off main
- [ ] Non-owner role scoped to the dev branch database
- [ ] Names (no secrets) recorded in `docs/infra/dev-environment.md`

## Verification

- [ ] The Neon dashboard or CLI lists branch `dev`.
- [ ] The role is not the project owner.
- [ ] Connecting with `psql` using the dev role works on the dev branch only.
- [ ] Covers US-devdb-1.1 and US-devdb-2.4.
