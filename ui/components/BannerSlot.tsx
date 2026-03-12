"use client";

import { useEffect, useState, useRef } from "react";
import { getBannersByPosition } from "@/app/actions/admin";

export default function BannerSlot({ position }: { position: string }) {
  const [banners, setBanners] = useState<{ id: number; content: string }[]>([]);
  const containerRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    getBannersByPosition(position).then(setBanners);
  }, [position]);

  // Execute <script> tags inside banner HTML
  useEffect(() => {
    containerRefs.current.forEach((el) => {
      const scripts = el.querySelectorAll("script");
      scripts.forEach((orig) => {
        const s = document.createElement("script");
        if (orig.src) {
          s.src = orig.src;
        } else {
          s.textContent = orig.textContent;
        }
        orig.replaceWith(s);
      });
    });
  }, [banners]);

  if (banners.length === 0) return null;

  return (
    <div className="w-full">
      {banners.map((b) => (
        <div
          key={b.id}
          ref={(el) => {
            if (el) containerRefs.current.set(b.id, el);
            else containerRefs.current.delete(b.id);
          }}
          dangerouslySetInnerHTML={{ __html: b.content }}
        />
      ))}
    </div>
  );
}
