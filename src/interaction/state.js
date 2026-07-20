/* Single owner of the mutable camera-mode flags that several interaction modules
   both read and write. An exported `let` is read-only to importers, so a shared
   mutable object is the mistake-proof way to share this: every module does
   `state.flying = true` / reads `state.flying`, all seeing the same object. */
export const state = {
  flying: false,   // free-fly walkthrough active
  headLook: false, // fixed-position eye-level head-look active
  eyeLock: false,  // (vestigial) orbit-based eye lock — kept for setView parity
};
