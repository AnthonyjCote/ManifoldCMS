import type { ReactNode } from "react";

type OptionalLeftPaneProps = {
  enabled: boolean;
  width: number;
  setWidth: (width: number) => void;
  content: (() => ReactNode) | undefined;
};

export function OptionalLeftPane({ enabled, width, setWidth, content }: OptionalLeftPaneProps) {
  if (!enabled) {
    return null;
  }

  const LeftPaneContent = content;

  return (
    <aside className="left-pane" style={{ width }}>
      <header className="left-pane-header">Context</header>
      <div className="left-pane-body">{LeftPaneContent ? <LeftPaneContent /> : null}</div>
      <div
        className="left-pane-resizer"
        role="separator"
        aria-orientation="vertical"
        onMouseDown={(event) => {
          event.preventDefault();
          const startX = event.clientX;
          const startWidth = width;

          const onMove = (moveEvent: MouseEvent) => {
            const next = Math.max(220, Math.min(420, startWidth + (moveEvent.clientX - startX)));
            setWidth(next);
          };

          const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
          };

          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        }}
      />
    </aside>
  );
}
