# Standing rules for all work in this repo
- Do ONLY the module I name. Never start the next module.
- Before creating any file, search the repo for existing functionality or files. Prefer editing existing files.
- No duplicate implementations. No parallel/alternate folders. No "new", "v2", "copy" or "backup" files.
- Do not rewrite working code without a clear technical reason. If the existing architecture conflicts with the request, STOP and explain before any large change.
- Do not change the YOLO model, detection settings, class mapping, density thresholds, or recommendation rules unless the module explicitly says so.
- Git: run `git status` first. Never reset, clean, force-push, discard, or delete user work. Do not commit. Tell me about uncommitted changes before touching those files.
- No hardcoded absolute paths. No secrets. Config via application.properties or env vars.
- Do not regenerate the same code repeatedly. If something fails twice, stop and report the root cause.
- When finished: run `git status` and `git diff --stat`, confirm no duplicate/unnecessary files were created, then report:
  Changes Made (every file created/changed/deleted) / Why / Verification / Remaining Issues / Next Module (do not run it).
  