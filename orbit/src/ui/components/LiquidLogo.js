import React, { useId } from "react";

/**
 * Liquid/refraction effect for a logo using animated SVG filters.
 * Works great with transparent PNG or SVG logos.
 */
export default function LiquidLogo({
  src,
  size = 240,
  refraction = 0.02,
  patternScale = 2,
  patternBlur = 0.5,
  speed = 6,
  className,
  still = false,
}) {
  // unique IDs so multiple instances don't collide
  const uid = useId().replace(/[:]/g, "");
  const filterId = `liquidRefraction-${uid}`;
  const noiseId = `noise-${uid}`;

  // Map "refraction" to feDisplacementMap scale (SVG uses ~0–200)
  const displacementScale = Math.round(refraction * 1000); // 0.02 -> ~20

  // Base frequency: lower value => larger patterns
  // patternScale ~2 → baseFrequency ~0.8–1.0 for a tight metal feel
  const baseFx = 0.9 / Math.max(0.8, patternScale);
  const baseFy = 1.1 / Math.max(0.8, patternScale);

  return (
    <div
      className={className}
      style={{
        // "metal" background; swap out as you like
        background:
          "radial-gradient(120% 120% at 30% 20%, #f6f7f8 0%, #dcdfe3 45%, #afb4bb 100%)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        borderRadius: 20,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Liquid Logo"
        style={{ display: "block" }}
      >
        <defs>
          {/* Animated fractal noise as our "distortion field" */}
          <filter
            id={filterId}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            filterUnits="objectBoundingBox"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency={`${baseFx} ${baseFy}`}
              numOctaves={2}
              seed={7}
              result={noiseId}
            >
              {!still && (
                <animate
                  attributeName="baseFrequency"
                  values={`${baseFx} ${baseFy}; ${baseFx * 0.8} ${baseFy * 1.1}; ${baseFx} ${baseFy}`}
                  dur={`${speed}s`}
                  repeatCount="indefinite"
                />
              )}
            </feTurbulence>

            {/* softens the noise (patternBlur) */}
            <feGaussianBlur in={noiseId} stdDeviation={patternBlur} result="softNoise" />

            {/* The refraction itself */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="softNoise"
              scale={displacementScale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        {/* Your logo (transparent PNG/SVG works best) */}
        <image
          href={src}
          x="0"
          y="0"
          width={size}
          height={size}
          preserveAspectRatio="xMidYMid meet"
          style={{ filter: `url(#${filterId})` }}
        />
      </svg>
    </div>
  );
}