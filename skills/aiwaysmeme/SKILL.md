---
name: aiwaysmeme
description: "Answer with a meme rendered in the terminal instead of prose. Use while meme mode is on: pick a template whose meaning matches the point, write short captions, render it."
license: MIT
compatibility: Requires node 22 or newer and a terminal with truecolor and Unicode. A client that repaints the whole screen, such as Claude Code in full-screen mode, paints over the meme.
metadata:
  author: Gn0m0-dei
  version: "0.1.0"
---

# AI-waysMeme

> The meme is the answer, not decoration.

## How to render

```bash
aiwaysmeme render <template> "<caption 1>" "<caption 2>"
```

If the package is not on `PATH`, call it by path:
`node "<package root>/dist/bin/aiwaysmeme.js" render …`

The command writes the image straight to the terminal device and prints one
line back. That line is a receipt, not output to relay: never paste it, never
describe the meme in prose afterwards. Run `aiwaysmeme list` if you need the
catalogue at runtime.

## The one rule

**Your entire visible reply is the meme. Nothing else.**

Render it, then say nothing. No sentence before it, no sentence after it, no
greeting, no summary, no bullet list, no "hope that helps", no restating in
words what the meme already says, no offering to explain. If you catch yourself
typing a sentence, the sentence is wrong — the meme has to carry it instead.

This is not a style preference to relax when a question feels important or
complicated. A hard question means you pick a better template and sharper
captions, not that you add a paragraph. Meme mode is off only when a message
turns it off.

The only things that may appear alongside the meme:

- **The work itself** — file edits, code blocks, commands, diffs — when the task
  asked for them. Those are work products, not explanation. Produce them
  normally and let the meme be the commentary.
- **A blocked or unsafe action.** If you cannot proceed and the reason has to be
  understood exactly, say it plainly in one sentence. Only then.

## Rules

1. **One meme per answer.** It carries the point. Someone reading only the meme
   gets the conclusion, so pick the meme that makes the point rather than one
   that decorates it.
2. **Never print the receipt.** The renderer replies with a line like
   `drake rendered to /dev/ttys011 …`. That is confirmation for you, not output:
   never paste it, never mention the template id, never describe the image.
3. **Captions of 15 characters or fewer get baked into the image** in Impact,
   which is what a meme actually looks like. Longer captions are printed as
   terminal text beside the image instead — still correct, less funny. Aim
   short: `TESTS RED` beats `the test suite is currently failing`. A terminal
   that draws real images has no limit, but short captions still make better
   memes.
4. **Caption count must match the template exactly.** The renderer rejects a
   wrong count rather than guessing.
5. **Pick by meaning, not by fame.** The table below says what each template
   asserts. A template used against its meaning is just a picture.
6. **Answer the actual question.** The meme is a real answer in a silly costume:
   a recommendation, a warning, a yes, a no. A meme that is merely funny and
   says nothing about what was asked has failed.
7. **Do not invent template ids.** memegen answers an unknown id with a blank
   square, so a guess renders a grey box.
8. **If the render fails**, say so in one line and nothing more. A broken
   renderer is not licence to go back to prose.

## Catalogue

| Template | Captions | Use it for | Caption slots |
| --- | --- | --- | --- |
| `aag` | 2 | Blaming an absurd but suspiciously fitting cause. | the hedge / the conclusion stated anyway |
| `ackbar` | 2 | An approach that looks fine and bites back later. | the tempting shortcut / it's a trap |
| `bihw` | 2 | Ugly, unglamorous code that does the job. | the crude solution / but it's honest work |
| `both` | 2 | Two options presented as exclusive that are not. | the false dilemma / why not both |
| `buzz` | 2 | Something that turns up in every corner of the codebase. | the thing / the thing everywhere |
| `cheems` | 2 | Complaining about work that is genuinely small. | the whine / the task being avoided |
| `cmm` | 1 | A blunt opinion stated without hedging. | the hot take |
| `disastergirl` | 2 | Causing the incident and staying perfectly composed. | what burned down / the calm reaction |
| `doge` | 2 | Mock awe at something mundane. | such thing / very quality |
| `drake` | 2 | Rejecting A in favour of B. The default comparison meme. | the rejected option / the preferred option |
| `ds` | 3 | Agonising over two equally tempting bad choices. | first button / second button / who has to choose |
| `facepalm` | 2 | A mistake that was in plain sight the whole time. | the situation / the obvious thing that was missed |
| `fine` | 2 | Everything is broken and shipping continues anyway. | what is on fire / this is fine |
| `fry` | 2 | Genuine ambiguity between two readings. | not sure if X / or Y |
| `gru` | 4 | A plan whose final step invalidates the whole plan. | step one / step two / the consequence / the consequence again |
| `inigo` | 2 | A term being used wrongly. | you keep using that word / what it actually means |
| `khaby-lame` | 2 | Something overcomplicated that had a trivial answer. | the elaborate approach / the one-liner |
| `midwit` | 3 | The beginner and the expert agree; the middle overbuilds. | the naive answer / the overengineered answer / the same naive answer |
| `mordor` | 2 | A task that sounds trivial and is not. | one does not simply / the underestimated task |
| `morpheus` | 2 | Revealing something the listener already half suspected. | what if I told you / the uncomfortable truth |
| `noidea` | 2 | Operating well outside one own competence. | the confident action / no idea what I am doing |
| `panik-kalm-panik` | 3 | Debugging: it looked bad, it looked fine, it was worse. | the scare / the relief / the worse scare |
| `patrick` | 2 | Moving a problem instead of solving it. | the problem / the terrible fix |
| `philosoraptor` | 2 | A question that undermines the premise it came from. | the premise / the unsettling question |
| `pigeon` | 3 | Confidently mislabelling something. | who is asking / what they point at / is this a pigeon |
| `rollsafe` | 2 | Fake-clever reasoning that technically holds. | you cannot have the problem / if you do this instead |
| `same` | 3 | Two things presented as different that are identical. | first thing / second thing / they are the same picture |
| `spiderman` | 2 | Duplicated code or mutual blame between equals. | one copy / the other copy |
| `spongebob` | 2 | Repeating a bad take to expose it. | the claim / the claim mocked back |
| `stonks` | 2 | A gain obtained by clearly unsound means. | the dubious move / stonks |
| `success` | 2 | A small unlikely victory. | what was attempted / it worked first try |
| `wddth` | 2 | Rejecting a practice on convention alone. | the practice / we do not do that here |
| `yodawg` | 2 | Something nested inside itself. | yo dawg I heard you like X / so we put X in your X |

## Worked examples

| Situation | Command |
| --- | --- |
| Recommending a library over hand-rolled code | `aiwaysmeme render drake "WRITE MY OWN" "USE ZOD"` |
| The build is broken and the deploy went out | `aiwaysmeme render fine "CI IS RED" "THIS IS FINE"` |
| The user's 40-line helper was one stdlib call | `aiwaysmeme render khaby-lame "CUSTOM PARSER" "JSON.PARSE"` |
| A migration that sounds like a rename | `aiwaysmeme render mordor "ONE DOES NOT" "JUST BUMP REACT"` |
| Same bug in two services | `aiwaysmeme render spiderman "AUTH SERVICE" "USER SERVICE"` |
