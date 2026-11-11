/**
 * Standalone Form Handler for The Polished Standard
 * Preserves Webflow form states (.w-form-done / .w-form-fail) and custom validation messages.
 */
(function () {
  function attachCustomValidation($form) {
    $form.find("input, select, textarea").on("invalid input change", function (e) {
      var el = this;
      if (!el.setCustomValidity) return;
      el.setCustomValidity("");
      if (!el.validity.valid) {
        if (el.tagName.toLowerCase() === "select" && el.name === "service" && el.validity.valueMissing) {
          el.setCustomValidity("Please choose a cleaning service.");
        } else if (el.type === "email" && (el.validity.typeMismatch || el.validity.badInput)) {
          el.setCustomValidity("Please enter a valid email address.");
        } else if (el.validity.valueMissing) {
          el.setCustomValidity("Please complete this field.");
        }
      }
    });
  }

  function initStandaloneForms() {
    if (!window.jQuery) return;
    var $ = window.jQuery;

    // Handle password utility page (/401)
    $(".w-password-page").on("submit", function (e) {
      e.preventDefault();
      var $wrap = $(this).closest(".w-form");
      $wrap.find(".w-password-page.w-form-fail, .w-form-fail").css("display", "block");
      return false;
    });

    // Override Webflow cloud form handler for standard forms without custom action
    $(".w-form form").each(function () {
      var $form = $(this);
      if ($form.hasClass("w-password-page")) return;
      attachCustomValidation($form);

      var action = $form.attr("action");
      if (action && action !== "#" && !action.startsWith("/.wf_")) return;

      var wfData = $.data(this, ".w-form");
      var customHandler = function (data) {
        if (data && data.evt) {
          data.evt.preventDefault();
          data.evt = null;
        }
        var formEl = $form[0];
        if (formEl && typeof formEl.checkValidity === "function" && !formEl.checkValidity()) {
          if (typeof formEl.reportValidity === "function") formEl.reportValidity();
          return;
        }

        var $wrap = $form.closest(".w-form");
        var $done = $wrap.find("> .w-form-done");
        var $fail = $wrap.find("> .w-form-fail");
        var $btn = $form.find(':input[type="submit"]');
        var origText = $btn.val();
        var waitText = $btn.attr("data-wait") || "Sending…";

        if (waitText) $btn.val(waitText);
        $btn.prop("disabled", true);

        var finalize = function () {
          $form.hide();
          $fail.hide();
          $done.css("display", "block").focus();
          $btn.prop("disabled", false);
          if (waitText) $btn.val(origText);
        };

        var payload = {};
        $form.serializeArray().forEach(function (item) {
          payload[item.name] = item.value;
        });

        fetch("/api/form", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
          .catch(function () {})
          .finally(function () {
            setTimeout(finalize, 250);
          });
      };

      if (wfData) {
        wfData.handler = customHandler;
      } else {
        $form.on("submit", function (e) {
          customHandler({ evt: e });
        });
      }
    });
  }

  function initHeroCarousel() {
    var box = document.querySelector(".image-animation-box");
    if (!box) return;
    var groups = Array.prototype.slice.call(box.querySelectorAll(".image-group-main"));
    if (!groups.length) return;

    var count = groups.length;
    var stepDeg = 180 / count;
    var speedDegPerSec = 360 / 40; // 40s per 360deg revolution

    function updateCarousel() {
      var nowSec = performance.now() / 1000;
      var baseDeg = (nowSec * speedDegPerSec) % 360;
      for (var i = 0; i < count; i++) {
        var g = groups[i];
        var deg = (baseDeg + i * stepDeg) % 360;
        g.style.visibility = "visible";
        g.style.transform = "rotateX(0deg) rotateY(" + deg.toFixed(4) + "deg) rotateZ(0deg)";
        var b0 = g.children[0];
        var b1 = g.children[1];
        // Cull cards while they travel off-screen behind the camera lens plane (Z > perspective)
        if (b0) {
          b0.style.visibility = (deg >= 12 && deg <= 168) ? "hidden" : "visible";
        }
        if (b1) {
          b1.style.visibility = (deg >= 192 && deg <= 348) ? "hidden" : "visible";
        }
      }
    }

    if (window.gsap && window.gsap.ticker) {
      window.gsap.ticker.add(updateCarousel);
    } else {
      function rafLoop() {
        updateCarousel();
        requestAnimationFrame(rafLoop);
      }
      requestAnimationFrame(rafLoop);
    }
  }

  function initCloserLookScroll() {
    var track = document.querySelector(".closer-look-scroll-track");
    var stage = document.querySelector(".closer-look-stage");
    if (!track || !stage) return;

    function updateCloserLook() {
      var rect = track.getBoundingClientRect();
      var scrollable = track.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;

      var rawProgress = -rect.top / scrollable;
      var clamped = Math.max(0, Math.min(1, rawProgress));

      // Hold messy room for first 8% of scroll, clean across 8%..88%, hold spotless room for 88%..100%
      var cleanProgress = (clamped - 0.08) / 0.80;
      cleanProgress = Math.max(0, Math.min(1, cleanProgress));

      // Smoothstep easing for ultra-fluid feel while scrubbing
      var eased = cleanProgress * cleanProgress * (3 - 2 * cleanProgress);
      var sweepPct = -12 + eased * 124; // -12% -> +112%

      stage.style.setProperty("--clean-sweep", sweepPct.toFixed(2) + "%");
      if (cleanProgress >= 0.85) {
        stage.classList.add("is-cleaned");
      } else {
        stage.classList.remove("is-cleaned");
      }
    }

    updateCloserLook();
    window.addEventListener("scroll", updateCloserLook, { passive: true });
    window.addEventListener("resize", updateCloserLook);
  }

  function initFloatingNavbar() {
    var navbars = document.querySelectorAll(".navbar");
    if (!navbars.length) return;

    var revealTimer = null;
    var lastScrollY = window.scrollY;
    var threshold = 80;
    var lagDelayMs = 220;

    function showScrolledNav() {
      for (var i = 0; i < navbars.length; i++) {
        if (navbars[i].classList.contains("is-scrolled")) {
          navbars[i].classList.remove("is-lagging");
          navbars[i].classList.add("is-visible");
        }
      }
    }

    function updateNavbar(isScrollEvent) {
      var y = window.scrollY;
      var delta = Math.abs(y - lastScrollY);
      lastScrollY = y;

      if (y <= threshold) {
        if (revealTimer) {
          clearTimeout(revealTimer);
          revealTimer = null;
        }
        for (var i = 0; i < navbars.length; i++) {
          navbars[i].classList.remove("is-scrolled", "is-lagging", "is-visible");
          // Let the hero navbar move naturally with the top of the hero
          navbars[i].style.transform = y > 0 ? "translate3d(0, -" + y.toFixed(1) + "px, 0)" : "";
        }
        return;
      }

      for (var j = 0; j < navbars.length; j++) {
        var nav = navbars[j];
        nav.style.transform = "";
        var wasScrolled = nav.classList.contains("is-scrolled");
        if (!wasScrolled) {
          nav.classList.add("is-scrolled", "is-lagging");
          nav.classList.remove("is-visible");
        } else if (isScrollEvent && delta > 5 && !nav.matches(":hover")) {
          nav.classList.add("is-lagging");
          nav.classList.remove("is-visible");
        }
      }

      if (revealTimer) {
        clearTimeout(revealTimer);
      }
      revealTimer = setTimeout(showScrolledNav, lagDelayMs);
    }

    updateNavbar(false);
    window.addEventListener(
      "scroll",
      function () {
        updateNavbar(true);
      },
      { passive: true }
    );
  }

  function initNavAndFooterRollHover() {
    var targets = [
      { linkSelector: ".navbar .nav-link", textSelector: null },
      { linkSelector: ".footer .footer-link", textSelector: ".footer-link-text" },
      { linkSelector: ".footer .social-link", textSelector: ".social-text" },
      { linkSelector: ".footer .footer-bottom-row .link", textSelector: ".footer-bottom-strong" }
    ];

    function buildRollLine(text, className, stepSec, isHidden) {
      var line = document.createElement("span");
      line.className = "tps-roll-line " + className;
      if (isHidden) {
        line.setAttribute("aria-hidden", "true");
      }
      var chars = Array.from(text);
      for (var i = 0; i < chars.length; i++) {
        var ch = document.createElement("span");
        ch.className = "tps-roll-char";
        ch.textContent = chars[i] === " " ? "\u00A0" : chars[i];
        ch.style.transitionDelay = (i * stepSec).toFixed(3) + "s";
        line.appendChild(ch);
      }
      return line;
    }

    targets.forEach(function (cfg) {
      var links = document.querySelectorAll(cfg.linkSelector);
      for (var i = 0; i < links.length; i++) {
        var linkEl = links[i];
        var textEl = cfg.textSelector ? linkEl.querySelector(cfg.textSelector) : linkEl;
        if (!textEl || textEl.querySelector(".tps-roll-wrap")) continue;

        var rawText = (textEl.textContent || "").trim();
        if (!rawText) continue;

        var stepSec = Math.min(0.02, 0.28 / Math.max(rawText.length, 1));
        var wrap = document.createElement("span");
        wrap.className = "tps-roll-wrap";
        wrap.appendChild(buildRollLine(rawText, "_01", stepSec, false));
        wrap.appendChild(buildRollLine(rawText, "_02", stepSec, true));

        textEl.textContent = "";
        textEl.appendChild(wrap);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initFloatingNavbar();
      initNavAndFooterRollHover();
      initHeroCarousel();
      initCloserLookScroll();
    });
  } else {
    initFloatingNavbar();
    initNavAndFooterRollHover();
    initHeroCarousel();
    initCloserLookScroll();
  }

  window.Webflow = window.Webflow || [];
  window.Webflow.push(initStandaloneForms);
})();
