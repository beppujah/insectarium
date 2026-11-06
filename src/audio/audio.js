import { clamp } from '../core/util.js';
import { ctl } from '../input/controls.js';
import { G, insects, lv } from '../world/level.js';

// ================= audio =================
// effects and ambience sit about 3 dB below full scale so the narration stays clear
const FX_LEVEL=.7;
const audio={ctx:null,
 init(){if(this.ctx)return;const C=window.AudioContext||window.webkitAudioContext;const ac=this.ctx=new C();
  this.master=ac.createGain();this.lp=ac.createBiquadFilter();this.lp.type='lowpass';this.lp.frequency.value=20000;this.master.connect(this.lp).connect(ac.destination);
  this.echo=ac.createDelay();this.echo.delayTime.value=.23;const fb=ac.createGain();fb.gain.value=.38;this.echo.connect(fb).connect(this.echo);this.echo.connect(this.master);
  setInterval(()=>{if(lv.under&&G.soundOn&&Math.random()<.28)this.drip();if(lv.water&&G.soundOn&&Math.random()<.4)this.bubble();
   if(lv.key==='surf'&&G.soundOn&&G.pond&&Math.hypot(G.px-G.pond.x,G.py-G.pond.y)<G.pond.r+12&&Math.random()<.05)this.croak();},420);
  // wind: filtered noise
  const len=ac.sampleRate*2,buf=ac.createBuffer(1,len,ac.sampleRate),d=buf.getChannelData(0);let last=0;
  for(let i=0;i<len;i++){last=(last+.02*(Math.random()*2-1))/1.02;d[i]=last*3.5;}
  const n=ac.createBufferSource();n.buffer=buf;n.loop=true;this.windF=ac.createBiquadFilter();this.windF.type='bandpass';this.windF.Q.value=.6;
  this.windG=ac.createGain();this.windG.gain.value=0;n.connect(this.windF).connect(this.windG).connect(this.master);n.start();
  // buzz of the nearest bee
  const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=220;const lfo=ac.createOscillator();lfo.frequency.value=31;const lg=ac.createGain();lg.gain.value=9;lfo.connect(lg).connect(o.frequency);
  const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=900;this.buzzG=ac.createGain();this.buzzG.gain.value=0;this.buzzP=ac.createStereoPanner();
  o.connect(f).connect(this.buzzG).connect(this.buzzP).connect(this.master);o.start();lfo.start();
  // crickets at night
  setInterval(()=>{const night=clamp((ctl.tod.value-.4)*2,0,1);if(lv.key!=='surf'||!G.soundOn||Math.random()>.45*night)return;this.chirp();},140);
 },
 chirp(){const ac=this.ctx,t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain(),p=ac.createStereoPanner();
  o.frequency.value=4100+Math.random()*700;p.pan.value=Math.random()*2-1;g.gain.value=0;
  for(let i=0;i<3;i++){g.gain.setValueAtTime(0,t+i*.045);g.gain.linearRampToValueAtTime(.045,t+i*.045+.006);g.gain.linearRampToValueAtTime(0,t+i*.045+.026);}
  o.connect(g).connect(p).connect(this.master);o.start(t);o.stop(t+.2);},
 drip(){const ac=this.ctx,t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain(),p=ac.createStereoPanner();const f=900+Math.random()*1300;
  o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*1.7,t+.06);g.gain.setValueAtTime(.09,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);p.pan.value=Math.random()*1.6-.8;
  o.connect(g).connect(p);p.connect(this.master);p.connect(this.echo);o.start(t);o.stop(t+.25);},
 bubble(){const ac=this.ctx,t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain(),p=ac.createStereoPanner();const f=300+Math.random()*500;
  o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*2.4,t+.08);g.gain.setValueAtTime(.07,t);g.gain.exponentialRampToValueAtTime(.001,t+.1);p.pan.value=Math.random()*1.6-.8;
  o.connect(g).connect(p).connect(this.master);o.start(t);o.stop(t+.12);},
 croak(){const ac=this.ctx,t=ac.currentTime,d=Math.hypot(G.px-G.pond.x,G.py-G.pond.y),vol=clamp(1-d/(G.pond.r+12),0,1)*.16;
  const side=((G.pond.x-G.px)*-Math.sin(G.ang)+(G.pond.y-G.py)*Math.cos(G.ang))/Math.max(1,d);
  for(let k=0;k<2;k++){const o=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain(),p=ac.createStereoPanner(),t0=t+k*.18;o.type='sawtooth';o.frequency.setValueAtTime(160,t0);o.frequency.linearRampToValueAtTime(120,t0+.12);
   f.type='bandpass';f.frequency.value=650;f.Q.value=3;g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(vol,t0+.02);g.gain.exponentialRampToValueAtTime(.001,t0+.14);p.pan.value=clamp(side,-1,1);
   o.connect(f).connect(g).connect(p).connect(this.master);o.start(t0);o.stop(t0+.16);}},
 dig(down){if(!this.ctx)return;const ac=this.ctx,t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type='triangle';
  o.frequency.setValueAtTime(down?520:180,t);o.frequency.exponentialRampToValueAtTime(down?140:600,t+.45);g.gain.setValueAtTime(.12,t);g.gain.exponentialRampToValueAtTime(.001,t+.5);o.connect(g).connect(this.master);o.start(t);o.stop(t+.55);},
 chime(mul=1){if(!this.ctx)return;const ac=this.ctx,t=ac.currentTime;[0,4,7,12].forEach((s,i)=>{const o=ac.createOscillator(),g=ac.createGain();
  o.type='triangle';o.frequency.value=660*mul*Math.pow(2,s/12);g.gain.setValueAtTime(0,t+i*.07);g.gain.linearRampToValueAtTime(.12,t+i*.07+.01);g.gain.exponentialRampToValueAtTime(.001,t+i*.07+.5);
  o.connect(g).connect(this.master);o.start(t+i*.07);o.stop(t+i*.07+.6);});},
 update(){if(!this.ctx)return;const t=this.ctx.currentTime;
  this.master.gain.setTargetAtTime(G.soundOn?ctl.vol.value*FX_LEVEL:0,t,.05);
  const w=ctl.wind.value;this.windG.gain.setTargetAtTime(lv.water?.16:lv.under?.22:w*.35,t,.3);this.windF.frequency.setTargetAtTime(lv.water?160:lv.under?110:300+w*900,t,.3);
  this.lp.frequency.setTargetAtTime(lv.water?750:lv.under?1800:20000,t,.2);
  let best=null,bd=99;for(const b of insects)if(b.sp.buzz){const d=Math.hypot(b.x-G.px,b.y-G.py);if(d<bd){bd=d;best=b;}}
  if(!best)this.buzzG.gain.setTargetAtTime(0,t,.1);
  if(best){const dx=best.x-G.px,dy=best.y-G.py;const side=(dx*-Math.sin(G.ang)+dy*Math.cos(G.ang))/Math.max(.3,bd);
   this.buzzG.gain.setTargetAtTime(clamp(1-bd/7,0,1)**2*.12,t,.05);this.buzzP.pan.setTargetAtTime(clamp(side,-1,1),t,.05);}}
};

export { audio };
