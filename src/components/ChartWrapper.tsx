import React from "react";

type ChartWrapperProps = {
  children: React.ReactNode;
  className?: string;
};

export default function ChartWrapper({ children, className = "" }: ChartWrapperProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [ready, setReady] = React.useState(false);

  React.useLayoutEffect(() => {
    const node = ref.current;
    if (!node || typeof window === "undefined") {
      return;
    }

    const checkVisibility = () => {
      const { width, height } = node.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setReady(true);
      }
    };

    checkVisibility();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(checkVisibility);
      observer.observe(node);
      return () => observer.disconnect();
    }

    const handleResize = () => {
      checkVisibility();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div ref={ref} className={`h-full w-full ${className}`}>
      {ready ? children : <div className="h-full w-full" />}
    </div>
  );
}
