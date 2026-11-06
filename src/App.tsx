// src/components/VoxelLoader.tsx
import { memo, useMemo, type CSSProperties } from "react";
import styled, { keyframes } from "styled-components";

export interface VoxelLoaderProps {
  size?: number;
  hue?: number;
  particleCount?: number;
  voxelCount?: number;
  label?: string;
  showLabel?: boolean;

  fullscreen?: boolean;
  className?: string;
}

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

const generateParticles = (count: number) =>
  Array.from({ length: count }, (_, id) => ({
    id,
    style: {
      "--s": `${rand(2, 6).toFixed(1)}px`,
      "--x": `${rand(0, 100).toFixed(1)}%`,
      "--y": `${rand(0, 100).toFixed(1)}%`,
      "--d": `${rand(2, 5).toFixed(2)}s`,
      "--dl": `${rand(-5, 0).toFixed(2)}s`,
    } as CSSProperties,
  }));

const generateMiniVoxels = (count: number) =>
  Array.from({ length: count }, (_, id) => ({
    id,
    style: {
      "--s": `${rand(6, 16).toFixed(1)}px`,
      "--x": `${rand(10, 90).toFixed(1)}%`,
      "--y": `${rand(10, 90).toFixed(1)}%`,
      "--d": `${rand(3, 7).toFixed(2)}s`,
      "--dl": `${rand(-4, 0).toFixed(2)}s`,
    } as CSSProperties,
  }));

const FACES = [
  { t: "rotateY(0deg)", shade: "rgba(0,0,0,0)" }, // frente
  { t: "rotateY(90deg)", shade: "rgba(0,0,0,0.25)" }, // direita
  { t: "rotateY(180deg)", shade: "rgba(0,0,0,0.12)" }, // trás
  { t: "rotateY(270deg)", shade: "rgba(0,0,0,0.35)" }, // esquerda
  { t: "rotateX(90deg)", shade: "rgba(255,255,255,0.10)", top: true }, // topo
  { t: "rotateX(-90deg)", shade: "rgba(0,0,0,0.55)", bottom: true }, // base
] as const;

