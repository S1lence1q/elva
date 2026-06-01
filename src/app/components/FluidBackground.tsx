import React, { useEffect, useRef } from 'react';

interface FluidBackgroundProps {
  color1: string;
  color2: string;
  color3: string;
  color4?: string;
  className?: string;
  speedMultiplier?: number;
  transitionDuration?: number;
}

// Robust helper to parse arbitrary hex, rgb/rgba, or hsl/hsla strings into [R, G, B] normalized floats (0.0 to 1.0)
function parseToRgb(colorStr: string): [number, number, number] {
  if (!colorStr) return [0.05, 0.05, 0.05];
  
  const str = colorStr.trim().toLowerCase();
  
  // 1. HEX Format (#fff, #ffffff, #ffffff80)
  if (str.startsWith('#')) {
    const hex = str.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16) / 255;
      const g = parseInt(hex[1] + hex[1], 16) / 255;
      const b = parseInt(hex[2] + hex[2], 16) / 255;
      return [r, g, b];
    } else if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return [r, g, b];
    }
  }
  
  // 2. RGB/RGBA Format (rgba(255, 255, 255, 0.5) or rgb(10, 20, 30))
  if (str.startsWith('rgb')) {
    const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1], 10) / 255;
      const g = parseInt(match[2], 10) / 255;
      const b = parseInt(match[3], 10) / 255;
      return [r, g, b];
    }
  }
  
  // 3. HSL/HSLA Format (hsl(120, 100%, 50%) or hsla(120, 100%, 50%, 0.5))
  if (str.startsWith('hsl')) {
    const match = str.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%/);
    if (match) {
      const h = parseInt(match[1], 10);
      const s = parseInt(match[2], 10) / 100;
      const l = parseInt(match[3], 10) / 100;
      
      const a = s * Math.min(l, 1 - l);
      const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return color;
      };
      return [f(0), f(8), f(4)];
    }
  }

  // 4. Fallbacks for Theme Presets and generic keywords
  if (str.includes('emerald') || str.includes('sage')) return [0.06, 0.46, 0.33];
  if (str.includes('sand') || str.includes('amber') || str.includes('linen')) return [0.96, 0.62, 0.04];
  if (str.includes('wine') || str.includes('rose') || str.includes('burgundy')) return [0.88, 0.16, 0.38];
  if (str.includes('navy') || str.includes('slate') || str.includes('indigo') || str.includes('blue')) return [0.12, 0.16, 0.32];
  
  return [0.05, 0.05, 0.05];
}

// GLSL Vertex Shader code - maps standard viewport quad
const VS_SOURCE = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// GLSL Fragment Shader code - mathematically generates morphing organic marbled fluid
const FS_SOURCE = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform vec3 u_color3;
  uniform vec3 u_color4;

  void main() {
    // Normalize coordinates
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= u_resolution.x / u_resolution.y;

    // --- LIQUID CHROME / OIL MARBLING (Perfect balance of broad waves and sharp marbled tracks) ---
    // Pass 1: Broad fluid distortion
    float q1 = sin(p.x * 1.8 + p.y * 1.3 + u_time * 0.07);
    float q2 = cos(p.y * 1.5 - p.x * 1.6 + u_time * 0.05);
    vec2 warped1 = p + vec2(q1, q2) * 0.95; // Moderate warping offset

    // Pass 2: High-contrast marbled veining pass
    float r1 = sin(warped1.y * 3.2 + warped1.x * 2.0 - u_time * 0.09);
    float r2 = cos(warped1.x * 2.8 - warped1.y * 2.4 + u_time * 0.08);
    vec2 finalWarped = warped1 + vec2(r1, r2) * 0.58;

    // Calculate sharp color bands using wave functions of warped coordinates
    float waveBand1 = sin(finalWarped.x * 1.8 + u_time * 0.04) * 0.5 + 0.5;
    float waveBand2 = cos(finalWarped.y * 2.2 - u_time * 0.05) * 0.5 + 0.5;

    // Moderate exponents to create distinct marble boundaries (veins) without radioactive noise
    waveBand1 = pow(waveBand1, 2.0);
    waveBand2 = pow(waveBand2, 2.2);

    // Dynamic, saturated color mixing (giving it massive cinematic punch and glow!)
    vec3 c1 = u_color1 * 1.45; // Boost primary base vibrance
    vec3 c2 = u_color2 * 1.40; // Boost secondary vibrance
    vec3 c3 = u_color3 * 1.95; // Give accent color a huge radiant backlight glow boost!
    vec3 c4 = u_color4; 

    // Map weights based on our marbled wave bands
    float w1 = waveBand1 * 0.85;
    float w2 = waveBand2 * (1.0 - waveBand1) * 0.75;
    float w3 = (1.0 - waveBand2) * 0.55;
    float w4 = max(0.0, 1.0 - (w1 + w2 + w3));

    float totalWeight = w1 + w2 + w3 + w4 + 0.001;
    vec3 blendedColor = (c1 * w1 + c2 * w2 + c3 * w3 + c4 * w4) / totalWeight;

    // Apply soft contrast curve for beautiful depth
    vec3 finalColor = pow(blendedColor, vec3(1.15));

    // Luminous, fully saturated scaling (burn factor set to 0.88 for premium organic liquid chrome feel)
    gl_FragColor = vec4(finalColor * 0.88, 1.0);
  }
