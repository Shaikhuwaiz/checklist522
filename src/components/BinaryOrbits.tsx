import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

export interface BinaryOrbitsProps {
  colors?: [string, string];
  backgroundColor?: string;
  mode?: "auto" | "glow" | "ink";
  stars?: number;
  starSize?: number;
  sparkle?: number;
  arms?: number;
  twist?: number;
  armStrength?: number;
  dust?: number;
  core?: number;
  coreSize?: number;
  innerVoid?: number;
  thickness?: number;
  tilt?: number;
  roll?: number;
  scale?: number;
  centerX?: number;
  centerY?: number;
  speed?: number;
  twinkle?: number;
  depth?: number;
  glow?: number;
  intensity?: number;
  interactive?: boolean;
  hoverWake?: boolean;
  clickRipple?: boolean;
  wakeStrength?: number;
  rippleStrength?: number;
  hoverBoost?: number;
  paused?: boolean;
  quality?: number;
  seed?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

const STAR_VERT = `
precision highp float;

attribute vec4 aP;
attribute vec4 aS;
attribute vec2 aL;

uniform float uSpin;
uniform float uClock;
uniform vec2 uRes;
uniform float uTilt;
uniform float uRoll;
uniform float uArmBand;
uniform float uStreamAmp;
uniform float uRigid;
uniform float uScale;
uniform vec2 uCenter;
uniform float uUnit;
uniform float uStarSize;
uniform float uDpr;
uniform float uTwinkle;
uniform float uDepth;
uniform float uIntensity;
uniform float uCore;
uniform float uCoreSize;
uniform float uColMul;
uniform vec3 uColInner;
uniform vec3 uColOuter;
uniform vec3 uColTint;
uniform vec4 uRipple;
uniform vec3 uPointer;

varying vec4 vColor;

void main() {
  float stream = fract(aS.x + uSpin * aP.w) * 2.0 - 1.0;
  float off = aP.y + stream * uStreamAmp;
  float theta = aL.x + uArmBand * off + uSpin * uRigid;
  vec2 p = vec2(cos(theta), sin(theta)) * aP.x;

  float wake = 0.0;
  if (uPointer.z > 0.001) {
    vec2 dv = uPointer.xy - p;
    wake = exp(-dot(dv, dv) * 42.0) * uPointer.z;
    p += dv * wake * 0.22;
  }

  float rip = 0.0;
  if (uRipple.w > 0.0) {
    float age = uClock - uRipple.z;
    if (age > 0.0 && age < 3.5) {
      vec2 dv = p - uRipple.xy;
      float len = max(length(dv), 0.001);
      float rr = age * 0.62;
      float q = (len - rr) * 8.0;
      rip = exp(-q * q) * exp(-age * 1.7) * uRipple.w;
      p += (dv / len) * rip * 0.05;
    }
  }

  float ct = cos(uTilt);
  float st = sin(uTilt);
  float y1 = p.y * ct - aP.z * st;
  float z1 = p.y * st + aP.z * ct;
  float cr = cos(uRoll);
  float sr = sin(uRoll);
  float x2 = p.x * cr - y1 * sr;
  float y2 = p.x * sr + y1 * cr;

  float persp = 1.0 / (1.0 - 0.25 * z1);
  vec2 screen = uCenter + vec2(x2, y2) * persp * uUnit * uScale;

  gl_Position = vec4(
    screen.x / uRes.x * 2.0 - 1.0,
    1.0 - screen.y / uRes.y * 2.0,
    0.0,
    1.0
  );
  gl_PointSize = max(aS.y * uStarSize * persp * uDpr, 1.0);

  float b = aL.y;
  b *= 1.0 + uTwinkle * 0.55 * sin(uClock * (1.6 + fract(aS.z * 3.17) * 4.4) + aS.z * 87.0);
  b *= 1.0 - smoothstep(0.78, 1.0, abs(stream));
  b *= 1.0 - smoothstep(0.8, 1.0, aP.x);
  b *= 1.0 - 0.32 * smoothstep(0.45, 1.0, aP.x);
  b *= 1.0 + uCore * 2.6 * exp(-aP.x / max(uCoreSize * 1.7, 0.012));
  b *= mix(1.0, smoothstep(-0.9, 0.25, z1), uDepth);
  b += rip * 1.3 + wake;

  vec3 col = mix(uColInner, uColOuter, smoothstep(0.08, 0.9, aP.x));
  col = mix(col, uColTint, aS.w * 0.8);
  col = mix(
    col,
    vec3(1.0),
    clamp(uCore * 1.35 * exp(-aP.x / max(uCoreSize * 1.6, 0.01)), 0.0, 0.92)
  );
  col *= uColMul;

  vColor = vec4(col, clamp(0.85 * uIntensity * b, 0.0, 1.0));
}
`;

const STAR_FRAG = `
precision mediump float;

varying vec4 vColor;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = dot(c, c);
  if (d > 0.25) discard;
  float f = 1.0 - smoothstep(0.04, 0.25, d);
  gl_FragColor = vec4(vColor.rgb, vColor.a * f);
}
`;

const GLOW_VERT = `
attribute vec2 aQ;

void main() {
  gl_Position = vec4(aQ, 0.0, 1.0);
}
`;

const GLOW_FRAG = `
precision mediump float;

uniform vec2 uGlowCenter;
uniform float uGlowUnit;
uniform float uGlowRoll;
uniform float uGlowTilt;
uniform float uGlowAmt;
uniform float uGlowInt;
uniform vec3 uGlowColor;

void main() {
  vec2 pc = (gl_FragCoord.xy - uGlowCenter) / max(uGlowUnit, 1.0);
  pc = vec2(pc.x, -pc.y);
  float cr = cos(-uGlowRoll);
  float sr = sin(-uGlowRoll);
  vec2 t = vec2(pc.x * cr - pc.y * sr, pc.x * sr + pc.y * cr);
  t.y /= max(cos(uGlowTilt), 0.12);
  float d = length(t);
  float g = (exp(-d * 5.5) * 0.3 + exp(-d * 14.0) * 0.85) * uGlowAmt * uGlowInt;
  gl_FragColor = vec4(uGlowColor, clamp(g, 0.0, 1.0));
}
`;

type Cfg = Omit<BinaryOrbitsProps, "className" | "style" | "children">;

type GLEnv = {
  gl: WebGLRenderingContext;
  canvas: HTMLCanvasElement;
  starProg: WebGLProgram;
  glowProg: WebGLProgram;
  starLoc: Record<string, WebGLUniformLocation | null>;
  glowLoc: Record<string, WebGLUniformLocation | null>;
  starBuf: WebGLBuffer;
  quadBuf: WebGLBuffer;
  aP: number;
  aS: number;
  aL: number;
  aQ: number;
  count: number;
  w: number;
  h: number;
};

function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function parseHex(hex: string): [number, number, number] | null {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function luminanceOf(bg: string): number {
  const v = bg.trim().toLowerCase();
  if (v === "transparent" || v === "none" || v === "") return 0;
  const rgb = parseHex(v);
  if (rgb) return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  const m = v.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const parts = m[1].split(",").map((s) => parseFloat(s));
    if (parts.length >= 3 && parts.every((p) => !Number.isNaN(p))) {
      const a = parts.length > 3 && !Number.isNaN(parts[3]) ? parts[3] : 1;
      return (0.2126 * parts[0] + 0.7152 * parts[1] + 0.0722 * parts[2]) / 255 * a;
    }
  }
  return 0;
}

function buildStars(
  n: number,
  arms: number,
  twist: number,
  sparkle: number,
  innerVoid: number,
  thickness: number,
  dust: number,
  seed: number
): Float32Array {
  const rand = mulberry32(Math.floor(seed * 999983) + 1);
  const data = new Float32Array(n * 10);
  const armStep = TAU / Math.max(Math.floor(arms), 1);
  const pitch = twist * 0.92;
  const gauss = () => (rand() + rand() + rand() + rand() - 2) * 0.5;
  const voidR = Math.min(Math.max(innerVoid, 0), 0.6);
  const expA = 0.4;
  const bulgeP = 0.16;
  const bulgeR = 0.15;
  const diskR0 = 0.1;
  const sampleR = () => {
    if (rand() < bulgeP) return Math.pow(rand(), 1.9) * bulgeR;
    const u = rand();
    const x = -expA * Math.log(1 - u * (1 - Math.exp(-1 / expA)));
    return diskR0 + (1 - diskR0) * x;
  };

  for (let i = 0; i < n; i++) {
    let r = sampleR();
    while (r < voidR) r = sampleR();

    const arm = Math.floor(rand() * arms);
    const armAngle = arm * armStep - pitch * Math.log(r + 0.06);

    let scatter = gauss();
    scatter = Math.sign(scatter) * Math.pow(Math.abs(scatter), 1.4);
    if (dust > 0 && scatter > -0.55 && scatter < 0.05 && rand() < dust * 0.9) {
      scatter = -0.55 - dust * 0.9 * rand();
    }

    const z = gauss() * thickness * (0.3 + 0.7 * (1 - r));
    const rate = (0.35 + 0.5 * rand()) * (0.55 / (r + 0.22));
    const phase = rand();
    const isSpark = rand() < sparkle;
    const size = (0.55 + 0.9 * rand()) * (isSpark ? 2.0 : 1.0);
    const bright = (0.45 + 0.55 * rand()) * (isSpark ? 1.55 : 1.0);
    const tw = rand();
    const tint = rand() < 0.68 ? 0 : 0.45 + 0.55 * rand();

    const o = i * 10;
    data[o] = r;
    data[o + 1] = scatter;
    data[o + 2] = z;
    data[o + 3] = rate;
    data[o + 4] = phase;
    data[o + 5] = size;
    data[o + 6] = tw;
    data[o + 7] = tint;
    data[o + 8] = armAngle;
    data[o + 9] = bright;
  }
  return data;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  src: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("shader alloc failed");
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("shader compile failed: " + (log || ""));
  }
  return shader;
}

