/* Recipe scaling helpers. Pure functions, no DOM, so they can be tested in Node. */
(function (root) {
  "use strict";

  // Volume units measured in teaspoons.
  var VOLUME = { tsp: 1, tbsp: 3, cup: 48 };
  var UNIT_ALIASES = {
    teaspoon: "tsp", teaspoons: "tsp", t: "tsp",
    tablespoon: "tbsp", tablespoons: "tbsp", tbs: "tbsp", T: "tbsp",
    cups: "cup", c: "cup"
  };
  // Things you buy or use whole: round up, never show "1.5 cans".
  var WHOLE_UNITS = { "": true, can: true, jar: true, package: true, pkg: true, box: true, bag: true, bunch: true, head: true, stick: true, clove: true };
  // Things that can sensibly be halved.
  var HALF_UNITS = { lb: true, oz: true };

  var PLURALS = { cup: "cups", can: "cans", clove: "cloves", jar: "jars", package: "packages", box: "boxes",
    bag: "bags", bunch: "bunches", head: "heads", stick: "sticks", waffle: "waffles", serving: "servings",
    batch: "batches", slice: "slices", piece: "pieces", loaf: "loaves", cookie: "cookies", muffin: "muffins", casserole: "casseroles", dash: "dashes", pan: "pans" };

  var NICE = [
    [0, ""], [1 / 8, "⅛"], [1 / 4, "¼"], [1 / 3, "⅓"], [1 / 2, "½"],
    [2 / 3, "⅔"], [3 / 4, "¾"], [1, ""]
  ];

  function normUnit(u) {
    u = (u == null ? "" : String(u)).trim();
    return UNIT_ALIASES[u] || u;
  }

  // Parse "1", "0.5", "1/3", "1 1/2", "2-3", "2–3" -> {lo, hi} or null if blank / non-numeric.
  function parseOne(s) {
    s = String(s).trim();
    if (!s) return null;
    var m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (m) return +m[1] + (+m[2] / +m[3]);
    m = s.match(/^(\d+)\/(\d+)$/);
    if (m) return +m[1] / +m[2];
    var n = parseFloat(s);
    return isNaN(n) ? null : n;
  }
  function parseQty(q) {
    if (q == null || q === "") return null;
    if (typeof q === "number") return { lo: q, hi: q };
    var parts = String(q).split(/\s*[-–]\s*/);
    var lo = parseOne(parts[0]);
    if (lo == null) return null;
    var hi = parts.length > 1 ? parseOne(parts[1]) : lo;
    return { lo: lo, hi: hi == null ? lo : hi };
  }

  // Round to the nearest kitchen fraction and format: 1.5 -> "1½", 0.333 -> "⅓".
  function nearestNice(x) {
    var whole = Math.floor(x + 1e-9), frac = x - whole, best = NICE[0], err = Infinity;
    for (var i = 0; i < NICE.length; i++) {
      var e = Math.abs(frac - NICE[i][0]);
      if (e < err) { err = e; best = NICE[i]; }
    }
    if (best[0] === 1) { whole += 1; best = NICE[0]; }
    return { value: whole + best[0], text: (whole ? String(whole) : "") + best[1] || "0" };
  }
  function fmt(x) {
    var t = nearestNice(x).text;
    return t === "" ? "0" : t;
  }

  // Pick the friendliest volume unit for an amount given in teaspoons.
  function bestVolume(tsp) {
    var order = [["cup", 0.25], ["tbsp", 1], ["tsp", 0]];
    for (var i = 0; i < order.length; i++) {
      var u = order[i][0], min = order[i][1], v = tsp / VOLUME[u];
      if (v + 1e-9 < min) continue;
      var r = nearestNice(v).value;
      if (u === "tsp" || Math.abs(r - v) / v <= 0.06) return u;
    }
    return "tsp";
  }

  function plural(unit, amount) {
    if (!unit) return "";
    if (amount <= 1 + 1e-9) return unit;
    return PLURALS[unit] || unit;
  }

  /*
   * Scale one ingredient.
   * ing: {qty, unit, item, note, pantry}
   * factor: multiplier (1 = as written)
   * Returns {amount, unit, item, note, pantry, rounded}
   */
  function scaleIngredient(ing, factor) {
    var unit = normUnit(ing.unit);
    var q = parseQty(ing.qty);
    var out = { amount: "", unit: unit, item: ing.item || "", note: ing.note || "", pantry: !!ing.pantry, rounded: false };

    if (!q) { return out; }                       // "to taste" etc. never scale

    if (Math.abs(factor - 1) < 1e-9) {            // as written: keep the writer's units
      out.amount = q.lo === q.hi ? fmt(q.lo) : fmt(q.lo) + "–" + fmt(q.hi);
      out.unit = plural(unit, q.hi);
      if (!unit && q.hi > 1) out.item = pluralItem(out.item);
      return out;
    }

    var lo = q.lo * factor, hi = q.hi * factor;

    if (VOLUME[unit]) {
      var u = bestVolume(hi * VOLUME[unit]);
      lo = lo * VOLUME[unit] / VOLUME[u];
      hi = hi * VOLUME[unit] / VOLUME[u];
      unit = u;
    } else if (WHOLE_UNITS[unit]) {
      var rlo = Math.ceil(lo - 1e-9), rhi = Math.ceil(hi - 1e-9);
      if (rlo !== lo || rhi !== hi) out.rounded = true;
      lo = rlo; hi = rhi;
    } else if (HALF_UNITS[unit]) {
      lo = Math.max(0.5, Math.round(lo * 2) / 2);
      hi = Math.max(0.5, Math.round(hi * 2) / 2);
    }

    var a = fmt(lo), b = fmt(hi);
    out.amount = a === b ? a : a + "–" + b;
    out.unit = plural(unit, hi);
    if (!unit && hi > 1) out.item = pluralItem(out.item);
    return out;
  }

  // "egg" -> "eggs", "onion" -> "onions" when counted with no unit.
  function pluralItem(item) {
    var m = String(item).match(/^(.*?)(\S+)$/);
    if (!m) return item;
    var w = m[2], pre = m[1];
    if (/s$/i.test(w)) return item;
    if (/(ch|sh|x|o)$/i.test(w)) return pre + w + "es";
    if (/[^aeiou]y$/i.test(w)) return pre + w.slice(0, -1) + "ies";
    return pre + w + "s";
  }

  var api = { parseQty: parseQty, fmt: fmt, scaleIngredient: scaleIngredient, plural: plural, normUnit: normUnit };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.RecipeScale = api;
})(this);
