/* Marks deductions in the result ledger (values starting with a minus) so they print in red ink. */
(function () {
  'use strict';
  function mark(root) {
    var rows = (root && root.querySelectorAll ? root : document).querySelectorAll('.cv-row, .cv-net__row');
    for (var i = 0; i < rows.length; i++) {
      var v = rows[i].querySelector('.cv-mono');
      var neg = !!v && /^\s*[\u2212-]/.test(v.textContent || '');
      rows[i].classList.toggle('is-neg', neg);
    }
  }
  function start() {
    mark();
    if (!('MutationObserver' in window)) return;
    var targets = document.querySelectorAll('[data-r="rows"], [data-r="net"]');
    for (var i = 0; i < targets.length; i++) {
      new MutationObserver(function (list) {
        mark(list[0] && list[0].target);
      }).observe(targets[i], { childList: true, subtree: true, characterData: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
