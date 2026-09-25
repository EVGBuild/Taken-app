# Work-package and result contract

Use this contract for every meaningful delegation. It may live in an issue, PR description, task file, or agent result, but the fields must remain recoverable.

## Work package

```yaml
id: capture-v31-001
status: planned # planned | active | blocked | ready-for-qa | complete
owner: builder
goal: "Remove explicitly rejected capture controls without changing capture data behaviour."
why: "Reduce visible system work in the v31 capture flow."
sources:
  - ref: "Elise HQ Bouwbacklog.xlsx, v31 rows 16–19"
    status: user-decision
  - ref: "Project Truth §7"
    status: current-product-truth
fixed_decisions:
  - "Remove 'Meer opties' and 'Type wijzigen' from this flow."
  - "Keep the meaningful 1–5 questions."
do_not_change:
  - "Persisted task shapes and localStorage keys."
  - "Capture classification logic outside this UI slice."
task:
  - "Locate the capture modal controls and remove only the rejected controls."
acceptance_criteria:
  - "No 'Meer opties' or 'Type wijzigen' appears in the task capture flow."
  - "Existing type-specific capture completes and saves as before."
  - "Relevant automated tests pass."
required_checks:
  - "node --test tests/*.test.js"
  - "Physical iPhone/Safari check remains explicitly pending unless performed."
unknowns: []
expected_output:
  - "Branch diff, test evidence, concise result."
next_handoff: qa
```

## Agent result

```yaml
work_package_id: capture-v31-001
role: qa
summary: "..."
decision_status: "implemented-existing-decision"
findings:
  - "..."
evidence:
  - "tests/... passed"
  - "commit/PR ..."
risks_or_conflicts:
  - "iPhone/Safari still not verified"
acceptance_criteria:
  passed: ["..."]
  failed: []
  unverified: ["..."]
recommended_next_handoff: critic # or builder | orchestrator | none
```

## Decision request

Only create one when the team cannot ground the answer:

```yaml
context: "What is genuinely undecided and why existing sources do not settle it?"
options:
  - label: A
    consequence: "..."
  - label: B
    consequence: "..."
recommendation: "Only when grounded; otherwise omit."
question: "One answerable question for Elise."
```

A decision request must not disguise ordinary implementation uncertainty, a missing test, or an agent failure as a product question.
