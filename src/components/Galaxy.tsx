import { useEffect, useRef, type HTMLAttributes } from "react";

const canCreateWebGL = () => {
  if (typeof window === "undefined") return false;
  if (!window.WebGLRenderingContext) return false;

  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;

    return Boolean(gl);
  } catch {
    return false;
  }
};

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform bool uTransparent;

varying vec2 vUv;

#define NUM_LAYER 4.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float tri(float x) {
  return abs(fract(x) * 2.0 - 1.0);
}

float tris(float x) {
  float t = fract(x);
  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}

float trisn(float x) {
  float t = fract(x);
  return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float Star(vec2 uv, float flare) {
  float d = length(uv);
  float m = (0.05 * uGlowIntensity) / d;
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare * uGlowIntensity;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * 0.3 * flare * uGlowIntensity;
  m *= smoothstep(1.0, 0.2, d);
  return m;
}

vec3 StarLayer(vec2 uv) {
  vec3 col = vec3(0.0);

  vec2 gv = fract(uv) - 0.5;
  vec2 id = floor(uv);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 si = id + vec2(float(x), float(y));
      float seed = Hash21(si);
      float size = fract(seed * 345.32);
      float glossLocal = tri(uStarSpeed / (PERIOD * seed + 1.0));
      float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;

      vec3 base = vec3(0.9, 0.92, 1.0);
      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;
      hue = fract(hue + uHueShift / 360.0);
      float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;
      float val = max(max(base.r, base.g), base.b);
      base = hsv2rgb(vec3(hue, sat, val));

      vec2 pad = vec2(
        tris(seed * 34.0 + uTime * uSpeed / 10.0),
        tris(seed * 38.0 + uTime * uSpeed / 30.0)
      ) - 0.5;

      float star = Star(gv - offset - pad, flareSize);
      float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
      twinkle = mix(1.0, twinkle, uTwinkleIntensity);
      star *= twinkle;

      col += star * size * base;
    }
  }

  return col;
}

