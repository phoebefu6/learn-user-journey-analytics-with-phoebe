/* learn-metric-decomposition-with-phoebe - live driver-tree simulator
   Every .treebox on a page is a REAL, interactive metric driver tree. Edit a
   leaf input (traffic, conversion, churn...) and every parent up to the top-line
   recomputes instantly. Press "Simulate a drop" and one driver is knocked down
   at random - the changed leaf and its whole path to the top-line light up coral,
   so you practise tracing a fall back to its cause. "Reset" restores the baseline.

   No network, no library - plain JS. A page declares a tree as JSON inside the box:

     <div class="treebox" data-caption="optional line under the tree">
       <pre class="tree-src">{
         "unit": "$", "root": {
           "label": "GMV", "op": "x", "children": [
             { "label": "Traffic",    "value": 120000, "unit": "visits" },
             { "label": "Conversion", "value": 0.028,  "pct": true },
             { "label": "AOV",        "value": 62,     "unit": "$" }
           ]
         }
       }</pre>
     </div>

   op on an internal node: "x" (product of children), "+" (sum), or "bridge"
   (sum of child.sign * child, sign defaults to +1; use -1 for churn/losses).
   Leaves without children are editable. Values with "pct": true render + edit
   as percentages. */

(function () {
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function fmt(node, v) {
    if (v === null || v === undefined || isNaN(v)) return "-";
    if (node.pct) return (Math.round(v * 1000) / 10) + "%";
    var u = node.unit || "";
    var abs = Math.abs(v);
    var s;
    if (abs >= 1e9) s = (Math.round(v / 1e8) / 10) + "B";
    else if (abs >= 1e6) s = (Math.round(v / 1e5) / 10) + "M";
    else if (abs >= 1e3) s = (Math.round(v / 100) / 10) + "K";
    else s = (Math.round(v * 100) / 100).toString();
    return u === "$" ? "$" + s : (u ? s + " " + u : s);
  }

  /* post-order compute: leaves hold .value, internals combine children by op */
  function compute(node) {
    if (!node.children || !node.children.length) return node.value;
    var vals = node.children.map(compute);
    var op = node.op || "x";
    if (op === "+") return vals.reduce(function (a, b) { return a + b; }, 0);
    if (op === "bridge") {
      return node.children.reduce(function (a, c, i) {
        return a + (c.sign || 1) * vals[i];
      }, 0);
    }
    return vals.reduce(function (a, b) { return a * b; }, 1); // "x"
  }

  function opLabel(op) {
    if (op === "+") return "sum of";
    if (op === "bridge") return "bridge";
    return "product of";
  }

  /* deep clone the plain-JSON tree */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* collect leaves with a path of node-ids from root, so we can light the trail */
  function walk(node, id, cb, parents) {
    node._id = id;
    node._parents = parents;
    cb(node);
    (node.children || []).forEach(function (c, i) {
      walk(c, id + "-" + i, cb, parents.concat([id]));
    });
  }

  function wire(box) {
    var srcEl = box.querySelector(".tree-src");
    if (!srcEl) return;
    var spec;
    try { spec = JSON.parse(srcEl.textContent); }
    catch (e) {
      box.innerHTML = '<div class="tree-err">Tree JSON failed to parse: ' + esc(e.message) + "</div>";
      return;
    }
    if (spec.unit && !spec.root.unit) spec.root.unit = spec.unit;
    var baseline = clone(spec.root);
    var current = clone(spec.root);
    walk(baseline, "n", function () {}, []);

    box.innerHTML = "";
    box.classList.add("treebox-ready");

    // toolbar
    var bar = document.createElement("div");
    bar.className = "tree-bar";
    var dot = document.createElement("span"); dot.className = "tree-dot";
    var title = document.createElement("span"); title.className = "tree-title";
    title.textContent = "live driver tree - edit a leaf, watch the top line move";
    var spacer = document.createElement("span"); spacer.className = "tree-spacer";
    var dropBtn = document.createElement("button");
    dropBtn.type = "button"; dropBtn.className = "tree-btn tree-drop"; dropBtn.textContent = "Simulate a drop";
    var resetBtn = document.createElement("button");
    resetBtn.type = "button"; resetBtn.className = "tree-btn"; resetBtn.textContent = "Reset";
    bar.appendChild(dot); bar.appendChild(title); bar.appendChild(spacer);
    bar.appendChild(dropBtn); bar.appendChild(resetBtn);

    var canvas = document.createElement("div");
    canvas.className = "tree-canvas";

    var note = document.createElement("div");
    note.className = "tree-note";

    box.appendChild(bar);
    box.appendChild(canvas);
    box.appendChild(note);
    if (spec.caption || box.getAttribute("data-caption")) {
      var cap = document.createElement("div");
      cap.className = "tree-cap";
      cap.textContent = spec.caption || box.getAttribute("data-caption");
      box.appendChild(cap);
    }

    var hits = {}; // node-id -> true when it differs from baseline

    function baseValueById(id) {
      var found = null;
      walk(baseline, "n", function (n) { if (n._id === id) found = n; }, []);
      return found;
    }

    function render() {
      // recompute ids + values, find hits vs baseline
      walk(current, "n", function () {}, []);
      hits = {};
      walk(current, "n", function (n) {
        var b = baseValueById(n._id);
        if (!b) return;
        var cv = compute(n), bv = compute(b);
        if (Math.abs(cv - bv) > Math.abs(bv) * 1e-6 + 1e-9) {
          hits[n._id] = true;
          n._parents.forEach(function (p) { hits[p] = true; });
        }
      }, []);

      canvas.innerHTML = "";
      canvas.appendChild(renderNode(current, baseline));

      // top-line delta note
      var cv = compute(current), bv = compute(baseline);
      var dpct = bv ? Math.round((cv - bv) / Math.abs(bv) * 1000) / 10 : 0;
      if (Math.abs(dpct) < 1e-6) {
        note.className = "tree-note";
        note.innerHTML = "Top line at baseline: <strong>" + esc(fmt(current, cv)) +
          "</strong>. Edit any leaf, or press <em>Simulate a drop</em>.";
      } else {
        var down = dpct < 0;
        note.className = "tree-note " + (down ? "tree-note-down" : "tree-note-up");
        note.innerHTML = "Top line " + (down ? "fell" : "rose") + " <strong>" +
          Math.abs(dpct) + "%</strong> to " + esc(fmt(current, cv)) +
          " (baseline " + esc(fmt(baseline, bv)) + "). Follow the coral trail to the driver that moved.";
      }
    }

    function renderNode(node, base) {
      var wrap = document.createElement("div");
      wrap.className = "tree-node-wrap";

      var card = document.createElement("div");
      card.className = "tree-node" + (node.children ? " tree-internal" : " tree-leaf");
      if (hits[node._id]) card.className += " tree-hit";

      var lbl = document.createElement("div");
      lbl.className = "tree-lbl";
      lbl.textContent = node.label;
      card.appendChild(lbl);

      var val = compute(node);
      var bval = base ? compute(base) : val;

      if (node.children) {
        var v = document.createElement("div");
        v.className = "tree-val";
        v.textContent = fmt(node, val);
        card.appendChild(v);
        var op = document.createElement("div");
        op.className = "tree-op";
        op.textContent = opLabel(node.op || "x");
        card.appendChild(op);
        if (hits[node._id]) card.appendChild(deltaChip(val, bval, node));
      } else {
        // editable leaf
        var input = document.createElement("input");
        input.type = "number";
        input.className = "tree-input";
        input.value = node.pct ? (Math.round(node.value * 10000) / 100) : node.value;
        input.step = node.pct ? 0.1 : (node.value >= 1000 ? 100 : (node.value >= 10 ? 1 : 0.001));
        var suffix = document.createElement("span");
        suffix.className = "tree-suffix";
        suffix.textContent = node.pct ? "%" : (node.unit || "");
        var row = document.createElement("div");
        row.className = "tree-inrow";
        row.appendChild(input); row.appendChild(suffix);
        card.appendChild(row);
        if (hits[node._id]) card.appendChild(deltaChip(val, bval, node));
        input.addEventListener("input", function () {
          var raw = parseFloat(input.value);
          if (isNaN(raw)) return;
          node.value = node.pct ? raw / 100 : raw;
          render();
        });
      }

      wrap.appendChild(card);

      if (node.children && node.children.length) {
        var kids = document.createElement("div");
        kids.className = "tree-kids";
        node.children.forEach(function (c, i) {
          var b = base && base.children ? base.children[i] : null;
          kids.appendChild(renderNode(c, b));
        });
        wrap.appendChild(kids);
      }
      return wrap;
    }

    function deltaChip(cur, base, node) {
      var chip = document.createElement("div");
      var d = base ? (cur - base) / Math.abs(base) * 100 : 0;
      var down = d < 0;
      chip.className = "tree-delta " + (down ? "down" : "up");
      chip.textContent = (down ? "▼ " : "▲ ") + Math.abs(Math.round(d * 10) / 10) + "%";
      return chip;
    }

    // Simulate a drop: knock one random leaf down 15-35%
    dropBtn.addEventListener("click", function () {
      var leaves = [];
      walk(current, "n", function (n) { if (!n.children) leaves.push(n); }, []);
      if (!leaves.length) return;
      var pick = leaves[Math.floor(Math.random() * leaves.length)];
      var cut = 0.15 + Math.random() * 0.2;
      // for bridge "loss" leaves (sign -1) a "drop" means losses grow
      pick.value = pick.value * (1 - cut);
      render();
    });

    resetBtn.addEventListener("click", function () {
      current = clone(spec.root);
      render();
    });

    render();
  }

  function init() {
    Array.prototype.slice.call(document.querySelectorAll(".treebox")).forEach(wire);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
