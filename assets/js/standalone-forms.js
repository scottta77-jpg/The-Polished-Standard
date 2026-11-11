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

    var labelEl = stage.querySelector(".closer-look-scroll-label");
    var pctEl = stage.querySelector(".closer-look-scroll-pct");

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
      stage.style.setProperty("--clean-progress", eased.toFixed(4));

      if (pctEl) {
        pctEl.textContent = Math.round(eased * 100) + "%";
      }
      if (labelEl) {
        if (cleanProgress >= 0.92) {
          labelEl.textContent = "Spotless";
        } else if (cleanProgress > 0.03) {
          labelEl.textContent = "Scroll to clean";
        } else {
          labelEl.textContent = "Scroll to clean";
        }
      }

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

  function initSiteScrollCue() {
    var cue = document.querySelector(".site-scroll-cue");
    if (!cue && document.body) {
      cue = document.createElement("div");
      cue.className = "button-arrow-wrap site-scroll-cue";
      cue.setAttribute("aria-hidden", "true");
      cue.innerHTML =
        '<svg class="button-arrow site-scroll-cue-arrow" fill="none" viewBox="0 0 23 16" width="100%" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M21.7132 6.85742C22.3444 6.85742 22.8561 7.36912 22.8561 8.00034C22.8561 8.63155 22.3444 9.14325 21.7132 9.14325C21.082 9.14325 20.5703 8.63155 20.5703 8.00034C20.5703 7.36912 21.082 6.85742 21.7132 6.85742Z" fill="currentColor"></path>' +
        '<path d="M18.2835 6.85693C18.9148 6.85693 19.4265 7.36863 19.4265 7.99985C19.4265 8.63106 18.9148 9.14277 18.2835 9.14277C17.6523 9.14277 17.1406 8.63106 17.1406 7.99985C17.1406 7.36863 17.6523 6.85693 18.2835 6.85693Z" fill="currentColor"></path>' +
        '<path d="M18.2835 3.42871C18.9148 3.42871 19.4265 3.94041 19.4265 4.57163C19.4265 5.20284 18.9148 5.71454 18.2835 5.71454C17.6523 5.71454 17.1406 5.20284 17.1406 4.57163C17.1406 3.94041 17.6523 3.42871 18.2835 3.42871Z" fill="currentColor"></path>' +
        '<path d="M18.2835 10.2856C18.9148 10.2856 19.4265 10.7973 19.4265 11.4286C19.4265 12.0598 18.9148 12.5715 18.2835 12.5715C17.6523 12.5715 17.1406 12.0598 17.1406 11.4286C17.1406 10.7973 17.6523 10.2856 18.2835 10.2856Z" fill="currentColor"></path>' +
        '<path d="M14.8578 6.85693C15.489 6.85693 16.0007 7.36863 16.0007 7.99985C16.0007 8.63106 15.489 9.14277 14.8578 9.14277C14.2265 9.14277 13.7148 8.63106 13.7148 7.99985C13.7148 7.36863 14.2265 6.85693 14.8578 6.85693Z" fill="currentColor"></path>' +
        '<path d="M11.432 6.85791C12.0632 6.85791 12.5749 7.36961 12.5749 8.00083C12.5749 8.63204 12.0632 9.14374 11.432 9.14374C10.8008 9.14374 10.2891 8.63204 10.2891 8.00083C10.2891 7.36961 10.8008 6.85791 11.432 6.85791Z" fill="currentColor"></path>' +
        '<path d="M8.00229 6.85693C8.63351 6.85693 9.14521 7.36863 9.14521 7.99985C9.14521 8.63106 8.63351 9.14277 8.00229 9.14277C7.37108 9.14277 6.85938 8.63106 6.85938 7.99985C6.85938 7.36863 7.37108 6.85693 8.00229 6.85693Z" fill="currentColor"></path>' +
        '<path d="M4.5726 6.85693C5.20382 6.85693 5.71552 7.36863 5.71552 7.99985C5.71552 8.63106 5.20382 9.14277 4.5726 9.14277C3.94139 9.14277 3.42969 8.63106 3.42969 7.99985C3.42969 7.36863 3.94139 6.85693 4.5726 6.85693Z" fill="currentColor"></path>' +
        '<path d="M1.14292 6.85742C1.77413 6.85742 2.28583 7.36912 2.28583 8.00034C2.28583 8.63155 1.77413 9.14325 1.14292 9.14325C0.511701 9.14325 0 8.63155 0 8.00034C0 7.36912 0.511701 6.85742 1.14292 6.85742Z" fill="currentColor"></path>' +
        '<path d="M14.8578 4.76837e-07C15.489 4.76837e-07 16.0007 0.511701 16.0007 1.14292C16.0007 1.77413 15.489 2.28583 14.8578 2.28583C14.2265 2.28583 13.7148 1.77413 13.7148 1.14292C13.7148 0.511701 14.2265 4.76837e-07 14.8578 4.76837e-07Z" fill="currentColor"></path>' +
        '<path d="M14.8578 13.7144C15.489 13.7144 16.0007 14.2261 16.0007 14.8573C16.0007 15.4885 15.489 16.0002 14.8578 16.0002C14.2265 16.0002 13.7148 15.4885 13.7148 14.8573C13.7148 14.2261 14.2265 13.7144 14.8578 13.7144Z" fill="currentColor"></path>' +
        "</svg>";
      document.body.appendChild(cue);
    }
    if (!cue) return;

    var closerLookSection = document.querySelector(".section.before-after, .closer-look-scroll-track");
    var closerLookStage = document.querySelector(".closer-look-stage");

    function updateSiteScrollCue() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var hide = false;

      if (closerLookSection) {
        var secRect = closerLookSection.getBoundingClientRect();
        // Hide throughout the A Closer Look clean/dirty scroll animation section
        if (secRect.top <= vh * 0.65 && secRect.bottom >= vh * 0.35) {
          hide = true;
        }
      }
      if (!hide && closerLookStage) {
        var stageRect = closerLookStage.getBoundingClientRect();
        if (stageRect.top <= vh * 0.85 && stageRect.bottom >= vh * 0.15) {
          hide = true;
        }
      }

      // Also hide at the very bottom of the page when there is nothing left to scroll
      var docHeight = Math.max(
        document.body ? document.body.scrollHeight : 0,
        document.documentElement ? document.documentElement.scrollHeight : 0
      );
      if (window.scrollY + vh >= docHeight - 100) {
        hide = true;
      }

      if (hide) {
        cue.classList.add("is-hidden");
      } else {
        cue.classList.remove("is-hidden");
      }
    }

    updateSiteScrollCue();
    window.addEventListener("scroll", updateSiteScrollCue, { passive: true });
    window.addEventListener("resize", updateSiteScrollCue);
  }

  function initMobileNavbarLogo() {
    var logos = document.querySelectorAll(".navbar .brand-logo-img");
    if (!logos.length) return;

    var desktopSrc = "/assets/images/the-polished-standard-logo.png";
    var mobileSrc = "/assets/images/TPS Mobile logo.png";

    function syncLogo() {
      var wantMobile = window.innerWidth <= 767;
      var targetSrc = wantMobile ? mobileSrc : desktopSrc;
      for (var i = 0; i < logos.length; i++) {
        if (logos[i].getAttribute("src") !== targetSrc) {
          logos[i].setAttribute("src", targetSrc);
        }
      }
    }

    syncLogo();
    window.addEventListener("resize", syncLogo);
  }

  function initMobileServicesScroll() {
    var sticky = document.querySelector(".services-sticky");
    if (!sticky) return;

    var cube = sticky.querySelector(".service-all-card");
    var marquees = sticky.querySelectorAll(".service-marque-list");
    if (!cube) return;

    var wasMobile = false;

    function updateMobileServices() {
      var isMobile = window.innerWidth <= 767;
      if (!isMobile) {
        if (wasMobile) {
          cube.style.transform = "";
          for (var m = 0; m < marquees.length; m++) {
            marquees[m].style.transform = "";
          }
          wasMobile = false;
        }
        return;
      }
      wasMobile = true;

      var rect = sticky.getBoundingClientRect();
      var scrollable = sticky.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;

      var raw = -rect.top / scrollable;
      var clamped = Math.max(0, Math.min(1, raw));

      // Hold card 1 for first 10%, rotate through 4 faces across 10%..90%, hold card 4 for 90%..100%
      var rotProgress = (clamped - 0.10) / 0.80;
      rotProgress = Math.max(0, Math.min(1, rotProgress));

      var deg = rotProgress * 270;
      var rad = (deg * Math.PI) / 180;
      // Cube face height on mobile is 82vw -> half-depth R = 41vw
      var rVw = 41;
      var yVw = -rVw * Math.sin(rad);
      var zVw = -rVw * (1 - Math.cos(rad));

      cube.style.transform =
        "translate3d(0px, " +
        yVw.toFixed(3) +
        "vw, " +
        zVw.toFixed(3) +
        "vw) rotateX(" +
        deg.toFixed(2) +
        "deg)";

      var marqueeX = (-clamped * 100).toFixed(2);
      for (var i = 0; i < marquees.length; i++) {
        marquees[i].style.transform = "translate3d(" + marqueeX + "%, 0px, 0px)";
      }
    }

    updateMobileServices();
    window.addEventListener("scroll", updateMobileServices, { passive: true });
    window.addEventListener("resize", updateMobileServices);
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
      initMobileNavbarLogo();
      initNavAndFooterRollHover();
      initHeroCarousel();
      initCloserLookScroll();
      initSiteScrollCue();
      initMobileServicesScroll();
    });
  } else {
    initFloatingNavbar();
    initMobileNavbarLogo();
    initNavAndFooterRollHover();
    initHeroCarousel();
    initCloserLookScroll();
    initSiteScrollCue();
    initMobileServicesScroll();
  }

  window.Webflow = window.Webflow || [];
  window.Webflow.push(initStandaloneForms);
})();
