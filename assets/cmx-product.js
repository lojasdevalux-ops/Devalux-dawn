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

  function init() {
    initStickyBar();
    initShare();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