function linkProgram(
  gl: WebGLRenderingContext,
  vsSrc: string,
  fsSrc: string
): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  const prog = gl.createProgram();
  if (!prog) throw new Error("program alloc failed");
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error("program link failed: " + (log || ""));
  }
  return prog;
}

function uniformLocs(
  gl: WebGLRenderingContext,
  prog: WebGLProgram,
  names: string[]
): Record<string, WebGLUniformLocation | null> {
  const out: Record<string, WebGLUniformLocation | null> = {};
  for (const n of names) out[n] = gl.getUniformLocation(prog, n);
  return out;
}

const STAR_UNIFORMS = [
  "uSpin",
  "uClock",
  "uRes",
  "uTilt",
  "uRoll",
  "uArmBand",
  "uStreamAmp",
  "uRigid",
  "uScale",
  "uCenter",
  "uUnit",
  "uStarSize",
  "uDpr",
  "uTwinkle",
  "uDepth",
  "uIntensity",
  "uCore",
  "uCoreSize",
  "uColMul",
  "uColInner",
  "uColOuter",
  "uColTint",
  "uRipple",
  "uPointer",
];

const GLOW_UNIFORMS = [
  "uGlowCenter",
  "uGlowUnit",
  "uGlowRoll",
  "uGlowTilt",
  "uGlowAmt",
  "uGlowInt",
  "uGlowColor",
];

