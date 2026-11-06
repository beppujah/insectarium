const isTouch=matchMedia('(pointer: coarse)').matches||('ontouchstart' in window);
if(isTouch)document.body.classList.add('is-touch');
// ================= utilities =================
const $=id=>document.getElementById(id);
const clamp=(x,a,b)=>x<a?a:x>b?b:x, lerp=(a,b,t)=>a+(b-a)*t, fract=x=>x-Math.floor(x);
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const hn=(x,y,s)=>fract(Math.sin(x*127.1+y*311.7+s*74.7)*43758.5453);
function vnoise(x,y,s){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
 return lerp(lerp(hn(ix,iy,s),hn(ix+1,iy,s),u),lerp(hn(ix,iy+1,s),hn(ix+1,iy+1,s),u),v);}

export { isTouch, $, clamp, lerp, rng, hn, vnoise };
