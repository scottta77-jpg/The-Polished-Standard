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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHeroCarousel);
  } else {
    initHeroCarousel();
  }

  window.Webflow = window.Webflow || [];
  window.Webflow.push(initStandaloneForms);
})();
