(function () {
  "use strict";
  var recipes = [];
  try { recipes = JSON.parse(document.getElementById("recipe-index").textContent); } catch (e) {}

  recipes.forEach(function (r) {
    var items = (r.ingredients || []).filter(Boolean);
    (r.variations || []).forEach(function (v) {
      (v.ingredients || []).forEach(function (i) { if (i && i.item) items.push(i.item); });
      if (v.name) items.push(v.name);
    });
    r._hay = [r.title].concat(r.tags || [], items).join(" ").toLowerCase();
  });

  var grid = document.getElementById("recipe-grid");
  var search = document.getElementById("search");
  var tagBox = document.getElementById("tag-filter");
  var empty = document.getElementById("empty");
  var params = new URLSearchParams(location.search);
  var activeTag = params.get("tag") || "";

  var allTags = {};
  recipes.forEach(function (r) { (r.tags || []).forEach(function (t) { allTags[t] = (allTags[t] || 0) + 1; }); });

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  function renderTags() {
    tagBox.innerHTML = "";
    var names = Object.keys(allTags).sort();
    ["All"].concat(names).forEach(function (t) {
      var val = t === "All" ? "" : t;
      var b = el("button", "chip" + (val === activeTag ? " active" : ""), t);
      b.type = "button";
      b.addEventListener("click", function () {
        activeTag = val;
        var u = new URL(location.href);
        if (val) u.searchParams.set("tag", val); else u.searchParams.delete("tag");
        history.replaceState(null, "", u);
        renderTags(); renderGrid();
      });
      tagBox.appendChild(b);
    });
  }

  function renderGrid() {
    var q = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    grid.innerHTML = "";
    var shown = 0;
    recipes.forEach(function (r) {
      if (activeTag && (r.tags || []).indexOf(activeTag) < 0) return;
      if (q.some(function (w) { return r._hay.indexOf(w) < 0; })) return;
      var li = el("li");
      var a = el("a", "recipe-card"); a.href = r.url;
      a.appendChild(el("h2", null, r.title));
      if (r.total_time) a.appendChild(el("p", "time", r.total_time));
      if (r.tags && r.tags.length) a.appendChild(el("p", "card-tags", r.tags.join(" · ")));
      li.appendChild(a); grid.appendChild(li); shown++;
    });
    empty.hidden = shown > 0;
  }

  search.addEventListener("input", renderGrid);
  renderTags(); renderGrid();
})();
