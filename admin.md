---
title: Edit the documentation
---

# Edit the documentation

Pages are Markdown files in the site's repository. Saving one here commits it
under your own GitHub account, and the site rebuilds from that commit.

<Admin />

## What a save actually does

It is a normal commit, on `main`, with your name on it. There is no separate
database of pages and no draft state: what the repository holds is what the
site serves, and the history is the history.

Two things follow. Anything you write here can be reviewed, blamed and reverted
like any other change. And if two people edit the same page, the second save is
refused rather than silently overwriting the first — the editor sends the
version it read, and GitHub compares.
