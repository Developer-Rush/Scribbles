/* Scribbles Uniforms — Home page interactivity
   Hamburger nav, quick-contact drawer, back-to-top, contact form,
   and the rolling word ticker in the "Crafting better..." section. */
(function () {
  "use strict";

  /* ---------- Form submission (Google Apps Script backends) ----------
     Two separate Apps Script projects, deployed separately, each with
     its own Web App URL — paste them in below.
       - General-Inquiry.gs handles Home / About Us / R&D / Contact Us
       - Careers.gs handles the Careers application form            */
  var APPS_SCRIPT_GENERAL_URL = "https://script.google.com/macros/s/AKfycbzEdAbOcJJ9z9akCcGtsk3L7uL_kVGjUGbEXE1KwQYhU08v8SHGvYGvBaIP17XLTnTy/exec";
  var APPS_SCRIPT_CAREERS_URL = "https://script.google.com/macros/s/AKfycbxYHg_jOZxEykMYL6KtzmnHynxKNVKn4gA0nVoUycxH2IBSuBCG2QH-QzYBoyUJOZmQ/exec";

  function wireForm(formId, scriptUrl) {
    var form = document.getElementById(formId);
    if (!form) return;
    var wrapper = form.parentElement;
    var doneMsg = wrapper.querySelector(".w-form-done");
    var failMsg = wrapper.querySelector(".w-form-fail");
    var submitBtn = form.querySelector("button[type=submit]");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (failMsg) failMsg.style.display = "none";
      if (submitBtn) submitBtn.disabled = true;

      var data = new FormData(form);

      fetch(scriptUrl, {
        method: "POST",
        mode: "no-cors",
        body: data
      })
        .then(function () {
          /* "no-cors" gives an opaque response (Apps Script doesn't
             send CORS headers), so we can't read a real status back —
             if the request didn't throw, treat it as a success. */
          form.style.display = "none";
          if (doneMsg) doneMsg.style.display = "block";
        })
        .catch(function () {
          if (submitBtn) submitBtn.disabled = false;
          if (failMsg) failMsg.style.display = "block";
        });
    });
  }

  ["email-form-2", "email-form"].forEach(function (id) {
    wireForm(id, APPS_SCRIPT_GENERAL_URL);
  });
  wireForm("careers-application-form", APPS_SCRIPT_CAREERS_URL);

  /* ---------- Hero video: force play (some contexts ignore the autoplay URL param on iframes) ---------- */
  document.querySelectorAll(".hero-video-wrap iframe").forEach(function (frame) {
    frame.addEventListener("load", function () {
      frame.contentWindow.postMessage(JSON.stringify({ method: "play" }), "*");
    });
  });

  /* ---------- Hero video unmute ---------- */
  var heroUnmute = document.getElementById("heroUnmute");
  if (heroUnmute) {
    var heroIframe = document.querySelector(".banner-video-desktop iframe");
    var muted = true;
    heroUnmute.addEventListener("click", function () {
      muted = !muted;
      if (heroIframe && heroIframe.contentWindow) {
        heroIframe.contentWindow.postMessage(
          JSON.stringify({ method: "setVolume", value: muted ? 0 : 1 }),
          "*"
        );
      }
      heroUnmute.textContent = muted ? "Unmute" : "Mute";
      heroUnmute.setAttribute("aria-pressed", String(!muted));
    });
  }

  /* ---------- Hamburger / full-screen menu ---------- */
  var hamburgerBtn = document.getElementById("hamburgerBtn");
  var fullScreenMenu = document.getElementById("fullScreenMenu");
  if (hamburgerBtn && fullScreenMenu) {
    hamburgerBtn.addEventListener("click", function () {
      var isOpen = fullScreenMenu.classList.toggle("is-open");
      hamburgerBtn.classList.toggle("is-open", isOpen);
      hamburgerBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.style.overflow = isOpen ? "hidden" : "";
    });
    fullScreenMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        fullScreenMenu.classList.remove("is-open");
        hamburgerBtn.classList.remove("is-open");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- Quick Contact drawer ---------- */
  var quickContact = document.getElementById("quickContact");
  var quickContactClose = document.getElementById("quickContactClose");
  if (quickContactClose && quickContact) {
    quickContactClose.addEventListener("click", function () {
      quickContact.classList.remove("is-open");
    });
  }
  document.querySelectorAll("[data-quick-contact-toggle]").forEach(function (trigger) {
    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      quickContact.classList.toggle("is-open");
    });
  });

  /* ---------- How We Work: scroll-linked horizontal timeline ----------
     No pinning — tracked against the whole heading+description+timeline
     block (.expand-sticky) so the slide completes over a short, fixed
     scroll distance while that whole block is still comfortably on
     screen together — matching the reference, where the heading is never
     scrolled away before the timeline finishes sliding. */
  var scrollTrack = document.getElementById("scrollTrack");
  var trackWrap = document.querySelector(".scroll-track-wrap");
  var expandBlock = document.querySelector(".expand-sticky");
  if (scrollTrack && trackWrap && expandBlock) {
    var timelineMQ = window.matchMedia("(min-width: 701px)");
    var maxTranslate = 0;

    var measureTrack = function () {
      maxTranslate = Math.max(0, scrollTrack.scrollWidth - trackWrap.clientWidth);
      if (!timelineMQ.matches) {
        scrollTrack.style.transform = "";
      }
    };

    var updateTrack = function () {
      if (!timelineMQ.matches) return;
      var rect = trackWrap.getBoundingClientRect();
      var viewportHeight = window.innerHeight;
      /* Start once the timeline itself is mostly settled into view, then
         finish within a short, fixed scroll distance (not tied to content
         height) — measured from the track wrap (not the whole heading+
         description+timeline block) so added spacing above the timeline
         never shifts the trigger point. */
      var startLine = viewportHeight * 0.8;
      var totalDistance = viewportHeight * 0.5;
      var scrolledPastStart = startLine - rect.top;
      var progress = totalDistance > 0 ? scrolledPastStart / totalDistance : 0;
      progress = Math.max(0, Math.min(1, progress));
      scrollTrack.style.transform = "translateX(-" + (progress * maxTranslate) + "px)";
    };

    var trackTicking = false;
    window.addEventListener("scroll", function () {
      if (!trackTicking) {
        window.requestAnimationFrame(function () {
          updateTrack();
          trackTicking = false;
        });
        trackTicking = true;
      }
    });
    window.addEventListener("resize", function () {
      measureTrack();
      updateTrack();
    });
    window.addEventListener("load", function () {
      measureTrack();
      updateTrack();
    });
    measureTrack();
    updateTrack();
  }

  /* ---------- Process page: scroll-linked vertical progress line ---------- */
  var processList = document.getElementById("processStepsList");
  var processTrack = document.getElementById("processLineTrack");
  var processFill = document.getElementById("processLineFill");
  var processLastStep = document.getElementById("processLastStep");
  if (processList && processTrack && processFill && processLastStep) {
    var processTrackHeight = 0;

    var measureProcessLine = function () {
      var listRect = processList.getBoundingClientRect();
      var lastRect = processLastStep.getBoundingClientRect();
      processTrackHeight = (lastRect.top - listRect.top) + (lastRect.height / 2);
      processTrack.style.height = processTrackHeight + "px";
    };

    var updateProcessLine = function () {
      var rect = processList.getBoundingClientRect();
      var viewportMiddle = window.innerHeight / 2;
      var progress = processTrackHeight > 0 ? (viewportMiddle - rect.top) / processTrackHeight : 0;
      progress = Math.max(0, Math.min(1, progress));
      processFill.style.height = (progress * 100) + "%";
    };

    var processTicking = false;
    window.addEventListener("scroll", function () {
      if (!processTicking) {
        window.requestAnimationFrame(function () {
          updateProcessLine();
          processTicking = false;
        });
        processTicking = true;
      }
    });
    window.addEventListener("resize", function () {
      measureProcessLine();
      updateProcessLine();
    });
    window.addEventListener("load", function () {
      measureProcessLine();
      updateProcessLine();
    });

    /* Step images use loading="lazy", so far-down images (like the last
       step's) haven't loaded yet at page-load time and their row is
       shorter than final — re-measure once each one actually loads. */
    processList.querySelectorAll(".process-step-media img").forEach(function (img) {
      if (img.complete) return;
      img.addEventListener("load", function () {
        measureProcessLine();
        updateProcessLine();
      });
    });

    measureProcessLine();
    updateProcessLine();
  }

  /* ---------- Back to top ---------- */
  var backToTop = document.getElementById("backToTop");
  if (backToTop) {
    backToTop.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- Rolling word ticker: "Crafting better [word]" ---------- */
  var carousel = document.getElementById("tickerCarousel");
  if (carousel) {
    var words = carousel.querySelectorAll(".text-ticker_text");
    if (words.length > 1) {
      var gap = parseFloat(getComputedStyle(carousel).rowGap) || 0;
      var itemHeight = (words[0].getBoundingClientRect().height || 90) + gap;
      var index = 0;
      setInterval(function () {
        index = (index + 1) % words.length;
        carousel.style.transform = "translateY(-" + (index * itemHeight) + "px)";
        carousel.style.transition = "transform 0.6s cubic-bezier(.65,0,.35,1)";
        if (index === words.length - 1) {
          setTimeout(function () {
            carousel.style.transition = "none";
            carousel.style.transform = "translateY(0)";
            index = 0;
          }, 650);
        }
      }, 2200);
    }
  }

})();
