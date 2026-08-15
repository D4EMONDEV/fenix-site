---
title: Account
---

# Account

<Account />

## Why it works this way

A static site has no server, so it has nothing to check a password against and
nowhere to keep one safely. Rather than invent an account system that would be
security theatre, this site borrows GitHub's: you prove who you are to GitHub,
and GitHub decides whether your edit is allowed when you try to save it.

The consequence is worth stating plainly. **This page cannot stop anybody.** It
can only show you what will happen. The refusal, when there is one, comes from
GitHub's API rejecting a commit — which is a rule nobody can read past by
editing the page in front of them.
