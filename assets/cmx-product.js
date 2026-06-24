/*
 * cmx-product.js
 * Small enhancements for the Sephora-style PDP:
 *  - mobile sticky "Adicionar à Sacola" bar that triggers the real add-to-cart
 *  - native share / copy-link button in the top row
 */
(function () {
  function realSubmit() {
    return document.querySelector('.product__info-container .product-form__submit');
  }

  function initStickyBar() {
    var bar = document.querySelector('.cmx-sticky-bar');
    if (!bar) return;
    var btn = bar.querySelector('.cmx-sticky-bar__btn');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var submit = realSubmit();
      if (submit && !submit.hasAttribute('disabled')) {
        submit.click();
      }
    });

    // Keep the sticky button label/disabled state in sync with the form.
    var submit = realSubmit();
    if (submit) {
      var sync = function () {
        if (submit.hasAttribute('disabled')) {
          btn.setAttribute('disabled', 'disabled');
          btn.style.opacity = '0.5';
        } else {
          btn.removeAttribute('disabled');
          btn.style.opacity = '';
        }
      };
      sync();
      new MutationObserver(sync).observe(submit, {
        attributes: true,
        attributeFilter: ['disabled'],
      });
    }
  }

  function initShare() {
    var btn = document.querySelector('.cmx-share');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var url = btn.getAttribute('data-share-url') || window.location.href;
      var title = btn.getAttribute('data-share-title') || document.title;
      if (navigator.share) {
        navigator.share({ title: title, url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          var prev = btn.getAttribute('title');
          btn.setAttribute('title', 'Link copiado!');
          window.setTimeout(function () {
            btn.setAttribute('title', prev || 'Compartilhar');
          }, 1500);
        });
      }
    });
  }

  function initTabs() {
    document.querySelectorAll('[data-cmx-tabs]').forEach(function (root) {
      var tabs = root.querySelectorAll('.cmx-pdp-tab');
      var items = root.querySelectorAll('.cmx-pdp-tab-item');

      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          var i = tab.getAttribute('data-cmx-tab');
          tabs.forEach(function (t) {
            var on = t === tab;
            t.classList.toggle('is-active', on);
            t.setAttribute('aria-selected', on ? 'true' : 'false');
          });
          items.forEach(function (it) {
            it.classList.toggle('is-active', it.getAttribute('data-cmx-item') === i);
          });
        });
      });

      root.querySelectorAll('.cmx-pdp-acc-head').forEach(function (head) {
        head.addEventListener('click', function () {
          var open = head.getAttribute('aria-expanded') === 'true';
          head.setAttribute('aria-expanded', open ? 'false' : 'true');
        });
      });
    });
  }

  function initReadMore() {
    var isMobile = function () {
      return window.matchMedia('(max-width: 749px)').matches;
    };

    document.querySelectorAll('.cmx-pdp-acc-panel').forEach(function (panel) {
      var rte = panel.querySelector('.cmx-pdp-rte');
      var btn = panel.querySelector('.cmx-readmore');
      if (!rte || !btn) return;

      function check() {
        if (rte.classList.contains('is-expanded')) {
          btn.hidden = false;
          return;
        }
        if (!isMobile()) {
          rte.classList.remove('is-clamped');
          btn.hidden = true;
          return;
        }
        rte.classList.add('is-clamped');
        var overflow = rte.scrollHeight > rte.clientHeight + 2;
        btn.hidden = !overflow;
        if (!overflow) rte.classList.remove('is-clamped');
      }

      btn.addEventListener('click', function () {
        var expanded = rte.classList.toggle('is-expanded');
        if (expanded) {
          rte.classList.remove('is-clamped');
          btn.textContent = 'Mostrar Menos';
        } else {
          rte.classList.add('is-clamped');
          btn.textContent = 'Mostrar Mais';
        }
      });

      check();
      window.addEventListener('resize', check);
    });
  }

  function init() {
    initStickyBar();
    initShare();
    initTabs();
    initReadMore();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