void main() {
  vec2 focalPx = uFocal * uResolution.xy;
  vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;

  vec2 mouseNorm = uMouse - vec2(0.5);

  if (uAutoCenterRepulsion > 0.0) {
    vec2 centerUV = vec2(0.0, 0.0);
    float centerDist = length(uv - centerUV);
    vec2 repulsion = normalize(uv - centerUV) * (uAutoCenterRepulsion / (centerDist + 0.1));
    uv += repulsion * 0.05;
  } else if (uMouseRepulsion) {
    vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y;
    float mouseDist = length(uv - mousePosUV);
    vec2 repulsion = normalize(uv - mousePosUV) * (uRepulsionStrength / (mouseDist + 0.1));
    uv += repulsion * 0.05 * uMouseActiveFactor;
  } else {
    vec2 mouseOffset = mouseNorm * 0.1 * uMouseActiveFactor;
    uv += mouseOffset;
  }

  float autoRotAngle = uTime * uRotationSpeed;
  mat2 autoRot = mat2(cos(autoRotAngle), -sin(autoRotAngle), sin(autoRotAngle), cos(autoRotAngle));
  uv = autoRot * uv;

  uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;

  vec3 col = vec3(0.0);

  for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) {
    float depth = fract(i + uStarSpeed * uSpeed);
    float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
    float fade = depth * smoothstep(1.0, 0.9, depth);
    col += StarLayer(uv * scale + i * 453.32) * fade;
  }

  if (uTransparent) {
    float alpha = length(col);
    alpha = smoothstep(0.0, 0.3, alpha);
    alpha = min(alpha, 1.0);
    gl_FragColor = vec4(col, alpha);
  } else {
    gl_FragColor = vec4(col, 1.0);
  }
}
`;

type UniformLocations = {
  uTime: WebGLUniformLocation | null;
  uResolution: WebGLUniformLocation | null;
  uFocal: WebGLUniformLocation | null;
  uRotation: WebGLUniformLocation | null;
  uStarSpeed: WebGLUniformLocation | null;
  uDensity: WebGLUniformLocation | null;
  uHueShift: WebGLUniformLocation | null;
  uSpeed: WebGLUniformLocation | null;
  uMouse: WebGLUniformLocation | null;
  uGlowIntensity: WebGLUniformLocation | null;
  uSaturation: WebGLUniformLocation | null;
  uMouseRepulsion: WebGLUniformLocation | null;
  uTwinkleIntensity: WebGLUniformLocation | null;
  uRotationSpeed: WebGLUniformLocation | null;
  uRepulsionStrength: WebGLUniformLocation | null;
  uMouseActiveFactor: WebGLUniformLocation | null;
  uAutoCenterRepulsion: WebGLUniformLocation | null;
  uTransparent: WebGLUniformLocation | null;
};

interface GalaxyProps extends HTMLAttributes<HTMLDivElement> {
  focal?: [number, number];
  rotation?: [number, number];
  starSpeed?: number;
  density?: number;
  hueShift?: number;
  disableAnimation?: boolean;
  speed?: number;
  mouseInteraction?: boolean;
  glowIntensity?: number;
  saturation?: number;
  mouseRepulsion?: boolean;
  twinkleIntensity?: number;
  rotationSpeed?: number;
  repulsionStrength?: number;
  autoCenterRepulsion?: number;
  transparent?: boolean;
  className?: string;
}

const createShader = (
  gl: WebGLRenderingContext,
  type: number,
  source: string
) => {
  const shader = gl.createShader(type);

  if (!shader) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Galaxy: shader compile failed", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
};

const createProgram = (
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string
) => {
  const vertex = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  if (!vertex || !fragment) {
    return null;
  }

  const program = gl.createProgram();

  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    return null;
  }

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Galaxy: program link failed", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
};

const createFullscreenTriangle = (
  gl: WebGLRenderingContext,
  program: WebGLProgram
) => {
  const buffer = gl.createBuffer();

  if (!buffer) {
    return null;
  }

  const vertices = new Float32Array([
    -1, -1, 0, 0,
    3, -1, 2, 0,
    -1, 3, 0, 2,
  ]);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, "position");
  const uvLocation = gl.getAttribLocation(program, "uv");

  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);

  gl.enableVertexAttribArray(uvLocation);
  gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 16, 8);

  return buffer;
};

const mergeClassName = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(" ");

export default function Galaxy({
  focal = [0.5, 0.5],
  rotation = [1.0, 0.0],
  starSpeed = 0.5,
  density = 1,
  hueShift = 140,
  disableAnimation = false,
  speed = 1.0,
  mouseInteraction = false,
  glowIntensity = 0.3,
  saturation = 0.0,
  mouseRepulsion = false,
  repulsionStrength = 2,
  twinkleIntensity = 0.3,
  rotationSpeed = 0.1,
  autoCenterRepulsion = 0,
  transparent = true,
  className,
  style,
  ...rest
}: GalaxyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const bufferRef = useRef<WebGLBuffer | null>(null);
  const uniformsRef = useRef<UniformLocations | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const renderSceneRef = useRef<(() => void) | null>(null);
  const targetMousePos = useRef({ x: 0.5, y: 0.5 });
  const smoothMousePos = useRef({ x: 0.5, y: 0.5 });
  const targetMouseActive = useRef(0);
  const smoothMouseActive = useRef(0);
  const starSpeedRef = useRef(starSpeed);
  const uniformValuesRef = useRef({
    focal,
    rotation,
    density,
    hueShift,
    speed,
    glowIntensity,
    saturation,
    mouseRepulsion,
    twinkleIntensity,
    rotationSpeed,
    repulsionStrength,
    autoCenterRepulsion,
  });

  useEffect(() => {
    starSpeedRef.current = starSpeed;
  }, [starSpeed]);

  useEffect(() => {
    uniformValuesRef.current = {
      focal,
      rotation,
      density,
      hueShift,
      speed,
      glowIntensity,
      saturation,
      mouseRepulsion,
      twinkleIntensity,
      rotationSpeed,
      repulsionStrength,
      autoCenterRepulsion,
    };
  }, [
    focal,
    rotation,
    density,
    hueShift,
    speed,
    glowIntensity,
    saturation,
    twinkleIntensity,
    rotationSpeed,
    repulsionStrength,
    autoCenterRepulsion,
  ]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!canCreateWebGL()) {
      console.warn("Galaxy: WebGL is not available, skipping renderer init.");
      return;
    }

    const container = containerRef.current;
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl", {
        alpha: transparent,
        premultipliedAlpha: false,
      }) ||
        canvas.getContext("experimental-webgl", {
          alpha: transparent,
          premultipliedAlpha: false,
        })) as WebGLRenderingContext | null;

    if (!gl) {
      console.warn("Galaxy: failed to acquire WebGL context.");
      return;
    }

    const program = createProgram(gl, vertexShader, fragmentShader);

    if (!program) {
      return;
    }

    gl.useProgram(program);

    const buffer = createFullscreenTriangle(gl, program);

    if (!buffer) {
      gl.deleteProgram(program);
      return;
    }

    const uniforms: UniformLocations = {
      uTime: gl.getUniformLocation(program, "uTime"),
      uResolution: gl.getUniformLocation(program, "uResolution"),
      uFocal: gl.getUniformLocation(program, "uFocal"),
      uRotation: gl.getUniformLocation(program, "uRotation"),
      uStarSpeed: gl.getUniformLocation(program, "uStarSpeed"),
      uDensity: gl.getUniformLocation(program, "uDensity"),
      uHueShift: gl.getUniformLocation(program, "uHueShift"),
      uSpeed: gl.getUniformLocation(program, "uSpeed"),
      uMouse: gl.getUniformLocation(program, "uMouse"),
      uGlowIntensity: gl.getUniformLocation(program, "uGlowIntensity"),
      uSaturation: gl.getUniformLocation(program, "uSaturation"),
      uMouseRepulsion: gl.getUniformLocation(program, "uMouseRepulsion"),
      uTwinkleIntensity: gl.getUniformLocation(program, "uTwinkleIntensity"),
      uRotationSpeed: gl.getUniformLocation(program, "uRotationSpeed"),
      uRepulsionStrength: gl.getUniformLocation(program, "uRepulsionStrength"),
      uMouseActiveFactor: gl.getUniformLocation(program, "uMouseActiveFactor"),
      uAutoCenterRepulsion: gl.getUniformLocation(program, "uAutoCenterRepulsion"),
      uTransparent: gl.getUniformLocation(program, "uTransparent"),
    };

    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.pointerEvents = "none";

    canvasRef.current = canvas;
    glRef.current = gl;
    programRef.current = program;
    bufferRef.current = buffer;
    uniformsRef.current = uniforms;

    if (transparent) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
    } else {
      gl.clearColor(0, 0, 0, 1);
    }

    const syncUniforms = (timeMs: number) => {
      const currentCanvas = canvasRef.current;
      const currentGl = glRef.current;
      const currentProgram = programRef.current;
      const currentUniforms = uniformsRef.current;

      if (!currentCanvas || !currentGl || !currentProgram || !currentUniforms) {
        return;
      }

      const values = uniformValuesRef.current;
      currentGl.useProgram(currentProgram);

      currentGl.uniform1f(currentUniforms.uTime, timeMs * 0.001);
      currentGl.uniform3f(
        currentUniforms.uResolution,
        currentCanvas.width,
        currentCanvas.height,
        currentCanvas.width / currentCanvas.height
      );
      currentGl.uniform2f(currentUniforms.uFocal, values.focal[0], values.focal[1]);
      currentGl.uniform2f(
        currentUniforms.uRotation,
        values.rotation[0],
        values.rotation[1]
      );
      currentGl.uniform1f(
        currentUniforms.uStarSpeed,
        (timeMs * 0.001 * starSpeedRef.current) / 10.0
      );
      currentGl.uniform1f(currentUniforms.uDensity, values.density);
      currentGl.uniform1f(currentUniforms.uHueShift, values.hueShift);
      currentGl.uniform1f(currentUniforms.uSpeed, values.speed);
      currentGl.uniform2f(
        currentUniforms.uMouse,
        smoothMousePos.current.x,
        smoothMousePos.current.y
      );
      currentGl.uniform1f(currentUniforms.uGlowIntensity, values.glowIntensity);
      currentGl.uniform1f(currentUniforms.uSaturation, values.saturation);
      currentGl.uniform1i(
        currentUniforms.uMouseRepulsion,
        values.mouseRepulsion ? 1 : 0
      );
      currentGl.uniform1f(
        currentUniforms.uTwinkleIntensity,
        values.twinkleIntensity
      );
      currentGl.uniform1f(currentUniforms.uRotationSpeed, values.rotationSpeed);
      currentGl.uniform1f(
        currentUniforms.uRepulsionStrength,
        values.repulsionStrength
      );
      currentGl.uniform1f(
        currentUniforms.uMouseActiveFactor,
        smoothMouseActive.current
      );
      currentGl.uniform1f(
        currentUniforms.uAutoCenterRepulsion,
        values.autoCenterRepulsion
      );
      currentGl.uniform1i(currentUniforms.uTransparent, transparent ? 1 : 0);
    };

    const renderScene = () => {
      const currentGl = glRef.current;

      if (!currentGl) {
        return;
      }

      currentGl.clear(currentGl.COLOR_BUFFER_BIT);
      currentGl.drawArrays(currentGl.TRIANGLES, 0, 3);
    };

    renderSceneRef.current = () => {
      syncUniforms(0);
      renderScene();
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      const maxDpr = disableAnimation ? 1 : 1.25;
      const dpr =
        typeof window !== "undefined"
          ? Math.max(1, Math.min(window.devicePixelRatio || 1, maxDpr))
          : 1;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const frameUpdate = (timeMs: number) => {
      const lerpFactor = 0.05;

      smoothMousePos.current.x +=
        (targetMousePos.current.x - smoothMousePos.current.x) * lerpFactor;
      smoothMousePos.current.y +=
        (targetMousePos.current.y - smoothMousePos.current.y) * lerpFactor;
      smoothMouseActive.current +=
        (targetMouseActive.current - smoothMouseActive.current) * lerpFactor;

      syncUniforms(timeMs);
      renderScene();
      rafIdRef.current = window.requestAnimationFrame(frameUpdate);
    };

    const stopAnimation = () => {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };

    const startAnimation = () => {
      if (rafIdRef.current === null) {
        rafIdRef.current = window.requestAnimationFrame(frameUpdate);
      }
    };

    let handleMouseMove: ((event: MouseEvent) => void) | null = null;
    let handleMouseLeave: (() => void) | null = null;
    let visibilityHandler: (() => void) | null = null;
    let resizeObserver: ResizeObserver | null = null;

    container.appendChild(canvas);
    resize();

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        resize();
        if (disableAnimation) {
          renderSceneRef.current?.();
        }
      });
      resizeObserver.observe(container);
    }

    window.addEventListener("resize", resize, false);

    if (disableAnimation) {
      renderSceneRef.current?.();
    } else {
      startAnimation();

      handleMouseMove = (event: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = 1 - (event.clientY - rect.top) / rect.height;
        targetMousePos.current = { x, y };
        targetMouseActive.current = 1;
      };

      handleMouseLeave = () => {
        targetMouseActive.current = 0;
      };

      if (mouseInteraction && handleMouseMove && handleMouseLeave) {
        container.addEventListener("mousemove", handleMouseMove);
        container.addEventListener("mouseleave", handleMouseLeave);
      }

      visibilityHandler = () => {
        if (document.hidden) {
          stopAnimation();
        } else {
          startAnimation();
        }
      };

      document.addEventListener("visibilitychange", visibilityHandler);
    }

    return () => {
      stopAnimation();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);

      if (visibilityHandler) {
        document.removeEventListener("visibilitychange", visibilityHandler);
      }

      if (mouseInteraction) {
        if (handleMouseMove) {
          container.removeEventListener("mousemove", handleMouseMove);
        }
        if (handleMouseLeave) {
          container.removeEventListener("mouseleave", handleMouseLeave);
        }
      }

      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }

      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();

      if (canvasRef.current === canvas) {
        canvasRef.current = null;
      }

      if (glRef.current === gl) {
        glRef.current = null;
      }

      if (programRef.current === program) {
        programRef.current = null;
      }

      if (bufferRef.current === buffer) {
        bufferRef.current = null;
      }

      uniformsRef.current = null;
      renderSceneRef.current = null;
    };
  }, [disableAnimation, mouseInteraction, transparent]);

  useEffect(() => {
    if (disableAnimation) {
      renderSceneRef.current?.();
    }
  }, [
    focal,
    rotation,
    density,
    hueShift,
    speed,
    glowIntensity,
    saturation,
    mouseRepulsion,
    twinkleIntensity,
    rotationSpeed,
    repulsionStrength,
    autoCenterRepulsion,
    disableAnimation,
  ]);

  return (
    <div
      ref={containerRef}
      className={mergeClassName("fixed inset-0 z-0 overflow-hidden bg-[#02030a]", className)}
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 35%, rgba(96,85,255,0.15), transparent 32%), radial-gradient(circle at 50% 58%, rgba(22,163,255,0.12), transparent 48%), linear-gradient(180deg,#03040a 0%,#02030a 100%)",
        ...style,
      }}
      {...rest}
    />
  );
}
