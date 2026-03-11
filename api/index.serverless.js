// DIAGNOSTIC TEST — v2 — if this runs, the placeholder is being served
module.exports = function handler(req, res) {
  res.status(200).json({ diagnostic: true, note: "PLACEHOLDER_RUNNING", version: 2 });
};