export default function BinaryOrbits({
  colors = ["#f4f6ff", "#cfd8ff"],
  backgroundColor = "#0A0A0A",
  mode = "auto",
  stars = 24000,
  starSize = 1.5,
  sparkle = 0.3,
  arms = 3,
  twist = 3.5,
  armStrength = 0.82,
  dust = 0.4,
  core = 1,
  coreSize = 0.065,
  innerVoid = 0,
  thickness = 0.02,
  tilt = 72,
  roll = -10,
  scale = 0.8,
  centerX = 0.5,
  centerY = 0.52,
  speed = 0.7,
  twinkle = 0.3,
  depth = 0.3,
  glow = 0.22,
  intensity = 1,
  interactive = false,
  hoverWake = false,
  clickRipple = false,
  wakeStrength = 1,
  rippleStrength = 1,
  hoverBoost = 0.5,
  paused = false,
  quality = 1,
  seed = 1,
  className,
  style,
  children,
}: BinaryOrbitsProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const envRef = useRef<GLEnv | null>(null);
  const [failed, setFailed] = useState(false);

  const cfgRef = useRef<Cfg>({
    colors,
    backgroundColor,
    mode,
    stars,
    starSize,
    sparkle,
    arms,
    twist,
    armStrength,
    dust,
    core,
    coreSize,
    innerVoid,
    thickness,
    tilt,
    roll,
    scale,
    centerX,
    centerY,
    speed,
    twinkle,
    depth,
    glow,
    intensity,
    interactive,
    hoverWake,
    clickRipple,
    wakeStrength,
    rippleStrength,
    hoverBoost,
    paused,
    quality,
    seed,
  });

  useEffect(() => {
    cfgRef.current = {
      colors,
      backgroundColor,
      mode,
      stars,
      starSize,
      sparkle,
      arms,
      twist,
      armStrength,
      dust,
      core,
      coreSize,
      innerVoid,
      thickness,
      tilt,
      roll,
      scale,
      centerX,
      centerY,
      speed,
      twinkle,
      depth,
      glow,
      intensity,
      interactive,
      hoverWake,
      clickRipple,
      wakeStrength,
      rippleStrength,
      hoverBoost,
      paused,
      quality,
      seed,
    };
  });

  const timeRef = useRef({ clock: 0, spin: 0 });
  const pointerRef = useRef({ x: 0, y: 0, hover: false, wake: 0, boost: 0 });
  const rippleRef = useRef({ x: 0, y: 0, t0: -10, s: 0 });
  const motionRef = useRef(false);

  const genKey = [stars, arms, twist, sparkle, innerVoid, thickness, dust, seed].join("|");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      motionRef.current = mq.matches;
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
      });
    } catch {
      gl = null;
    }
    if (!gl) {
      setFailed(true);
      return;
    }

    let starProg: WebGLProgram;
    let glowProg: WebGLProgram;
    try {
      starProg = linkProgram(gl, STAR_VERT, STAR_FRAG);
      glowProg = linkProgram(gl, GLOW_VERT, GLOW_FRAG);
    } catch {
      setFailed(true);
      return;
    }

    const starBuf = gl.createBuffer();
    const quadBuf = gl.createBuffer();
    if (!starBuf || !quadBuf) {
      setFailed(true);
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const env: GLEnv = {
      gl,
      canvas,
      starProg,
      glowProg,
      starLoc: uniformLocs(gl, starProg, STAR_UNIFORMS),
      glowLoc: uniformLocs(gl, glowProg, GLOW_UNIFORMS),
      starBuf,
      quadBuf,
      aP: gl.getAttribLocation(starProg, "aP"),
      aS: gl.getAttribLocation(starProg, "aS"),
      aL: gl.getAttribLocation(starProg, "aL"),
      aQ: gl.getAttribLocation(glowProg, "aQ"),
      count: 0,
      w: 0,
      h: 0,
    };
    envRef.current = env;

    const uploadStars = () => {
      const c = cfgRef.current;
      const data = buildStars(
        Math.max(1, Math.floor(c.stars ?? 24000)),
        Math.max(1, Math.floor(c.arms ?? 3)),
        c.twist ?? 3.5,
        c.sparkle ?? 0.3,
        c.innerVoid ?? 0,
        c.thickness ?? 0.02,
        c.dust ?? 0.4,
        c.seed ?? 1
      );
      gl.bindBuffer(gl.ARRAY_BUFFER, starBuf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      env.count = Math.max(1, Math.floor(c.stars ?? 24000));
    };
    uploadStars();

    const resize = () => {
      const rect = root.getBoundingClientRect();
      env.w = rect.width;
      env.h = rect.height;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(root);

    const draw = () => {
      const c = cfgRef.current;
      const t = timeRef.current;
      const ptr = pointerRef.current;
      const w = env.w;
      const h = env.h;
      if (w <= 0 || h <= 0 || env.count === 0) return;

      const dpr =
        Math.min(window.devicePixelRatio || 1, 2) *
        Math.min(Math.max(c.quality ?? 1, 0.25), 1);
      const bw = Math.max(1, Math.round(w * dpr));
      const bh = Math.max(1, Math.round(h * dpr));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }

      const ink =
        c.mode === "ink" ||
        (c.mode === "auto" && luminanceOf(c.backgroundColor ?? "#0A0A0A") > 0.5);

      const boostInt = 1 + ptr.boost * 0.6;
      const inten = (c.intensity ?? 1) * boostInt;
      const band = 1.0 + (0.16 - 1.0) * Math.min(Math.max(c.armStrength ?? 0.82, 0), 1);
      const streamAmp = Math.min(0.55, band * 0.55);

      const inner = parseHex(c.colors?.[1] ?? "#cfd8ff") ?? [1, 1, 1];
      const outer = parseHex(c.colors?.[0] ?? "#f4f6ff") ?? [1, 1, 1];
      const tint: [number, number, number] = [0.58, 0.6, 1.0];
      const colMul = ink ? 0.4 : 1;
      const center: [number, number] = [
        (c.centerX ?? 0.5) * w,
        (c.centerY ?? 0.52) * h,
      ];
      const unit = Math.min(w * 0.53, h * 0.95);

      gl.viewport(0, 0, bw, bh);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      if (ink) gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      else gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

      if (!ink && (c.glow ?? 0) > 0.001) {
        gl.useProgram(glowProg);
        const L = env.glowLoc;
        gl.uniform2f(L.uGlowCenter, center[0] * dpr, bh - center[1] * dpr);
        gl.uniform1f(L.uGlowUnit, unit * (c.scale ?? 0.8) * dpr);
        gl.uniform1f(L.uGlowRoll, (c.roll ?? -10) * DEG);
        gl.uniform1f(L.uGlowTilt, (c.tilt ?? 72) * DEG);
        gl.uniform1f(L.uGlowAmt, c.glow ?? 0.22);
        gl.uniform1f(L.uGlowInt, inten);
        gl.uniform3f(
          L.uGlowColor,
          inner[0] + (1 - inner[0]) * 0.5,
          inner[1] + (1 - inner[1]) * 0.5,
          inner[2] + (1 - inner[2]) * 0.5
        );
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
        gl.enableVertexAttribArray(env.aQ);
        gl.vertexAttribPointer(env.aQ, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.disableVertexAttribArray(env.aQ);
      }

      gl.useProgram(starProg);
      const L = env.starLoc;
      const rip = rippleRef.current;
      gl.uniform1f(L.uSpin, t.spin);
      gl.uniform1f(L.uClock, t.clock);
      gl.uniform2f(L.uRes, w, h);
      gl.uniform1f(L.uTilt, (c.tilt ?? 72) * DEG);
      gl.uniform1f(L.uRoll, (c.roll ?? -10) * DEG);
      gl.uniform1f(L.uArmBand, band);
      gl.uniform1f(L.uStreamAmp, streamAmp);
      gl.uniform1f(L.uRigid, 0.035);
      gl.uniform1f(L.uScale, c.scale ?? 0.8);
      gl.uniform2f(L.uCenter, center[0], center[1]);
      gl.uniform1f(L.uUnit, unit);
      gl.uniform1f(L.uStarSize, c.starSize ?? 1.5);
      gl.uniform1f(L.uDpr, dpr);
      gl.uniform1f(L.uTwinkle, c.twinkle ?? 0.3);
      gl.uniform1f(L.uDepth, c.depth ?? 0.3);
      gl.uniform1f(L.uIntensity, inten);
      gl.uniform1f(L.uCore, c.core ?? 1);
      gl.uniform1f(L.uCoreSize, c.coreSize ?? 0.065);
      gl.uniform1f(L.uColMul, colMul);
      gl.uniform3f(L.uColInner, inner[0], inner[1], inner[2]);
      gl.uniform3f(L.uColOuter, outer[0], outer[1], outer[2]);
      gl.uniform3f(L.uColTint, tint[0], tint[1], tint[2]);
      gl.uniform4f(L.uRipple, rip.x, rip.y, rip.t0, rip.s);
      gl.uniform3f(L.uPointer, ptr.x, ptr.y, ptr.wake);

      gl.bindBuffer(gl.ARRAY_BUFFER, starBuf);
      gl.enableVertexAttribArray(env.aP);
      gl.vertexAttribPointer(env.aP, 4, gl.FLOAT, false, 40, 0);
      gl.enableVertexAttribArray(env.aS);
      gl.vertexAttribPointer(env.aS, 4, gl.FLOAT, false, 40, 16);
      gl.enableVertexAttribArray(env.aL);
      gl.vertexAttribPointer(env.aL, 2, gl.FLOAT, false, 40, 32);
      gl.drawArrays(gl.POINTS, 0, env.count);
      gl.disableVertexAttribArray(env.aP);
      gl.disableVertexAttribArray(env.aS);
      gl.disableVertexAttribArray(env.aL);
    };

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05);
      last = now;
      const c = cfgRef.current;
      const ptr = pointerRef.current;
      if (!c.paused && !motionRef.current) {
        const t = timeRef.current;
        t.clock += dt;
        const targetBoost =
          c.interactive && ptr.hover ? c.hoverBoost ?? 0.5 : 0;
        const targetWake =
          c.interactive && c.hoverWake && ptr.hover
            ? c.wakeStrength ?? 1
            : 0;
        ptr.boost += (targetBoost - ptr.boost) * Math.min(1, dt * 5);
        ptr.wake += (targetWake - ptr.wake) * Math.min(1, dt * 5);
        t.spin += dt * (c.speed ?? 1) * (1 + ptr.boost * 0.8);
      }
      draw();
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      envRef.current = null;
      gl.deleteBuffer(starBuf);
      gl.deleteBuffer(quadBuf);
      gl.deleteProgram(starProg);
      gl.deleteProgram(glowProg);
    };
  }, []);

  useEffect(() => {
    const env = envRef.current;
    if (!env) return;
    const gl = env.gl;
    const data = buildStars(
      Math.max(1, Math.floor(stars)),
      Math.max(1, Math.floor(arms)),
      twist,
      sparkle,
      innerVoid,
      thickness,
      dust,
      seed
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, env.starBuf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    env.count = Math.max(1, Math.floor(stars));
  }, [genKey, stars, arms, twist, sparkle, innerVoid, thickness, dust, seed]);

  const toGalaxy = (clientX: number, clientY: number): [number, number] | null => {
    const root = rootRef.current;
    if (!root) return null;
    const rect = root.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const c = cfgRef.current;
    const unit = Math.min(rect.width * 0.53, rect.height * 0.95) * (c.scale ?? 0.8);
    if (unit <= 0) return null;
    const dx = (clientX - rect.left - (c.centerX ?? 0.5) * rect.width) / unit;
    const dy = (clientY - rect.top - (c.centerY ?? 0.52) * rect.height) / unit;
    const r = (c.roll ?? -10) * DEG;
    const cr = Math.cos(-r);
    const sr = Math.sin(-r);
    const ux = dx * cr - dy * sr;
    const uy = dx * sr + dy * cr;
    const ct = Math.cos((c.tilt ?? 72) * DEG);
    return [ux, uy / Math.max(ct, 0.1)];
  };

  const handleMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = toGalaxy(e.clientX, e.clientY);
    const ptr = pointerRef.current;
    if (g) {
      ptr.x = g[0];
      ptr.y = g[1];
    }
    ptr.hover = true;
  };

  const handleLeave = () => {
    pointerRef.current.hover = false;
  };

  const handleDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const c = cfgRef.current;
    if (!c.interactive || !c.clickRipple) return;
    const g = toGalaxy(e.clientX, e.clientY);
    if (!g) return;
    rippleRef.current = {
      x: g[0],
      y: g[1],
      t0: timeRef.current.clock,
      s: c.rippleStrength ?? 1,
    };
  };

  const rootStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    minHeight: 240,
    overflow: "hidden",
    backgroundColor,
    ...style,
  };

  if (failed) {
    const c1 = colors[0] ?? "#7B4DFF";
    const c2 = colors[1] ?? "#FFC2EE";
    return (
      <div
        className={className}
        style={{
          ...rootStyle,
          background: `radial-gradient(ellipse 70% 34% at 50% 52%, ${c1}55, transparent 70%), radial-gradient(circle at 50% 52%, ${c2}66, transparent 45%), ${backgroundColor}`,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={className}
      style={rootStyle}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      onPointerDown={handleDown}
    >
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      />
      {children ? (
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      ) : null}
    </div>
  );
}
