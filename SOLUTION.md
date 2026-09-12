# BemaHub Assessment Solution

**Name:** AGO CHUKWUBUIKEM JIDEOFOR
**Date:** 12/09/2026
**Actual time spent:** Approximately 4 hours on implementation, testing, and documentation, plus 30 minutes of setup, measured through 10:00 a.m. on 12 September 2026 (Africa/Lagos). Commute, chores, and sleep excluded. This exceeds the brief's 180-minute working-time allocation. Add subsequent review time before submission.
**Sessions:** Setup approximately 10:30–11:00 p.m. on 11 September; assessment work 11:00 p.m.–midnight and 7:00–10:00 a.m. on 12 September.

## 1. What I completed

Implemented and verified are distinguished below. Candidate checks refer to results personally reported or screenshots supplied by the candidate; assistant checks were executed by Codex.

| Task               | Status                                                                                                                                                                                             | Evidence                                                                                                                                                                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — Course list    | Implemented; candidate verified list, null/zero display, error/retry and final published-only UI. Loading, empty and expiry checks pending.                                                        | `evidence/task-1-ui.png`, `task-1-ui-before.png`, `task-1-network.png`, `task-1-network-bottom.png`, `task-1-network-headers.png`, `task-1-error.png`                                                                                                               |
| 2 — Authentication | Implemented; candidate verified instructor login/earnings, sign out, signed-out reload, learner behavior before/after permission fix. Expired-session and other error checks pending.              | `evidence/task-2-signedin.png`, `task-2-signedout.png`, `task-2-network.png`, `task-2-learner-before.png`, `task-2-learner-after.png`, `task-2-learner-network-before.png`                                                                                          |
| 3 — Withdrawals    | Implemented; candidate verified client minimum rejection, creation, matching reference/header, refresh request, pending refusal and server amount-field error. Retry/double-submit checks pending. | `evidence/task-3-validation.png`, `task-3-success.png`, `task-3-network.png`, `task-3-response.png`, `task-3-payload.png`, `task-3-refresh.png`, `task-3-pending-error.png`, `task-3-server-test-setup.txt`. Required `task-3-server-error.png` still needs saving. |
| 4 — PHP            | Four minimal fixes, with real before/after HTTP responses.                                                                                                                                         | `evidence/task-4-curl.txt`; separate course, lesson and minimum before/after text files                                                                                                                                                                             |
| 5 — Database       | Assistant executed queries, proved the defect, applied migration 002 and verified rejection.                                                                                                       | `answers/task-5.md`, `evidence/task-5-queries.txt`                                                                                                                                                                                                                  |
| 6 — Infrastructure | Three written diagnostic answers completed; no execution required.                                                                                                                                 | `answers/task-6.md`                                                                                                                                                                                                                                                 |
| 7 — Python         | Three fixes implemented; assistant verified totals and success/file-error/usage exit codes.                                                                                                        | `evidence/task-7-output.txt`                                                                                                                                                                                                                                        |

## 2. What I did NOT finish, and how I would approach it

The following are proposed checks, not passing results. Estimates are approximate and exclude fixing any failures discovered.

| Priority | Remaining check                       | Expected result / approach                                                                                                                                                                                                                                        | Estimate  |
| -------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1        | Final TypeScript and production build | Stop the dev server before building into the same `.next` directory; run `npm.cmd run typecheck` and `npm.cmd run build`, capture results, then restart dev. Earlier TypeScript runs passed; final build is unverified.                                           | 5–10 min  |
| 1        | Evidence completeness and redaction   | Save the server amount-error screenshot already shown in chat as `evidence/task-3-server-error.png`; inspect saved token-bearing screenshots for complete opaque redaction; refresh final course Network evidence if needed.                                      | 5 min     |
| 1        | Expired/invalid session               | In a controlled browser session, invalidate the current token, trigger earnings fetch, and verify HTTP 401 clears stored auth and hides cached earnings. Verify re-login works. Do not put real tokens in evidence.                                               | 5 min     |
| 1        | Idempotent replay                     | Repeat the original successful withdrawal's amount/reference through the API; expect 200, original ID and unchanged row count. Separately simulate an uncertain browser request and verify the retry retains its amount/reference.                                | 10–15 min |
| 1        | Duplicate submission                  | Throttle the withdrawal POST in a controlled fixture and rapidly submit; check one in-flight request and at most one new row. Restore any test state.                                                                                                             | 5–10 min  |
| 2        | Form boundaries                       | Test blank, zero, negative, fractional, below-minimum and above-balance values; expect amount errors and no POST. Test wrong credentials and blocked login API separately.                                                                                        | 5–10 min  |
| 2        | Course loading, empty and expiry      | Observe loading under throttling; use a clearly labeled temporary empty-response fixture for the empty state, then remove it. Keep the page visible for the API's 300-second interval and verify an automatic request. The earlier offline wait was inconclusive. | 10–15 min |
| 2        | Reproduction after setup/reset        | On an isolated fresh database, follow setup and apply 002; inspect the index after any plugin activation/reset and verify repeat-reference behavior. Avoid resetting the evidence database.                                                                       | 10–15 min |

