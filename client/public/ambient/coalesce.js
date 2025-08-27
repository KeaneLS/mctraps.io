(function(){
'use strict';
if (window.__COALESCE_DEFINED__) { window.__COALESCE_SETUP__ && window.__COALESCE_SETUP__(); return; }
window.__COALESCE_DEFINED__ = true;

const particleCount = 50;
const particlePropCount = 9;
const particlePropsLength = particleCount * particlePropCount;
const baseTTL = 100;
const rangeTTL = 500;
const baseSpeed = 0;
const rangeSpeed = 0.05;
const baseSize = 2;
const rangeSize = 10;
const baseHue = 10;
const rangeHue = 100;
const noiseSteps = 2;
const xOff = 0.0025;
const yOff = 0.005;
const zOff = 0.0005;
const backgroundColor = 'hsla(60,50%,3%,1)';

const THEME_LIGHT = '#fafafa';
const THEME_DARK = '#18181b';
const THEME_BRAND = '#4ade80';

let active = false;
let rafId;
let currentColors;
let overrideParticleColorHex;

function getThemeMode() {
  try {
    if (window.__COALESCE_MODE__ === 'light' || window.__COALESCE_MODE__ === 'dark') {
      return window.__COALESCE_MODE__;
    }
    const stored = window.localStorage.getItem('themeMode');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return 'dark';
}

function getColors() {
  const mode = getThemeMode();
  return {
    background: mode === 'dark' ? THEME_DARK : THEME_LIGHT,
    particle: mode === 'dark' ? THEME_LIGHT : THEME_BRAND,
  };
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

let container;
let canvas;
let ctx;
let center;
let gradient;
let tick;
let particleProps;
let positions;
let velocities;
let lifeSpans;
let speeds;
let sizes;
let hues;

function setup() {
	createCanvas();
  resize();
  initParticles();
	draw();
}

function initParticles() {
  tick = 0;
  particleProps = new Float32Array(particlePropsLength);

  let i;
  
  for (i = 0; i < particlePropsLength; i += particlePropCount) {
    initParticle(i);
  }
}

function initParticle(i) {
  let theta, x, y, vx, vy, life, ttl, speed, size, hue;

  x = rand(canvas.a.width);
  y = rand(canvas.a.height);
  theta = angle(x, y, center[0], center[1]);
  vx = cos(theta) * 6;
  vy = sin(theta) * 6;
  life = 0;
  ttl = baseTTL + rand(rangeTTL);
  speed = baseSpeed + rand(rangeSpeed);
  size = baseSize + rand(rangeSize);
  hue = baseHue + rand(rangeHue);

  particleProps.set([x, y, vx, vy, life, ttl, speed, size, hue], i);
}

function drawParticles() {
  let i;

  for (i = 0; i < particlePropsLength; i += particlePropCount) {
    updateParticle(i);
  }
}

function updateParticle(i) {
  let i2=1+i, i3=2+i, i4=3+i, i5=4+i, i6=5+i, i7=6+i, i8=7+i, i9=8+i;
  let x, y, theta, vx, vy, life, ttl, speed, x2, y2, size, hue;

  x = particleProps[i];
  y = particleProps[i2];
  theta = angle(x, y, center[0], center[1]) + 0.75 * HALF_PI;
  vx = lerp(particleProps[i3], 2 * cos(theta), 0.05);
  vy = lerp(particleProps[i4], 2 * sin(theta), 0.05);
  life = particleProps[i5];
  ttl = particleProps[i6];
  speed = particleProps[i7];
  x2 = x + vx * speed;
  y2 = y + vy * speed;
  size = particleProps[i8];
  hue = particleProps[i9];

  drawParticle(x, y, theta, life, ttl, size, hue);

  life++;

  particleProps[i] = x2;
  particleProps[i2] = y2;
  particleProps[i3] = vx;
  particleProps[i4] = vy;
  particleProps[i5] = life;

  life > ttl && initParticle(i);
}

function drawParticle(x, y, theta, life, ttl, size, hue) {
  let xRel = x - (0.5 * size), yRel = y - (0.5 * size);
  
  ctx.a.save();
  ctx.a.lineCap = 'round';
  ctx.a.lineWidth = 1;
  const chosen = overrideParticleColorHex || getColors().particle;
  ctx.a.strokeStyle = hexToRgba(chosen, fadeInOut(life, ttl));
  ctx.a.beginPath();
  ctx.a.translate(xRel, yRel);
  ctx.a.rotate(theta);
  ctx.a.translate(-xRel, -yRel);
  ctx.a.strokeRect(xRel, yRel, size, size);
  ctx.a.closePath();
  ctx.a.restore();
}

function createCanvas() {
  container = document.querySelector('.content--canvas');
	canvas = {
		a: document.createElement('canvas'),
		b: document.createElement('canvas')
	};
	canvas.b.style = `
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	`;
	container && container.appendChild(canvas.b);
	ctx = {
		a: canvas.a.getContext('2d'),
		b: canvas.b.getContext('2d')
  };
  center = [];
}

function resize() {
	const { innerWidth, innerHeight } = window;
	
	canvas.a.width = innerWidth;
  canvas.a.height = innerHeight;

  ctx.a.drawImage(canvas.b, 0, 0);

	canvas.b.width = innerWidth;
  canvas.b.height = innerHeight;
  
  ctx.b.drawImage(canvas.a, 0, 0);

  center[0] = 0.5 * canvas.a.width;
  center[1] = 0.5 * canvas.a.height;
}

function renderGlow() {
  const mode = getThemeMode();
  const isDark = mode === 'dark';

  ctx.b.save();
  ctx.b.filter = isDark ? 'blur(8px) brightness(200%)' : 'blur(2px) brightness(100%)';
  ctx.b.globalCompositeOperation = isDark ? 'lighter' : 'multiply';
  ctx.b.drawImage(canvas.a, 0, 0);
  ctx.b.restore();

  ctx.b.save();
  ctx.b.filter = isDark ? 'blur(4px) brightness(200%)' : 'blur(1px) brightness(100%)';
  ctx.b.globalCompositeOperation = isDark ? 'lighter' : 'multiply';
  ctx.b.drawImage(canvas.a, 0, 0);
  ctx.b.restore();
}

function render() {
  const mode = getThemeMode();
  const isDark = mode === 'dark';
  ctx.b.save();
  ctx.b.globalCompositeOperation = isDark ? 'lighter' : 'source-over';
  ctx.b.drawImage(canvas.a, 0, 0);
  ctx.b.restore();
}

function draw() {
  tick++;

  ctx.a.clearRect(0, 0, canvas.a.width, canvas.a.height);

  currentColors = getColors();
  ctx.b.fillStyle = currentColors.background;
  ctx.b.fillRect(0, 0, canvas.a.width, canvas.a.height);

  drawParticles();
  renderGlow();
  render();

	rafId = window.requestAnimationFrame(draw);
}

function destroy() {
  try {
    active = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = undefined;
    }
    if (container && canvas && canvas.b && canvas.b.parentNode === container) {
      container.removeChild(canvas.b);
    }
    canvas = undefined;
    ctx = undefined;
    center = undefined;
  } catch {}
}

window.__COALESCE_SETUP__ = setup;
window.__COALESCE_DESTROY__ = destroy;
window.__COALESCE_FORCE_RECOLOR__ = function(){
};
window.__COALESCE_SET_PARTICLE_COLOR__ = function(hex){
  overrideParticleColorHex = hex;
};

window.addEventListener('load', setup);
window.addEventListener('resize', resize);

})();

