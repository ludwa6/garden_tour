// Shared JSON-parsing helper for every page in this app.
//
// The `fallback` parameter is load-bearing, not decoration. Before
// consolidation this logic existed in two shapes: three pages used a
// one-argument form that returned null on failure, while qr_admin.js used a
// two-argument form returning a caller-supplied fallback. qr_admin.js calls
// safeParse(stored, []) and then reads .length on the result, so a
// one-argument version would return null there and throw a TypeError on
// malformed localStorage instead of degrading to an empty list. See #20.
//
// The `s ?` guard preserves the three-page behaviour for empty or null input,
// which would otherwise reach JSON.parse("") and throw.
//
// Every page that needs it loads <script src="safe-parse.js"></script> after
// the <base href> IIFE, so the bare path resolves from poi/ as well as the
// app root.
function safeParse(s, fallback = null) {
  try { return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}