Before submission, complete the name/date, actual total time and personal AI-review decisions. Any unchecked item remains explicitly unverified rather than being inferred from code.

## 3. Task 4 — the defects

**Permission:** `/me/earnings` used `check_authenticated`, allowing learners with valid tokens. Replacing it with the existing `check_instructor` produced learner 200-before/403-after; candidate curl checks also confirmed signed-out 401 and instructor 200. The query already filtered by caller ID: the demonstrated defect was unauthorized role access, not another user's earnings being returned.

**Schema mismatch:** Course detail read nonexistent `lessons_total`, and `?? 0` hid the mistake. Changing the property to `lesson_count` preserved the API name `lessonCount` and integer cast. Assistant SQL confirmed 12 lessons for course 1; HTTP returned 0 before and 12 after. No schema change was needed.

**Publication contract:** The course-list query selected drafts. Adding `WHERE c.is_published = 1` before `ORDER BY` prevented disclosure in the API itself. Assistant HTTP responses showed five courses before and four published courses after; unpublished detail `/courses/5` still returned 404. The candidate supplied the final four-course UI screenshot.

**Withdrawal minimum:** The server did not enforce its minimum, despite client validation. A check against `self::MINIMUM_WITHDRAWAL_MINOR` now returns 422 `below_minimum`, after the existing-reference lookup and before balance/pending checks. Assistant requests for 1000 minor units returned 201 before and 422 after with a fresh reference. PHP syntax validation passed. The original pending withdrawal was temporarily cancelled and restored; the generated test withdrawal remains cancelled for audit. The procedure is in `evidence/test-minimum.ps1`.

Full headers and bodies for each fix are in `evidence/task-4-curl.txt`.

## 4. Specific questions

**Task 1 — preview expiry:** The page converts `previewExpiresInSeconds` to milliseconds for both `staleTime` and `refetchInterval`. Staleness alone does not schedule a request; the interval refreshes the active page, and stale queries refetch on window focus. A one-second interval floor avoids a tight loop for zero expiry. Background polling is disabled; expiry behavior has not yet been runtime-verified.

**Task 3 — reference per attempt:** Reusing the original reference lets a retry after a lost response return the original withdrawal. A newly generated reference could identify a second payout. The form sends the reference in the body and `Idempotency-Key`, retaining the same amount/reference pair after an uncertain response while the component remains mounted.

**Task 5.2 — uniqueness and migration:** MySQL allowed duplicate instructor/reference pairs because `cancelled_at` was NULL in the unique key. Migration 002 removes that component so cancellation does not permit reference reuse. Probe duplicates were rolled back and no other duplicates were found; after migration, the duplicate insert returned error 1062 and no probe rows remained. A new migration changes the existing database without rewriting applied migration 001.

**Task 7 — null fee:** Missing/null fees are treated as zero under an explicit assessment assumption that they mean no recorded fee; this interpretation must be confirmed with the export provider before production use.

## 5. Anything wrong in our brief

- README's setup check expects an array, while the contract specifies an object containing `courses` and `previewExpiresInSeconds`; implementation follows the contract.
- Task 5 subtask times total 25 minutes rather than its 22-minute allocation; Task 6 incident times total 18 rather than 15 minutes.
- The Python header mentions discrepancy exit code 3, but no comparison dataset or discrepancy rule is supplied. No new comparison rule was invented.

The publication leak was an intended code defect, not a brief inconsistency.

## 6. AI Tool Usage

**Tool:** Codex in VS Code. This document was also AI-drafted and remains subject to candidate review.

### 6a. Where AI was used

