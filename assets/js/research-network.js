(function () {
  "use strict";

  var container = document.getElementById("research-network");
  if (!container) return; // only runs on pages that actually have this element

  var W = 900, H = 620;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Node structure: two fixed poles (Operations Research, Computational
  // Social Science), a set of bridging techniques, and a set of downstream
  // application/phenomena nodes. Positions below are just starting points —
  // everything except the two poles is free to move under the physics loop.
  var nodes = [
    { id: "OR", label: ["Operations", "Research"], tier: "pole", x: 110, y: 310, fixed: true },
    { id: "CSS", label: ["Computational", "Social Science"], tier: "pole", x: 790, y: 310, fixed: true },

    { id: "DO", label: ["Discrete", "optimisation"], tier: "tech", x: 450, y: 310 },
    { id: "DT", label: ["Decision", "theory"], tier: "tech", x: 450, y: 310 },
    { id: "ML", label: ["Machine", "learning"], tier: "tech", x: 450, y: 310 },
    { id: "ABM", label: ["Agent-based", "modelling"], tier: "tech", x: 450, y: 310 },
    { id: "DM", label: ["Data mining", "& retrieval"], tier: "tech", x: 450, y: 310 },
    { id: "NLP", label: ["Natural", "language", "processing"], tier: "tech", x: 450, y: 310 },
    { id: "SNA", label: ["Social network", "analysis"], tier: "tech", x: 450, y: 310 },

    { id: "HBD", label: ["Human", "behaviour", "& decision-", "making"], tier: "app", x: 450, y: 310 },
    { id: "ID", label: ["Information", "diffusion"], tier: "app", x: 450, y: 310 },
    { id: "SD", label: ["Sentiment", "diffusion &", "emotional", "contagion"], tier: "app", x: 450, y: 310 },
    { id: "SMR", label: ["Social media", "research"], tier: "app", x: 450, y: 310 },
    { id: "INF", label: ["Info-", "demiology"], tier: "app", x: 450, y: 310 }
  ];

  // Small random offset so free nodes don't all launch from one exact point.
  nodes.forEach(function (n) {
    n.vx = 0; n.vy = 0;
    if (!n.fixed) {
      n.x += (Math.random() - 0.5) * 40;
      n.y += (Math.random() - 0.5) * 40;
    }
  });

  var byId = {};
  nodes.forEach(function (n) { byId[n.id] = n; });

  // d = target distance for this edge; shorter = pulled closer together.
  var links = [
    { s: "DO", t: "OR", d: 95 }, { s: "DT", t: "OR", d: 100 },
    { s: "ML", t: "OR", d: 200 }, { s: "ML", t: "CSS", d: 150 },
    { s: "ABM", t: "OR", d: 200 }, { s: "ABM", t: "CSS", d: 150 },
    { s: "DM", t: "CSS", d: 120 }, { s: "NLP", t: "CSS", d: 100 }, { s: "SNA", t: "CSS", d: 95 },
    { s: "DT", t: "ML", d: 120 }, { s: "DT", t: "ABM", d: 120 },
    { s: "ML", t: "NLP", d: 110 }, { s: "ML", t: "DM", d: 110 },
    { s: "ABM", t: "SNA", d: 110 }, { s: "DM", t: "SNA", d: 95 }, { s: "DM", t: "NLP", d: 95 },
    { s: "DT", t: "HBD", d: 135 }, { s: "ML", t: "HBD", d: 135 }, { s: "ABM", t: "HBD", d: 135 },
    { s: "ABM", t: "ID", d: 135 }, { s: "DM", t: "ID", d: 135 }, { s: "NLP", t: "ID", d: 135 }, { s: "SNA", t: "ID", d: 135 },
    { s: "ML", t: "SD", d: 135 }, { s: "NLP", t: "SD", d: 135 }, { s: "ABM", t: "SD", d: 135 },
    { s: "DM", t: "SMR", d: 135 }, { s: "NLP", t: "SMR", d: 135 }, { s: "SNA", t: "SMR", d: 135 },
    { s: "ID", t: "SD", d: 95 }, { s: "ID", t: "SMR", d: 95 }, { s: "SD", t: "SMR", d: 95 }, { s: "HBD", t: "SD", d: 150 },
    { s: "INF", t: "ID", d: 95 }, { s: "INF", t: "SMR", d: 95 }, { s: "INF", t: "NLP", d: 130 }, { s: "INF", t: "SD", d: 95 }
  ];

  var rad = { pole: 60, tech: 40, app: 34 };
  var tierClass = { pole: "node-pole", tech: "node-tech", app: "node-app" };

  var svgNS = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  svg.setAttribute("class", "research-network-svg");
  container.appendChild(svg);

  var lineEls = links.map(function () {
    var l = document.createElementNS(svgNS, "line");
    l.setAttribute("stroke-width", "1");
    svg.appendChild(l);
    return l;
  });

  var nodeEls = nodes.map(function (n) {
    var g = document.createElementNS(svgNS, "g");
    g.setAttribute("class", tierClass[n.tier]);

    var circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("r", rad[n.tier]);
    g.appendChild(circle);

    var text = document.createElementNS(svgNS, "text");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "central");
    text.setAttribute("font-size", n.tier === "pole" ? "13" : "11");
    text.setAttribute("font-weight", n.tier === "pole" ? "600" : "500");
    var count = n.label.length;
    n.label.forEach(function (line, i) {
      var tspan = document.createElementNS(svgNS, "tspan");
      tspan.setAttribute("x", "0");
      tspan.setAttribute("dy", i === 0 ? -((count - 1) * 6.5) : 13);
      tspan.textContent = line;
      text.appendChild(tspan);
    });
    g.appendChild(text);
    svg.appendChild(g);
    return g;
  });

  function physicsStep() {
    var fx = {}, fy = {};
    nodes.forEach(function (n) { fx[n.id] = 0; fy[n.id] = 0; });

    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var a = nodes[i], b = nodes[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var minDist = rad[a.tier] + rad[b.tier] + 3; // border-to-border gap, not a flat guessed number
        if (dist < 260) {
          var force = (4600 / (dist * dist)) * (dist < minDist ? 3.5 : 1);
          fx[a.id] += dx / dist * force; fy[a.id] += dy / dist * force;
          fx[b.id] -= dx / dist * force; fy[b.id] -= dy / dist * force;
        }
      }
    }

    links.forEach(function (l) {
      var a = byId[l.s], b = byId[l.t];
      var dx = b.x - a.x, dy = b.y - a.y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var force = (dist - l.d) * 0.025;
      fx[a.id] += dx / dist * force; fy[a.id] += dy / dist * force;
      fx[b.id] -= dx / dist * force; fy[b.id] -= dy / dist * force;
    });

    nodes.forEach(function (n) {
      if (n.fixed) return;
      if (n === dragState.node) {
        // pointer-locked while being dragged: ignore computed forces on
        // this node itself, but it still exerted forces on everyone else above.
        n.x = n.fx;
        n.y = n.fy;
        n.vx = 0; n.vy = 0; // no residual velocity carried once released
        return;
      }
      // Velocity-based integration with damping, rather than applying raw
      // force as a position delta directly. Without this, nodes overshoot
      // their resting point, get pulled back the other way next frame, and
      // visibly oscillate instead of smoothly decelerating into place.
      n.vx = (n.vx + fx[n.id] * 0.02) * 0.82;
      n.vy = (n.vy + fy[n.id] * 0.02) * 0.82;
      var speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      var maxSpeed = 6;
      if (speed > maxSpeed) {
        n.vx = n.vx / speed * maxSpeed;
        n.vy = n.vy / speed * maxSpeed;
      }
      n.x += n.vx;
      n.y += n.vy;
      n.x = Math.max(45, Math.min(W - 45, n.x));
      n.y = Math.max(45, Math.min(H - 45, n.y));
    });

    // Hard collision resolution pass: the repulsion force above discourages
    // overlap but isn't an absolute guarantee once many competing spring
    // forces are in play. This directly separates any pair still actually
    // touching, so border-overlap can't persist at rest.
    for (var p = 0; p < nodes.length; p++) {
      for (var q = p + 1; q < nodes.length; q++) {
        var na = nodes[p], nb = nodes[q];
        if (na.fixed && nb.fixed) continue;
        var ddx = nb.x - na.x, ddy = nb.y - na.y;
        var ddist = Math.sqrt(ddx * ddx + ddy * ddy) || 0.01;
        var minGap = rad[na.tier] + rad[nb.tier] + 3;
        if (ddist < minGap) {
          var overlap = (minGap - ddist) / 2;
          var ux = ddx / ddist, uy = ddy / ddist;
          if (na !== dragState.node && !na.fixed) { na.x -= ux * overlap; na.y -= uy * overlap; }
          if (nb !== dragState.node && !nb.fixed) { nb.x += ux * overlap; nb.y += uy * overlap; }
        }
      }
    }
  }

  function render() {
    links.forEach(function (l, i) {
      var a = byId[l.s], b = byId[l.t];
      lineEls[i].setAttribute("x1", a.x); lineEls[i].setAttribute("y1", a.y);
      lineEls[i].setAttribute("x2", b.x); lineEls[i].setAttribute("y2", b.y);
    });
    nodes.forEach(function (n, i) {
      nodeEls[i].setAttribute("transform", "translate(" + n.x + "," + n.y + ")");
    });
  }

  // ---------- Animation loop, restartable for dragging ----------

  var dragState = { node: null, running: false, settleFrames: 0 };

  function runLoop() {
    if (dragState.running) return;
    dragState.running = true;
    (function loop() {
      physicsStep();
      render();
      dragState.settleFrames--;
      if (dragState.node || dragState.settleFrames > 0) {
        requestAnimationFrame(loop);
      } else {
        dragState.running = false;
      }
    })();
  }

  if (reduceMotion) {
    for (var k = 0; k < 700; k++) physicsStep();
    render();
  } else {
    dragState.settleFrames = 280;
    runLoop();
  }

  // ---------- Dragging (mouse + touch, via Pointer Events) ----------

  function toSvgPoint(evt) {
    var pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    var ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    var inverted = pt.matrixTransform(ctm.inverse());
    return { x: inverted.x, y: inverted.y };
  }

  nodes.forEach(function (n, i) {
    if (n.tier === "pole") return; // poles stay fixed, not draggable

    var g = nodeEls[i];
    g.style.cursor = "grab";
    g.style.touchAction = "none";

    g.addEventListener("pointerdown", function (evt) {
      evt.preventDefault();
      g.setPointerCapture(evt.pointerId);
      g.style.cursor = "grabbing";
      var p = toSvgPoint(evt);
      n.fx = p.x; n.fy = p.y;
      dragState.node = n;
      dragState.settleFrames = Math.max(dragState.settleFrames, 1);
      runLoop();
    });

    g.addEventListener("pointermove", function (evt) {
      if (dragState.node !== n) return;
      var p = toSvgPoint(evt);
      n.fx = Math.max(45, Math.min(W - 45, p.x));
      n.fy = Math.max(45, Math.min(H - 45, p.y));
    });

    function release(evt) {
      if (dragState.node !== n) return;
      g.style.cursor = "grab";
      dragState.node = null;
      dragState.settleFrames = 280; // extended with margin past the ~180-frame point measured to still have perceptible residual motion
      runLoop();
    }
    g.addEventListener("pointerup", release);
    g.addEventListener("pointercancel", release);
  });
})();

