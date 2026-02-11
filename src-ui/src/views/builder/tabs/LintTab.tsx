import { useBuilderStore } from "../../../features/builder/builder-store";

export function LintTab() {
  const builder = useBuilderStore();
  const warnings: string[] = [];

  if (builder.selectedPage.blocks.length === 0) {
    warnings.push("Page has no blocks.");
  }

  return (
    <div className="drawer-stack">
      {warnings.length === 0 ? (
        <div className="drawer-panel">No lint warnings.</div>
      ) : (
        warnings.map((warning) => (
          <div key={warning} className="drawer-panel warning">
            {warning}
          </div>
        ))
      )}
    </div>
  );
}
