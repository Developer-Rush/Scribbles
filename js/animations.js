/* Scribbles Uniforms — scroll animations
   Recreates the Webflow IX2 "fade/slide on scroll" pattern with
   IntersectionObserver + CSS transitions (no GSAP/Lottie). */
(function () {
  "use strict";

  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".rd-reveal, .reveal-left, .reveal-right").forEach(function (el) {
      el.classList.add("is-revealed");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );

  /* Sets up one reveal "group": a shared selector list, a starting
     transform (the direction it animates in from), and its own
     independent stagger count so groups don't compete for delay slots. */
  function setupReveal(selectors, fromTransform, duration) {
    duration = duration || 1.3;
    var style = document.createElement("style");
    style.textContent =
      selectors.join(",") +
      "{opacity:0;transform:" + fromTransform + ";transition:opacity " + duration + "s cubic-bezier(.16,1,.3,1),transform " + duration + "s cubic-bezier(.16,1,.3,1);}" +
      selectors.map(function (s) { return s + ".is-revealed"; }).join(",") +
      "{opacity:1 !important;transform:translate(0,0) !important;}";
    document.head.appendChild(style);

    document.querySelectorAll(selectors.join(",")).forEach(function (el, i) {
      var delaySteps = i % 4;
      if (el.matches(".location-card, .why-card")) {
        /* Grid items: stagger by column (left column reveals, then the
           column(s) to its right) instead of a running page-wide count,
           so every row reveals left-to-right the same way. */
        var columnIndex = Array.prototype.indexOf.call(el.parentElement.children, el) % 2;
        delaySteps = columnIndex;
      }
      el.style.transitionDelay = delaySteps * 0.35 + "s";
      observer.observe(el);
    });
  }

  /* Fade up from the bottom — the site-wide default. */
  setupReveal(
    [
      ".mission-vision-card",
      ".blog-item",
      ".thoughts-item",
      ".home-overlay-title",
      ".about-top-content",
      ".text-block-2",
      ".container-4",
      ".contact-heading-wrap",
      ".contact-form",
      ".location-card",
      ".why-card",
      ".rd-reveal"
    ],
    "translate(0,24px)"
  );

  /* Hero banner slides — kept slower than the rest of the page. */
  setupReveal([".reveal-left"], "translate(-40px,0)", 2.2);
  setupReveal([".reveal-right"], "translate(40px,0)", 2.2);

})();
