(function () {
  "use strict";
  var S = window.RecipeScale;
  var data;
  try { data = JSON.parse(document.getElementById("recipe-data").textContent); }
  catch (e) { return; }

  var makes = data.makes || { qty: 1, unit: "batch" };
  var baseQty = Number(makes.qty) || 1;
  var unitName = makes.unit || "batch";
  var step = Number(data.step) || (baseQty > 1 ? baseQty / 2 : 1);
  var current = Number(data.usually_make) || baseQty;

  var variations = (data.variations && data.variations.length)
    ? data.variations
    : [{ name: "", ingredients: data.ingredients || [] }];
  var active = 0;

  var list = document.getElementById("ingredient-list");
  var label = document.getElementById("yield-label");
  var note = document.getElementById("scale-note");
  var tabs = document.getElementById("variation-tabs");

  // Remember the last variation viewed for this recipe (per device only).
  var storeKey = "variation:" + location.pathname;
  try { var saved = parseInt(localStorage.getItem(storeKey), 10); if (saved >= 0 && saved < variations.length) active = saved; } catch (e) {}

  // Site-wide pantry list from _config.yml (matches if the item name contains a pantry term).
  var pantryTerms = (data.pantry || []).map(function (t) { return String(t).toLowerCase(); });
  function isPantry(item) {
    var name = String(item || "").toLowerCase();
    return pantryTerms.some(function (t) { return t && name.indexOf(t) >= 0; });
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function renderTabs() {
    tabs.innerHTML = "";
    if (variations.length < 2) { tabs.hidden = true; return; }
    variations.forEach(function (v, i) {
      var b = el("button", "tab" + (i === active ? " active" : ""), v.name);
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", i === active ? "true" : "false");
      b.addEventListener("click", function () {
        active = i;
        try { localStorage.setItem(storeKey, String(i)); } catch (e) {}
        render();
      });
      tabs.appendChild(b);
    });
  }

  function render() {
    renderTabs();
    var factor = current / baseQty;
    label.textContent = "Makes " + S.fmt(current) + " " + S.plural(unitName, current);
    list.innerHTML = "";
    var anyRounded = false;
    var grocery = [];

    var groups = (data.sections && data.sections.length) ? data.sections : [{ name: "", ingredients: variations[active].ingredients }];
    groups.forEach(function (g) {
    if (g.name && groups.length > 1) list.appendChild(el("li", "ing-section", g.name));
    (g.ingredients || []).forEach(function (ing) {
      var r = S.scaleIngredient(ing, factor);
      if (!r.pantry && isPantry(r.item)) r.pantry = true;
      var li = el("li", r.pantry ? "pantry" : "");
      var box = el("input"); box.type = "checkbox"; box.setAttribute("aria-label", "Got it");
      li.appendChild(box);
      var txt = el("span", "ing-text");
      if (r.amount) txt.appendChild(el("strong", "amt", r.amount + (r.unit ? " " + r.unit : "")));
      txt.appendChild(document.createTextNode((r.amount ? " " : "") + r.item));
      if (r.note) txt.appendChild(el("span", "note", ", " + r.note));
      if (r.rounded) { txt.appendChild(el("span", "flag", " (rounded up)")); anyRounded = true; }
      if (!r.pantry && r.item) {
        var name = r.item.charAt(0).toUpperCase() + r.item.slice(1);
        grocery.push(r.amount ? name + " — " + r.amount + (r.unit ? " " + r.unit : "") : name);
      }
      li.appendChild(txt);
      li.addEventListener("click", function (e) { if (e.target !== box) box.checked = !box.checked; li.classList.toggle("done", box.checked); });
      box.addEventListener("change", function () { li.classList.toggle("done", box.checked); });
      list.appendChild(li);
    });
    });

    var msgs = [];
    if (Math.abs(factor - 1) > 1e-9) msgs.push("Scaled from the original (" + S.fmt(baseQty) + " " + S.plural(unitName, baseQty) + "). Cook times don't change.");
    if (anyRounded) msgs.push("Whole items are rounded up.");
    note.textContent = msgs.join(" ");
    updateSend(grocery);
  }

  // Hand the list to the iPhone Shortcut, one item per line. The Shortcut holds the Skylight credentials.
  var sendBtn = document.getElementById("send-grocery");
  function updateSend(items) {
    if (!sendBtn) return;
    sendBtn.href = "shortcuts://run-shortcut?name=" + encodeURIComponent(data.shortcut || "Skylight List") +
      "&input=text&text=" + encodeURIComponent(items.join("\n"));
    sendBtn.textContent = "Send " + items.length + " item" + (items.length === 1 ? "" : "s") + " to grocery list";
    sendBtn.classList.toggle("disabled", !items.length);
  }

  document.querySelectorAll(".scaler button").forEach(function (b) {
    b.addEventListener("click", function () {
      var next = current + Number(b.dataset.step) * step;
      if (next >= step - 1e-9) { current = next; render(); }
    });
  });

  // Keep the screen awake while cooking (supported on recent iOS Safari and Chrome).
  var wake = document.getElementById("wake-toggle"), lock = null;
  if (wake) {
    if (!("wakeLock" in navigator)) { wake.closest("label").hidden = true; }
    wake.addEventListener("change", function () {
      if (wake.checked) {
        navigator.wakeLock.request("screen").then(function (l) { lock = l; }).catch(function () { wake.checked = false; });
      } else if (lock) { lock.release(); lock = null; }
    });
    document.addEventListener("visibilitychange", function () {
      if (wake.checked && document.visibilityState === "visible") {
        navigator.wakeLock.request("screen").then(function (l) { lock = l; }).catch(function () {});
      }
    });
  }

  render();
})();
