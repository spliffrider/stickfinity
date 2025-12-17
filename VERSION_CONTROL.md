# Version Control Safety Protocols

**Maintainer:** Richard (Version Control Expert)
**Status:** REQUIRED

## 1. Golden Rules
1.  **Never work on a dirty state.** Always run `git status` before starting work.
2.  **Commit often.** Small, atomic commits are better than massive dumps.
3.  **Descriptive Messages.** "Fix stuff" is not a commit message. Be specific (e.g., "Fix: Resolve line persistence bug in InfiniteCanvas").

## 2. Session Workflow
### Start of Session
- [ ] `git status` (Must be clean)
- [ ] `git pull` (Sync with remote)

### During Session
- [ ] Make changes.
- [ ] Test changes.
- [ ] `git add .`
- [ ] `git commit -m "Type: Description"`

### End of Session
- [ ] `git status` (Verify no left-overs)
- [ ] `git push` (Safe storage)

## 3. Emerging Issues
If you encounter a git error, **STOP**. Do not force anything. Consult Richard.