`;

export const FluidBackground: React.FC<FluidBackgroundProps> = ({
  color1,
  color2,
  color3,
  color4 = '#0f172a', // beautiful deep slate backing color
  className = '',
  speedMultiplier = 1.0,
  transitionDuration = 1.2
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const speedRef = useRef(speedMultiplier);
  const durationRef = useRef(transitionDuration);

  // Sync speedMultiplier changes to a mutable ref to prevent WebGL program re-compilation
  useEffect(() => {
    speedRef.current = speedMultiplier;
  }, [speedMultiplier]);

  useEffect(() => {
    durationRef.current = transitionDuration;
  }, [transitionDuration]);

  // Keep track of target colors
  const targetColorsRef = useRef<[number, number, number][]>([
    parseToRgb(color1),
    parseToRgb(color2),
    parseToRgb(color3),
    parseToRgb(color4)
  ]);

  // Keep track of active current colors for smooth transitioning
  const currentColorsRef = useRef<[number, number, number][]>([
    parseToRgb(color1),
    parseToRgb(color2),
    parseToRgb(color3),
    parseToRgb(color4)
  ]);

  // Sync props to target refs
  useEffect(() => {
    targetColorsRef.current = [
      parseToRgb(color1),
      parseToRgb(color2),
      parseToRgb(color3),
      parseToRgb(color4)
    ];
  }, [color1, color2, color3, color4]);

  // WebGL compilation and render loop (Runs exactly once on mount!)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) {
      console.warn("WebGL is not supported in this browser. Falling back to CSS colors.");
      return;
    }

    // Helper to compile a shader
    const compileShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, VS_SOURCE);
    const fs = compileShader(gl.FRAGMENT_SHADER, FS_SOURCE);
    if (!vs || !fs) return;

    // Link WebGL program
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("WebGL Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Set up full viewport quad geometry
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Bind position attributes
    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Get Uniform locations
    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const resLoc = gl.getUniformLocation(program, 'u_resolution');
    const col1Loc = gl.getUniformLocation(program, 'u_color1');
    const col2Loc = gl.getUniformLocation(program, 'u_color2');
    const col3Loc = gl.getUniformLocation(program, 'u_color3');
    const col4Loc = gl.getUniformLocation(program, 'u_color4');

    let animationFrameId: number;
    let localTime = Math.random() * 500; // Start at randomized time coordinate to keep shapes unique
    let idleFrameCount = 0; // Counter for throttling renders when colors are stable

    // Resize canvas display buffer
    const resizeCanvas = () => {
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    };

    // Render loop
    const render = () => {
      resizeCanvas();

      // Smoothly LERP colors in memory (R, G, B) to prevent sudden jumps
      // Multiplied duration by 1.6x and used a gentler exponent (-2.0 instead of -3.0) 
      // for a luxurious, slow-motion liquid paint blend that feels incredibly majestic and smooth.
      const duration = Math.max(0.01, durationRef.current * 1.6);
      const speed = 1.0 - Math.exp(-2.0 / (duration * 60.0));
      
      let maxDelta = 0;
      for (let i = 0; i < 4; i++) {
        for (let c = 0; c < 3; c++) {
          const targetVal = targetColorsRef.current[i][c];
          const currentVal = currentColorsRef.current[i][c];
          const delta = targetVal - currentVal;
          maxDelta = Math.max(maxDelta, Math.abs(delta));
          currentColorsRef.current[i][c] = currentVal + delta * speed;
        }
      }

      // Idle throttling: when colors have converged, only redraw every 4th frame.
      // The fluid animation still flows (localTime advances), but we skip GPU draw calls
      // to save battery/CPU on laptops when the background is stable.
      const isConverged = maxDelta < 0.0008;
      if (isConverged) {
        idleFrameCount++;
        localTime += 0.012 * speedRef.current;
        if (idleFrameCount % 4 !== 0) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }
      } else {
        idleFrameCount = 0;
      }

      // Update shader uniforms
      localTime += 0.012 * speedRef.current;
      gl.uniform1f(timeLoc, localTime);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      
      gl.uniform3fv(col1Loc, currentColorsRef.current[0]);
      gl.uniform3fv(col2Loc, currentColorsRef.current[1]);
      gl.uniform3fv(col3Loc, currentColorsRef.current[2]);
      gl.uniform3fv(col4Loc, currentColorsRef.current[3]);

      // Draw the triangles
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    // Begin loop
    render();

    // Clean up resources on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      gl.deleteBuffer(buffer);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 size-full w-full h-full pointer-events-none block z-0 overflow-hidden bg-[#07070a] ${className}`}
      style={{ mixBlendMode: 'normal' }}
    />
  );
};
