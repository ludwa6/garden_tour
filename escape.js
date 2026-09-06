// Shared HTML-escaping helper for every page in this app.
//
// Escapes & < > " ' — the two quote characters are the point. Several call
// sites interpolate into an attribute value, e.g.
//
//   alt="${escapeHtml(obs.species_guess)}"
//
// and a helper that escapes only & < > lets a payload of `" onerror="..."`
// close the attribute and add an event handler to the element. That is the
// stored-XSS path fixed in #15; two pages carried the weaker variant into an
// alt= until #16.
//
// Sources feeding this are untrusted: iNaturalist project 197410 is a
// collection project, auto-including any matching observation with no
// membership or curation, so species_guess is observer free text. Some of it
// also survives a page load via localStorage (erc_observations, tripPlan).
//
// Loaded as a plain <script> before its consumers — there is no module system
// here, so this declares a global. Every page injects a <base href> pointing
// at the app root before loading it, so a bare "escape.js" resolves correctly
// from poi/ as well as from the root, under any deploy root.
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
