/* Scribbles Uniforms — Home page interactivity
   Hamburger nav, quick-contact drawer, back-to-top, contact form,
   and the rolling word ticker in the "Crafting better..." section. */
(function () {
  "use strict";

  /* ---------- Form submission (Google Apps Script backends) ----------
     Three separate Apps Script projects, deployed separately, each with
     its own Web App URL — paste them in below.
       - General-Inquiry.gs handles Home / About Us / R&D / Contact Us
       - Careers.gs handles the Careers application form
       - Collaboration.gs handles the site-wide "Let's collaborate!" popup */
  var APPS_SCRIPT_GENERAL_URL = "https://script.google.com/macros/s/AKfycbyOX9_xcbyBK9Hmw2oXbonmPC6L-SXoaJHoypvzu15zuWVzkLNi4VLWke28VEXuTm5g/exec";
  var APPS_SCRIPT_CAREERS_URL = "https://script.google.com/macros/s/AKfycbyUqku-wI9mXCy0AhbhDFwWHyM4GGG_fG5eq7s9VV1Uyv3qmcOw-WHIHbZU8JomfDYA/exec";
  var APPS_SCRIPT_COLLABORATION_URL = "https://script.google.com/macros/s/AKfycbzDetPFiM4TxGImuK4h3igeS3k5MpcQu4T3NTahrH-6VMf98wifq_C3lAv-V36pmWkm/exec";

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
  wireForm("quick-contact-form", APPS_SCRIPT_COLLABORATION_URL);

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

  /* ---------- Quick Contact popup (full-page, fade + bottom-to-top) ---------- */
  var quickContact = document.getElementById("quickContact");
  var quickContactClose = document.getElementById("quickContactClose");
  if (quickContactClose && quickContact) {
    quickContactClose.addEventListener("click", function () {
      quickContact.classList.remove("is-open");
      document.body.style.overflow = "";
    });
  }
  if (quickContact) {
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && quickContact.classList.contains("is-open")) {
        quickContact.classList.remove("is-open");
        document.body.style.overflow = "";
      }
    });
    document.querySelectorAll("[data-quick-contact-toggle]").forEach(function (trigger) {
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        var willOpen = !quickContact.classList.contains("is-open");
        quickContact.classList.toggle("is-open", willOpen);
        document.body.style.overflow = willOpen ? "hidden" : "";
      });
    });
  }

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
    var timelineTabletMQ = window.matchMedia("(min-width: 701px) and (max-width: 1199px)");
    var maxTranslate = 0;

    var measureTrack = function () {
      /* +24px safety buffer — on tablet widths the last item was landing a
         few pixels short of fully clearing the wrap edge, so nudge the
         travel distance slightly further to guarantee it fully arrives. */
      maxTranslate = Math.max(0, scrollTrack.scrollWidth - trackWrap.clientWidth + 24);
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
      var startLine = viewportHeight * 0.7;
      /* On tablet widths the track has more horizontal distance to cover
         relative to how much vertical scroll room the section gets, so the
         slide needs to finish faster (over a shorter scroll distance) to
         fully reach the last item before the section scrolls past. */
      var totalDistance = viewportHeight * (timelineTabletMQ.matches ? 0.12 : 0.35);
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
      /* Web fonts / images can still reflow the track just after "load"
         fires, which would leave maxTranslate measured a touch short —
         re-measure once more after things settle. */
      setTimeout(function () {
        measureTrack();
        updateTrack();
      }, 400);
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
    var processTrackStart = 0;
    var processTrackHeight = 0;
    var processSteps = Array.prototype.slice.call(processList.querySelectorAll(".process-step"));
    var processStepOffsets = [];

    /* One marker dot per step, sitting on the line at that step's
       position — stays there permanently once the line reaches it,
       instead of only the single moving dot at the fill's tip. */
    var processDots = processSteps.map(function () {
      var dot = document.createElement("div");
      dot.className = "process-steps-dot";
      processTrack.appendChild(dot);
      return dot;
    });

    var measureProcessLine = function () {
      var listRect = processList.getBoundingClientRect();
      var firstRect = processSteps[0].getBoundingClientRect();
      var lastRect = processLastStep.getBoundingClientRect();

      /* The track itself starts at the vertical centre of the first
         step (matching the reference), not the top of the list — so
         both its CSS offset and its height are measured from there. */
      processTrackStart = (firstRect.top - listRect.top) + (firstRect.height / 2);
      processTrackHeight = (lastRect.top - listRect.top) + (lastRect.height / 2) - processTrackStart;
      processTrack.style.top = processTrackStart + "px";
      processTrack.style.height = processTrackHeight + "px";

      /* Each step's own vertical centre, relative to that same start
         point — this is the point along the line the fill needs to
         reach before that step is allowed to reveal. */
      processStepOffsets = processSteps.map(function (step) {
        var stepRect = step.getBoundingClientRect();
        return (stepRect.top - listRect.top) + (stepRect.height / 2) - processTrackStart;
      });

      processDots.forEach(function (dot, i) {
        /* Positioned against the track's own height (a %), so it stays
           put even though the track itself is 0px tall until the fill
           animates — using px against a 0-height parent would place
           every dot at the very top. */
        dot.style.top = (processTrackHeight > 0 ? (processStepOffsets[i] / processTrackHeight) * 100 : 0) + "%";
      });
    };

    var updateProcessLine = function () {
      var rect = processList.getBoundingClientRect();
      var viewportMiddle = window.innerHeight / 2;
      var progress = processTrackHeight > 0 ? (viewportMiddle - rect.top - processTrackStart) / processTrackHeight : 0;
      progress = Math.max(0, Math.min(1, progress));
      processFill.style.height = (progress * 100) + "%";

      /* Fade each step in as the line/dot approaches it — not a hard
         on/off switch. A step still a full "gap" away stays invisible;
         the very next one already previews at partial opacity; a step
         the dot has actually reached is fully opaque. The fade
         distance is that step's own gap to the previous one, so it
         scales naturally with the real spacing between cards. */
      var fillPx = progress * processTrackHeight;
      processSteps.forEach(function (step, i) {
        var offset = processStepOffsets[i];
        var fadeDistance = i > 0 ? (offset - processStepOffsets[i - 1]) : offset || 1;
        var stepProgress = fadeDistance > 0 ? 1 - (offset - fillPx) / fadeDistance : 1;
        stepProgress = Math.max(0, Math.min(1, stepProgress));
        step.style.opacity = stepProgress;
        step.style.transform = "translateY(" + (30 * (1 - stepProgress)) + "px)";
        processDots[i].classList.toggle("is-active", fillPx >= offset);
      });
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
