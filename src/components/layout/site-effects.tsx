"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function SiteEffects() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const [showLoader, setShowLoader] = useState(!isAdmin);

  useEffect(() => {
    if (isAdmin) {
      return;
    }

    const loaderTimeout = window.setTimeout(() => setShowLoader(false), 850);
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );

    const observeRevealElements = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>(".kvn-reveal:not(.is-visible)").forEach((element) => {
        revealObserver.observe(element);
      });
    };

    observeRevealElements(document);

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(".kvn-reveal:not(.is-visible)")) {
            revealObserver.observe(node);
          }
          observeRevealElements(node);
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    let frame = 0;
    const updateScrollEffects = () => {
      frame = 0;
      const scrollY = window.scrollY;
      document.documentElement.style.setProperty("--kvn-parallax", `${scrollY * 0.12}px`);
      document.documentElement.classList.toggle("kvn-scrolled", scrollY > 18);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateScrollEffects);
    };

    const onPointerMove = (event: PointerEvent) => {
      document.documentElement.style.setProperty("--kvn-cursor-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--kvn-cursor-y", `${event.clientY}px`);
    };

    updateScrollEffects();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      window.clearTimeout(loaderTimeout);
      revealObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [isAdmin, pathname]);

  if (isAdmin || !showLoader) {
    return null;
  }

  return (
    <div className="kvn-loader" aria-label="Chargement de la boutique" role="status">
      <div className="kvn-loader-mark">KVN</div>
      <p>Chargement...</p>
    </div>
  );
}