| Area          | AI contribution                                                                          | Review status                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Setup         | Docker/WSL/BIOS guidance and repository review                                           | Candidate followed setup and confirmed runtime success                                                              |
| Tasks 1–3     | Wrote pages, auth interceptor and withdrawal form; explained code; guided browser checks | Candidate authorized implementation and supplied the results listed below; final personal decisions still to record |
| Task 4        | Identified and implemented four fixes; captured course/lesson/minimum HTTP evidence      | Candidate personally ran role HTTP checks and verified related UI; other requests were assistant-run                |
| Task 5        | Wrote migration/answers, executed SQL and captured results                               | Candidate review pending                                                                                            |
| Task 6        | Drafted diagnostic reasoning                                                             | Candidate review pending; no execution claimed                                                                      |
| Task 7        | Fixed script and executed success/error checks                                           | Candidate agrees with the zero-fee assumption for this assessment; assistant executed the recorded checks           |
| Documentation | Organized evidence and drafted/updated this report                                       | Candidate final review pending                                                                                      |

### 6b. What was accepted or rejected, and why

These explanations were drafted with AI assistance from the changes discussed and the checks I performed.

- **Instructor permission check:** I accepted reusing `check_instructor` because a valid token establishes that someone is signed in, not that they are an instructor. I ran the role checks and confirmed learner 403, instructor 200, and signed-out 401 after the fix.
- **Published-only filtering:** I accepted filtering courses in the backend SQL because hiding drafts only in React would still expose them through the API. I checked the updated page and confirmed that it showed four published courses without Advanced Laminated Dough.
- **Server errors on the amount field:** I accepted attaching insufficient-balance refusals to the amount field because the user needs to know which input requires attention. I verified the controlled stale-balance test: the request returned 422 and the server message appeared beneath the amount.
- **Missing/null Python fees:** I agree with treating these as zero for this assessment, assuming that the export means no recorded fee. This lets the script handle the supplied paid rows without crashing. The provider would need to confirm this interpretation before production use; an unknown fee could otherwise overstate net payouts. The successful Python run was executed by the assistant, not by me personally.

I have not recorded a specific rejected AI suggestion, so I am not claiming one. The expiry and uncertain-retry implementation still have runtime checks pending as listed in section 2; code explanations alone do not establish that those behaviors work.

### 6c. What was personally verified

**Candidate-reported or screenshot-supported checks:** Docker hello-world; backend ready and courses HTTP 200; homepage and course list; null versus zero; course error/retry recovery; final four-course list; instructor login and earnings; sign out and signed-out reload; learner success before the role fix and forbidden UI afterward; curl learner 200-before/403-after, signed-out 401 and instructor 200; withdrawal minimum field validation, 201 creation of withdrawal 1 for 60000, matching payload/header reference, subsequent earnings GET 200, pending refusal, and server 422 with an amount-field error.

**Assistant-executed checks:** TypeScript checks after frontend changes; PHP syntax check on earnings controller; course/lesson/minimum before-and-after HTTP requests; SQL investigation, migration and duplicate rejection; Python 3.14.7 runs yielding totals 7=84750, 9=79700, 11=30000 with exit 0, missing/invalid JSON exit 2, and missing argument exit 1. See the evidence files for raw results.

### 6d. Assumptions

The contract controls API shape and publication rules. Money remains integer minor units, and the withdrawal input explicitly uses minor units. Null and zero measurements are distinct. Missing/null Python fees mean zero only under the stated assumption. AI checks are not represented as candidate-personal execution.

## 7. Assumptions and trade-offs

The provided helpers, auth store and API client are reused. Earnings refresh failures retain cached data and the withdrawal form with an explicit outdated-balance warning; authorization failures hide private data. The course page instead shows an error when refresh fails.

The controlled server-refusal test appended a labeled -88500 ledger entry while the browser retained 128500, producing a server refusal for 60000. An equal +88500 entry restored the balance to 128500; original ledger rows were not edited or deleted. See `evidence/task-3-server-test-setup.txt`.

The backend creates a pending withdrawal without deducting from the ledger, so a successful refetch can return the same balance. The UI does not fabricate a deduction. The database migration preserves the nullable reference column; the API requires nonempty references, but direct SQL NULL references remain possible.

## 8. If this went to production tomorrow

- Uncertain withdrawal attempts live only in component memory; reload/navigation/sign out can lose them. Persistent reconciliation is needed before production.
- The unique index prevents duplicate rows, but concurrent request handling, insert-failure recovery and balance reservation are not comprehensively verified. A matching key in a screenshot does not prove safe retry behavior.
- Plugin activation/reset still describes the original index; fresh setup must apply 002 and schema behavior after reset needs checking.
- The starter's token/localStorage design is assessment-only. Browser validation and JSON transport do not replace backend validation, prepared queries or output escaping. No injection/security audit was performed.
- Python's malformed-record/type handling beyond the supplied cases remains limited. Unknown fees could overstate totals if the zero-fee assumption is wrong.
- Final build, the remaining checks in section 2, evidence redaction review and personal explanation of the submission are still pending.
