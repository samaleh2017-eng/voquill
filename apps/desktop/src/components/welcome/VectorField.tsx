import chroma from "chroma-js";
import { useEffect, useMemo, useRef } from "react";
import { useWindowSize } from "../../hooks/helper.hooks";
import { Perlin } from "../../utils/math.utils";

export const VectorField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width, height } = useWindowSize();

  const perlin = useMemo(() => new Perlin(), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const GRID_SPACING = 40;
    const TIME_SPEED = 0.0025;
    const NOISE_SCALE = 0.0018;
    const MAG_SCALE = 0.01;
    const MAX_VECTOR_LENGTH = 24;
    const LINE_WIDTH = 2;

    const colorScale = chroma.scale(["#3B82F6", "#FF9F1C"]).mode("rgb");

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += TIME_SPEED;

      ctx.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / GRID_SPACING) + 1;
      const rows = Math.ceil(height / GRID_SPACING) + 1;

      const offsetX = (width - (cols - 1) * GRID_SPACING) / 2;
      const offsetY = (height - (rows - 1) * GRID_SPACING) / 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * GRID_SPACING + offsetX;
          const y = j * GRID_SPACING + offsetY;

          const nAngle = perlin.noise(x * NOISE_SCALE, y * NOISE_SCALE, time);
          const angle = nAngle * Math.PI * 2;

          const rawMag = perlin.noise(
            x * MAG_SCALE + 2000,
            y * MAG_SCALE + 2000,
            time,
          );
          const magnitude = (rawMag + 1) / 2;

          const length = magnitude * MAX_VECTOR_LENGTH;

          const x1 = x;
          const y1 = y;
          const x2 = x + Math.cos(angle) * length;
          const y2 = y + Math.sin(angle) * length;

          const color = colorScale(magnitude).hex();

          ctx.strokeStyle = color;
          ctx.lineWidth = LINE_WIDTH;
          ctx.lineCap = "round";
          ctx.globalAlpha = 0.8;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [width, height, perlin]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
};
