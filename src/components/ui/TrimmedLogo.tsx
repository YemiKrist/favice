"use client";

import { useState, useEffect } from "react";

interface Props {
  src: string;
  alt?: string;
  maxWidth?: number;
  maxHeight?: number;
  style?: React.CSSProperties;
}

/**
 * Loads a PNG onto a canvas, scans for the bounding box of visible
 * (non-transparent, non-white) pixels, crops to that box, and
 * renders the trimmed result as a data URL.
 */
/** Convert a URL to a data URL via fetch (avoids canvas CORS tainting). */
async function toDataUrl(src: string): Promise<string> {
  if (src.startsWith("data:")) return src;
  const res = await fetch(src, { cache: "force-cache" });
  const blob = await res.blob();
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

async function trimImage(src: string): Promise<string> {
  // Pre-fetch as data URL so canvas is never tainted by CORS
  let dataSrc: string;
  try {
    dataSrc = await toDataUrl(src);
  } catch {
    return src; // fetch failed — return original
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

        let top = height;
        let left = width;
        let right = 0;
        let bottom = 0;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];
            const isContent = a > 10 && !(r > 248 && g > 248 && b > 248);
            if (isContent) {
              if (y < top) top = y;
              if (y > bottom) bottom = y;
              if (x < left) left = x;
              if (x > right) right = x;
            }
          }
        }

        if (right <= left || bottom <= top) {
          resolve(dataSrc); // no content detected, return data URL of original
          return;
        }

        top = Math.max(0, top - 1);
        left = Math.max(0, left - 1);
        right = Math.min(width - 1, right + 1);
        bottom = Math.min(height - 1, bottom + 1);

        const trimW = right - left + 1;
        const trimH = bottom - top + 1;
        const tc = document.createElement("canvas");
        tc.width = trimW;
        tc.height = trimH;
        tc.getContext("2d")!.drawImage(canvas, left, top, trimW, trimH, 0, 0, trimW, trimH);
        resolve(tc.toDataURL("image/png"));
      } catch {
        resolve(dataSrc); // canvas failure — return data URL of original
      }
    };
    img.onerror = () => resolve(dataSrc);
    img.src = dataSrc;
  });
}

export function TrimmedLogo({ src, alt = "Logo", maxWidth = 400, maxHeight = 200, style }: Props) {
  const [trimmedSrc, setTrimmedSrc] = useState(src);

  useEffect(() => {
    trimImage(src).then(setTrimmedSrc);
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={trimmedSrc}
      alt={alt}
      style={{
        display: "block",
        maxWidth,
        maxHeight,
        width: "auto",
        height: "auto",
        ...style,
      }}
    />
  );
}
