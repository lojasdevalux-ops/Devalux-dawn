/*
 * cmx-card-slider.js
 * Builds mobile dot pagination for featured-collection sliders flagged with
 * `.cmx-sephora-slider`. Mirrors Dawn's SliderComponent page math and keeps
 * the active dot in sync with scrolling / the `slideChanged` event.
 * Dots are hidden via CSS on desktop, where the side arrows are used instead.
 */
(function () {
  function visibleSlides(slides) {
    return Array.prototype.filter.call(slides, function (s) {
      return s.clientWidth > 0;
    });
  }

  function initSlider(sliderComp) {
    var track = sliderComp.querySelector('[id^="Slider-"]');
    var dotsEl = sliderComp.querySelector('.cmx-slider-dots');
    if (!track || !dotsEl) return;

    var slides = track.querySelectorAll('[id^="Slide-"]');

    function metrics() {
      var visible = visibleSlides(slides);
      if (visible.length < 2) return { total: visible.length, offset: 0, visible: visible };
      var offset = visible[1].offsetLeft - visible[0].offsetLeft || 1;
      var perPage = Math.max(1, Math.floor((track.clientWidth - visible[0].offsetLeft) / offset));
      var total = Math.max(1, visible.length - perPage + 1);
      return { total: total, offset: offset, visible: visible };
    }

    function currentIndex(m) {
      if (!m.offset) return 0;
      return Math.min(m.total - 1, Math.max(0, Math.round(track.scrollLeft / m.offset)));
    }

    function setActive(idx) {
      var dots = dotsEl.children;
      for (var i = 0; i < dots.length; i++) {
        dots[i].classList.toggle('cmx-slider-dots__dot--active', i === idx);
      }
    }

    function render() {
      var m = metrics();
      if (m.total <= 1) {
        dotsEl.innerHTML = '';
        return;
      }
      if (dotsEl.children.length !== m.total) {
        dotsEl.innerHTML = '';
        for (var i = 0; i < m.total; i++) {
          var dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'cmx-slider-dots__dot';
          dot.setAttribute('aria-label', 'Ir para o slide ' + (i + 1));
          (function (idx) {
            dot.addEventListener('click', function () {
              var v = visibleSlides(slides);
              if (v[idx]) track.scrollTo({ left: v[idx].offsetLeft, behavior: 'smooth' });
            });
          })(i);
          dotsEl.appendChild(dot);
        }
      }
      setActive(currentIndex(m));
    }

    render();

    track.addEventListener(
      'scroll',
      function () {
        setActive(currentIndex(metrics()));
      },
      { passive: true }
    );

    sliderComp.addEventListener('slideChanged', function (e) {
      if (e.detail && typeof e.detail.currentPage === 'number') {
        setActive(e.detail.currentPage - 1);
      } else {
        setActive(currentIndex(metrics()));
      }
    });

    window.addEventListener('resize', render);
    // Re-measure once images/fonts settle.
    window.setTimeout(render, 350);
  }

  function init() {
    document.querySelectorAll('slider-component.cmx-sephora-slider').forEach(initSlider);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
