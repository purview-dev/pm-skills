# R-026 pm-checkpoint keeps every item field through switch, push, and pop

Item: R-026. Serves: V2. Branch: `feat/r-026-checkpoint-keeps-item-fields`.
Follows `2026-11-19-now-item-owner-size-links-design.md` (R-018), which left
`Note` out of `NOW.md` "for a later item".

## Intent

Moving the active item out of Now and back never loses a field. Today
`pm-next` drops the item's `Note` when it claims it, so `pm-checkpoint`
`switch`, and `push` then `pop`, return the item without it. A `Note:` that
`pm-next` step 3 holds ("Start it as is" and its reason) has nowhere to land
at all, because step 8 removes the item from `ROADMAP.md`.

Done when: an item claimed with a `Note` and then moved with `switch`, or
`push` then `pop`, returns to `ROADMAP.md` with every field it had before
the claim, including `Note`, and `just test` covers the field list.

## Goals

- `Note` rides `NOW.md` and the stack entry, so every roadmap item field
  except `Status` and `Paused checkpoint` survives claim, switch, push, and
  pop. (`Status` and `Paused checkpoint` are rewritten by `switch` by design.)
- `pm-next` writes a held `Note:` (step 3 to 5) into `NOW.md`'s `Note`.
- `switch` never writes a roadmap block that `roadmap/item` rejects.
- The two R-018 review wording fixes in `pm-checkpoint`.

## Non-goals

- No export change: `now.item` does not gain `note`, `schemaVersion` stays 4,
  the docs site is untouched.
- No change to `done`: the Completion record does not need `Note`.
- `pm-setup` keeps its NOW backfill as is; it does not rewrite `STACK.md`.

## Approaches

- **A. `Note` as a sixth optional `NOW.md` item field (chosen by the user).**
  `pm-next` writes it, `push` copies it, `pop` restores it, `switch` writes
  it back. Robust, and it fixes the `pm-next` held-note gap.
- **B. Recover it from git.** `switch` and `pop` read the item block from
  the parent of the claim commit, as `pm-setup` does. No `NOW.md` change,
  but it depends on finding that commit and cannot hold a note added at
  claim time.

## Design

1. **`NOW.md` field.** `Note` is an optional field after `Revisits`, before
   `Spec`: `... Depends on, Revisits, Note, Spec, Plan, Started`. It is
   written only when the item has a note (absent otherwise), so a NOW with
   no note is unchanged. `pm-init`'s `NOW.md` template comment lists it.
2. **`pm-lint`.** `now/fields` accepts three shapes: rules 19 (no item
   fields), rules 20 (the five), and the five plus `Note`. `KEYS.stack` gains
   `Note` after `Revisits`. The rule text in `rules.ts` and `rules.md`
   changes together.
3. **`pm-next`.** Step 7 copies the item's `Note` into `NOW.md`; a held
   step 3 to 5 note is appended to it (`<existing>. <date>: <held note>`),
   or becomes it. Step 8 then has no `Note:` write left for the removed item.
4. **`pm-checkpoint`.**
   - `switch` writes `Note` back with the other fields.
   - `push` copies `Note` into the entry after `Revisits` when present; the
     citation of `now/fields` is reworded: the five are copied as a group so
     `pop` can restore a `NOW.md` that `now/fields` accepts.
   - `pop` restores `Note` when present, and states that the item fields
     land after `Milestone` and before `Spec`, as `pm-next` step 7 and
     `pm-rejoin` do.
   - **Missing fields (my call).** Before `switch` writes the roadmap block,
     when `NOW.md` (or, for `pop` followed by `switch`, the restored entry)
     lacks the item fields, it recovers them the way `pm-setup` Step 5
     item 5 does: the item block from `git show <claim commit>^:<PM
     root>/ROADMAP.md`, defaulting `Owner` `agent`, `Depends on` `none`; if
     that fails, one choice question per missing required value (`Serves`,
     `Size`). `pop` of a rules-19 entry stays valid as is (rules-19 NOW
     shape), so it needs no recovery.
5. **Other readers.** `pm-rejoin`, `pm-resume`, and `pm-help` mentions of
   the NOW item fields gain `Note` where they list them.
6. **Rules bump.** A skills change: `just bump major` to 22, `pm-setup`
   installs the section here, and a `Version 22` upgrade note: `NOW.md` and
   stack entries carry the item's `Note`; no setting is added.
7. **Tests (`just test`).**
   - `lint.test.ts`: a NOW and a stack entry with `Note` lint clean; `Note`
     in the wrong place fails `now/fields`.
   - A field-list test: the roadmap item fields (`KEYS.item` minus `Status`,
     `Paused checkpoint`, `Done when`) are each in `KEYS.now`, and each in
     the `push` template in `skills/pm-checkpoint/SKILL.md`, so a new item
     field cannot be added without carrying it through.

## Left to the builder

- Exact sentences in each SKILL.md, matching the surrounding style.
- Which test file holds the field-list test (`lint.test.ts` is the default).