const VoxelLoader = ({
  size = 75,
  hue = 176,
  particleCount = 14,
  voxelCount = 6,
  label = "Carregando",
  showLabel = false,
  fullscreen = true,
  className,
}: VoxelLoaderProps) => {
  const particles = useMemo(() => generateParticles(particleCount), [particleCount]);
  const miniVoxels = useMemo(() => generateMiniVoxels(voxelCount), [voxelCount]);

  const vars = { "--size": `${size}px`, "--hue": hue } as CSSProperties;

  return (
    <StyledWrapper
      $fullscreen={fullscreen}
      className={className}
      style={vars}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="scene" aria-hidden="true">
        <div className="particles">
          {particles.map((p) => (
            <span key={p.id} className="particle" style={p.style} />
          ))}
        </div>

        <div className="floating-voxels">
          {miniVoxels.map((v) => (
            <span key={v.id} className="mini-voxel" style={v.style} />
          ))}
        </div>

        {/* Brilho no chão: elipse 2D, não gira com o cubo */}
        <div className="floor-glow" />

        <div className="stage">
          <div className="cube-float">
            <div className="cube-loader">
              {FACES.map((f, i) => (
                <Face
                  key={i}
                  $transform={f.t}
                  $shade={f.shade}
                  $kind={"top" in f ? "top" : "bottom" in f ? "bottom" : "side"}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {showLabel && <p className="label">{label}</p>}
    </StyledWrapper>
  );
};

const floatParticle = keyframes`
  0%   { transform: translate3d(0, 0, 0) scale(1);   opacity: 0; }
  20%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translate3d(0, -60px, 0) scale(0.5); opacity: 0; }
`;

const floatVoxel = keyframes`
  0%   { transform: translate3d(0, 0, 0) rotate(0deg);   opacity: 0.4; }
  50%  { opacity: 1; }
  100% { transform: translate3d(0, -30px, 0) rotate(90deg); opacity: 0.4; }
`;

const spinCube = keyframes`
  from { transform: rotateX(-30deg) rotateY(0deg); }
  to   { transform: rotateX(-30deg) rotateY(360deg); }
`;

const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
`;

const pulseGlow = keyframes`
  0%, 100% { transform: translateX(-50%) scale(1);    opacity: 0.55; }
  50%      { transform: translateX(-50%) scale(0.85); opacity: 0.35; }
`;

const blink = keyframes`
  0%, 100% { opacity: 0.5; }
  50%      { opacity: 1; }
`;

const StyledWrapper = styled.div<{ $fullscreen: boolean }>`
  --half: calc(var(--size) / 2);
  --accent: hsl(var(--hue) 100% 50%);
  --accent-soft: hsl(var(--hue) 100% 50% / 0.15);

  display: grid;
  place-items: center;
  align-content: center;
  gap: 16px;
  background: #0a0a0a;
  overflow: hidden;
  box-sizing: border-box;

  ${({ $fullscreen }) =>
    $fullscreen
      ? `
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100dvh;
    z-index: 9999;
  `
      : `
    padding: calc(var(--size) * 1.2);
  `}

  .scene {
    position: relative;
    width: calc(var(--size) * 2);
    height: calc(var(--size) * 2);
  }

  .particles,
  .floating-voxels {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .particle {
    position: absolute;
    left: var(--x);
    top: var(--y);
    width: var(--s);
    height: var(--s);
    background: var(--accent);
    border-radius: 1px;
    box-shadow: 0 0 8px var(--accent);
    opacity: 0;
    will-change: transform, opacity;
    animation: ${floatParticle} var(--d) linear var(--dl) infinite;
  }

  .mini-voxel {
    position: absolute;
    left: var(--x);
    top: var(--y);
    width: var(--s);
    height: var(--s);
    background: var(--accent-soft);
    border: 1px solid var(--accent);
    box-shadow: 0 0 8px hsl(var(--hue) 100% 50% / 0.5);
    will-change: transform, opacity;
    animation: ${floatVoxel} var(--d) ease-in-out var(--dl) infinite;
  }

  .floor-glow {
    position: absolute;
    left: 50%;
    top: calc(50% + var(--size) * 0.85);
    width: calc(var(--size) * 1.7);
    height: calc(var(--size) * 0.4);
    background: radial-gradient(
      ellipse at center,
      hsl(var(--hue) 100% 50% / 0.7) 0%,
      hsl(var(--hue) 100% 50% / 0.25) 45%,
      transparent 70%
    );
    transform: translateX(-50%);
    will-change: transform, opacity;
    animation: ${pulseGlow} 3s ease-in-out infinite;
  }

  /* Contexto 3D isolado: só o cubo vive aqui */
  .stage {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    perspective: 1000px;
  }

  .cube-float {
    transform-style: preserve-3d;
    will-change: transform;
    animation: ${bob} 3s ease-in-out infinite;
  }

  .cube-loader {
    position: relative;
    width: var(--size);
    height: var(--size);
    transform-style: preserve-3d;
    transform: rotateX(-30deg);
    will-change: transform;
    animation: ${spinCube} 6s linear infinite;
  }

  .label {
    margin: 0;
    color: var(--accent);
    font:
      500 0.875rem/1 system-ui,
      sans-serif;
    letter-spacing: 0.08em;
    animation: ${blink} 1.6s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .particles,
    .floating-voxels {
      display: none;
    }
    .cube-float,
    .floor-glow,
    .label {
      animation: none;
    }
    .cube-loader {
      animation-duration: 24s;
    }
  }
`;

const Face = styled.span<{
  $transform: string;
  $shade: string;
  $kind: "side" | "top" | "bottom";
}>`
  position: absolute;
  inset: 0;
  transform: ${({ $transform }) => $transform} translateZ(var(--half));
  backface-visibility: hidden;
  border: 1px solid hsl(var(--hue) 100% 50% / 0.35);

  /* camadas: sombreamento da face, grade voxel (5x5) e gradiente base */
  background-image:
    linear-gradient(${({ $shade }) => $shade}, ${({ $shade }) => $shade}),
    linear-gradient(hsl(var(--hue) 100% 50% / 0.2) 1px, transparent 1px),
    linear-gradient(90deg, hsl(var(--hue) 100% 50% / 0.2) 1px, transparent 1px),
    ${({ $kind }) =>
      $kind === "top"
        ? "linear-gradient(135deg, hsl(var(--hue) 80% 20%), hsl(var(--hue) 90% 35%))"
        : $kind === "bottom"
          ? "linear-gradient(hsl(var(--hue) 80% 12%), hsl(var(--hue) 80% 12%))"
          : "linear-gradient(to bottom, hsl(var(--hue) 80% 15%), hsl(var(--hue) 100% 45%))"};
  background-size:
    100% 100%,
    calc(var(--size) / 5) calc(var(--size) / 5),
    calc(var(--size) / 5) calc(var(--size) / 5),
    100% 100%;
  box-shadow: inset 0 0 calc(var(--size) / 3) hsl(var(--hue) 100% 50% / 0.4);
`;

export default memo(VoxelLoader);
