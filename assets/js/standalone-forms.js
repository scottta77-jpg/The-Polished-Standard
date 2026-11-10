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

  window.Webflow = window.Webflow || [];
  window.Webflow.push(initStandaloneForms);
})();
