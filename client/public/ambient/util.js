(function(){
  if (typeof window !== 'undefined' && window.__COALESCE_UTIL_DEFINED__) return;
  if (typeof window !== 'undefined') window.__COALESCE_UTIL_DEFINED__ = true;

  var defineOnce = function(name, value) {
    if (typeof window[name] === 'undefined') {
      window[name] = value;
    }
  };

  defineOnce('PI', Math.PI);
  defineOnce('cos', Math.cos);
  defineOnce('sin', Math.sin);
  defineOnce('abs', Math.abs);
  defineOnce('sqrt', Math.sqrt);
  defineOnce('pow', Math.pow);
  defineOnce('round', Math.round);
  defineOnce('random', Math.random);
  defineOnce('atan2', Math.atan2);

  defineOnce('HALF_PI', 0.5 * window.PI);
  defineOnce('TAU', 2 * window.PI);
  defineOnce('TO_RAD', window.PI / 180);
  defineOnce('floor', function(n){ return n | 0; });
  defineOnce('rand', function(n){ return n * window.random(); });
  defineOnce('randIn', function(min, max){ return window.rand(max - min) + min; });
  defineOnce('randRange', function(n){ return n - window.rand(2 * n); });
  defineOnce('fadeIn', function(t, m){ return t / m; });
  defineOnce('fadeOut', function(t, m){ return (m - t) / m; });
  defineOnce('fadeInOut', function(t, m){ var hm = 0.5 * m; return window.abs(((t + hm) % m) - hm) / (hm); });
  defineOnce('dist', function(x1, y1, x2, y2){ return window.sqrt(window.pow(x2 - x1, 2) + window.pow(y2 - y1, 2)); });
  defineOnce('angle', function(x1, y1, x2, y2){ return window.atan2(y2 - y1, x2 - x1); });
  defineOnce('lerp', function(n1, n2, speed){ return (1 - speed) * n1 + speed * n2; });
})();

