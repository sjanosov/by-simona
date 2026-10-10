(function () {
  "use strict";

  var roots = Array.prototype.slice.call(document.querySelectorAll(".gallery"));
  if (!roots.length) return;

  var noMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var instances = [];

  roots.forEach(build);

  setupSwitcher();

  function setupSwitcher() {
    var switcher = document.querySelector(".gallery-switch");
    if (!switcher) return;

    var sets = Array.prototype.slice.call(
      document.querySelectorAll(".gallery[data-set]"),
    );
    if (sets.length < 2) return;

    switcher.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-gallery]");
      if (!button) return;

      var wanted = button.getAttribute("data-gallery");
      sets.forEach(function (set) {
        set.hidden = set.getAttribute("data-set") !== wanted;
      });
      instances.forEach(function (instance) {
        if (!instance.root.hidden) instance.measure();
      });

      Array.prototype.forEach.call(
        switcher.querySelectorAll("button"),
        function (b) {
          b.setAttribute("aria-pressed", String(b === button));
        },
      );
    });

    switcher.classList.add("is-live");
  }

  function build(root) {
    var frame = root.querySelector(".gallery-frame");
    var cards = Array.prototype.slice.call(
      root.querySelectorAll(".gallery-card"),
    );
    var prevButton = root.querySelector(".gallery-arrow-left");
    var nextButton = root.querySelector(".gallery-arrow-right");
    var dotsBar = root.querySelector(".gallery-dots");
    var count = cards.length;
    if (!frame || count < 2) return;

    var loop = count >= 5;

    var TILT = 44;
    var DEPTH = 0.6;
    var DAMP = 0.56;
    var FADE = 0.1;
    var GAP = 0.05;

    var position = 0;
    var target = 0;
    var width = 0;
    var request = null;
    var drag = null;
    var selected = 0;
    var dots = [];

    function indexAt(p) {
      return ((Math.round(p) % count) + count) % count;
    }

    function clamp(p) {
      return loop ? p : Math.max(0, Math.min(count - 1, p));
    }

    function render() {
      if (!width) return;
      var spacing = width * (1 + GAP);

      cards.forEach(function (card, i) {
        var offset = i - position;
        if (loop) {
          offset = ((offset % count) + count) % count;
          if (offset > count / 2) offset -= count;
        }

        var distance = Math.abs(offset);
        var ramp = Math.pow(distance, DAMP);
        var dir = offset < 0 ? -1 : offset > 0 ? 1 : 0;
        var tilt = Math.min(TILT * ramp, 82) * dir;

        card.style.transform =
          "translateX(calc(-50% + " +
          offset * spacing +
          "px)) translateZ(" +
          -DEPTH * width * ramp +
          "px) rotateY(" +
          -tilt +
          "deg)";

        var edge = loop ? Math.min(1, Math.max(0, count / 2 - distance)) : 1;
        card.style.opacity = String(Math.max(0, 1 - FADE * distance) * edge);
        card.style.zIndex = String(100 - Math.round(distance));
      });
    }

    function mark(index) {
      if (index === selected) return;
      selected = index;
      dots.forEach(function (dot, i) {
        dot.setAttribute("aria-current", i === index ? "true" : "false");
      });
    }

    function settle(to) {
      if (request !== null) cancelAnimationFrame(request);
      target = to;
      mark(indexAt(to));

      if (noMotion) {
        position = to;
        render();
        request = null;
        return;
      }

      var step = function () {
        var remaining = target - position;
        if (Math.abs(remaining) < 0.0004) {
          position = target;
          render();
          request = null;
          return;
        }
        position += remaining * 0.16;
        render();
        request = requestAnimationFrame(step);
      };
      request = requestAnimationFrame(step);
    }

    function toCard(index) {
      var to = loop
        ? index + Math.round((target - index) / count) * count
        : index;
      settle(clamp(to));
    }

    function move(by) {
      settle(clamp(Math.round(target) + by));
    }

    frame.addEventListener("pointerdown", function (e) {
      if (request !== null) {
        cancelAnimationFrame(request);
        request = null;
      }
      frame.setPointerCapture(e.pointerId);
      target = position;
      drag = {
        id: e.pointerId,
        x: e.clientX,
        position: position,
        velocity: 0,
        time: performance.now(),
      };
    });

    frame.addEventListener("pointermove", function (e) {
      if (!drag || drag.id !== e.pointerId) return;
      var spacing = width * (1 + GAP);
      if (!spacing) return;

      var now = performance.now();
      var previous = position;
      position = clamp(drag.position - (e.clientX - drag.x) / spacing);
      drag.velocity =
        ((position - previous) / Math.max(now - drag.time, 1)) * 1000;
      drag.time = now;

      mark(indexAt(position));
      render();
    });

    function endDrag(e) {
      if (!drag || drag.id !== e.pointerId) return;
      var velocity = drag.velocity;
      drag = null;
      var momentum = Math.max(-2, Math.min(2, velocity * 0.18));
      settle(clamp(Math.round(position + momentum)));
    }

    frame.addEventListener("pointerup", endDrag);
    frame.addEventListener("pointercancel", endDrag);

    frame.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        move(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        move(1);
      }
    });

    if (prevButton) {
      prevButton.addEventListener("click", function () {
        move(-1);
      });
    }
    if (nextButton) {
      nextButton.addEventListener("click", function () {
        move(1);
      });
    }

    if (dotsBar) {
      cards.forEach(function (card, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "gallery-dot";
        dot.setAttribute("aria-label", "Zobrazit fotku " + (i + 1));
        dot.setAttribute("aria-current", i === 0 ? "true" : "false");
        dot.addEventListener("click", function () {
          toCard(i);
        });
        dotsBar.appendChild(dot);
        dots.push(dot);
      });
    }

    function measure() {
      if (!cards[0]) return;
      width = cards[0].offsetWidth;
      render();
    }

    instances.push({ root: root, measure: measure });
    root.classList.add("is-live");
    frame.setAttribute("tabindex", "0");
    measure();

    if ("ResizeObserver" in window) {
      new ResizeObserver(measure).observe(frame);
    } else {
      var timer = 0;
      window.addEventListener("resize", function () {
        clearTimeout(timer);
        timer = setTimeout(measure, 150);
      });
    }

    window.addEventListener("load", measure);
  }
})();
