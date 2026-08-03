/* learn-user-journey-analytics-with-phoebe - live screen-flow simulator
   Every .flowbox on a page is a REAL, interactive journey flow. The stages
   (sessions -> PDP -> cart -> checkout -> orders) recompute from their gate
   rates; toggle a "fix" lever and one gate improves - counts, conversion
   rate, and GMV climb, and the improved gate lights coral.

   The arithmetic is real (counts multiply through the gates live); the lever
   effects are illustrative teaching values. A page declares the flow as JSON:

     <div class="flowbox" data-caption="optional line under the flow">
       <pre class="flow-src">{
         "sessions": 360000, "aov": 68,
         "stages": [
           { "label": "Sessions" },
           { "label": "PDP sessions",      "rate": 0.40, "rateLabel": "PDP penetration" },
           { "label": "Cart sessions",     "rate": 0.25, "rateLabel": "add-to-cart" },
           { "label": "Checkout sessions", "rate": 0.45, "rateLabel": "checkout start" },
           { "label": "Orders",            "rate": 0.60, "rateLabel": "completion" }
         ],
         "levers": [
           { "stage": 1, "to": 0.43, "label": "Smarter search & nav", "desc": "PDP penetration 40% to 43%" }
         ]
       }</pre>
     </div>

   stages[0] holds the source count; every later stage applies `rate` to the
   previous stage's count. A lever points at a stage index and swaps its rate. */

(function () {
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function fmtCount(v) {
    var r = Math.round(v);
    return r.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function fmtMoney(v) {
    return "$" + fmtCount(v);
  }

  function fmtPct(v, dp) {
    var m = Math.pow(10, dp === undefined ? 1 : dp);
    return (Math.round(v * 100 * m) / m) + "%";
  }

  function wire(box) {
    var srcEl = box.querySelector(".flow-src");
    if (!srcEl) return;
    var spec;
    try { spec = JSON.parse(srcEl.textContent); }
    catch (e) {
      box.innerHTML = '<div class="flow-err">Flow JSON failed to parse: ' + esc(e.message) + "</div>";
      return;
    }

    var leverOn = spec.levers.map(function () { return false; });

    function rates() {
      return spec.stages.map(function (st, i) {
        var r = st.rate;
        spec.levers.forEach(function (lv, li) {
          if (leverOn[li] && lv.stage === i) r = lv.to;
        });
        return r;
      });
    }

    function counts(rs) {
      var out = [spec.sessions];
      for (var i = 1; i < spec.stages.length; i++) out.push(out[i - 1] * rs[i]);
      return out;
    }

    var baseCounts = counts(spec.stages.map(function (st) { return st.rate; }));
    var baseOrders = baseCounts[baseCounts.length - 1];

    box.innerHTML = "";
    box.classList.add("flowbox-ready");

    var bar = document.createElement("div");
    bar.className = "flow-bar";
    var dot = document.createElement("span"); dot.className = "flow-dot";
    var title = document.createElement("span"); title.className = "flow-title";
    title.textContent = "live journey flow - toggle a fix, watch the funnel widen";
    var spacer = document.createElement("span"); spacer.className = "flow-spacer";
    var resetBtn = document.createElement("button");
    resetBtn.type = "button"; resetBtn.className = "flow-btn"; resetBtn.textContent = "Reset";
    bar.appendChild(dot); bar.appendChild(title); bar.appendChild(spacer); bar.appendChild(resetBtn);
    box.appendChild(bar);

    var lane = document.createElement("div");
    lane.className = "flow-lane";
    box.appendChild(lane);

    var score = document.createElement("div");
    score.className = "flow-score";
    box.appendChild(score);

    var leverWrap = document.createElement("div");
    leverWrap.className = "flow-levers";
    spec.levers.forEach(function (lv, li) {
      var lab = document.createElement("label");
      lab.className = "flow-lever";
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.addEventListener("change", function () {
        leverOn[li] = cb.checked;
        render();
      });
      var tx = document.createElement("span");
      tx.innerHTML = "<b>" + esc(lv.label) + "</b><small>" + esc(lv.desc) + "</small>";
      lab.appendChild(cb); lab.appendChild(tx);
      leverWrap.appendChild(lab);
    });
    box.appendChild(leverWrap);

    var rail = document.createElement("div");
    rail.className = "flow-rail";
    rail.textContent = "The arithmetic is real - counts multiply through the gates live. The lever effect sizes are illustrative teaching values, not promises.";
    box.appendChild(rail);

    if (spec.caption || box.getAttribute("data-caption")) {
      var cap = document.createElement("div");
      cap.className = "flow-cap";
      cap.textContent = spec.caption || box.getAttribute("data-caption");
      box.appendChild(cap);
    }

    resetBtn.addEventListener("click", function () {
      leverOn = spec.levers.map(function () { return false; });
      leverWrap.querySelectorAll("input").forEach(function (cb) { cb.checked = false; });
      render();
    });

    function render() {
      var rs = rates();
      var cs = counts(rs);
      lane.innerHTML = "";
      spec.stages.forEach(function (st, i) {
        if (i > 0) {
          var edge = document.createElement("div");
          var boosted = Math.abs(rs[i] - st.rate) > 1e-12;
          edge.className = "flow-edge" + (boosted ? " flow-hit" : "");
          edge.innerHTML = '<span class="flow-arrow">&#8594;</span><span class="flow-rate">' +
            esc(st.rateLabel || "rate") + " " + fmtPct(rs[i]) +
            (boosted ? ' <em>(was ' + fmtPct(st.rate) + ')</em>' : "") + "</span>";
          lane.appendChild(edge);
        }
        var node = document.createElement("div");
        var moved = Math.abs(cs[i] - baseCounts[i]) > 0.5;
        node.className = "flow-node" + (moved ? " flow-hit" : "") + (i === spec.stages.length - 1 ? " flow-final" : "");
        node.innerHTML = '<span class="flow-lbl">' + esc(st.label) + '</span><span class="flow-val">' + fmtCount(cs[i]) + "</span>" +
          (moved ? '<span class="flow-delta">&#9650; ' + fmtPct((cs[i] - baseCounts[i]) / baseCounts[i]) + "</span>" : "");
        lane.appendChild(node);
      });

      var orders = cs[cs.length - 1];
      var cr = orders / spec.sessions;
      var gmv = orders * spec.aov;
      var dg = (gmv - baseOrders * spec.aov) / (baseOrders * spec.aov);
      if (Math.abs(orders - baseOrders) < 0.5) {
        score.className = "flow-score";
        score.innerHTML = "Baseline: <strong>" + fmtCount(orders) + " orders</strong> \u00B7 session CR <strong>" +
          fmtPct(cr, 2) + "</strong> \u00B7 GMV <strong>" + fmtMoney(gmv) + "</strong>. Toggle a fix below.";
      } else {
        score.className = "flow-score " + (dg >= 0 ? "flow-score-up" : "flow-score-down");
        score.innerHTML = "Now: <strong>" + fmtCount(orders) + " orders</strong> \u00B7 session CR <strong>" +
          fmtPct(cr, 2) + "</strong> \u00B7 GMV <strong>" + fmtMoney(gmv) + "</strong> (<strong>" +
          (dg >= 0 ? "+" : "-") + fmtPct(Math.abs(dg)) + "</strong> vs baseline " + fmtMoney(baseOrders * spec.aov) + "). Follow the coral gates.";
      }
    }

    render();
  }

  function init() {
    Array.prototype.slice.call(document.querySelectorAll(".flowbox")).forEach(wire);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
