import { useBuilderStore } from "../../../features/builder/builder-store";

export function ValidationTab() {
  const builder = useBuilderStore();
  const issues: string[] = [];

  if (builder.state.routeValidationError) {
    issues.push(builder.state.routeValidationError);
  }
  if (!builder.selectedPage.seo.title.trim()) {
    issues.push("SEO title is missing.");
  }

  return (
    <div className="drawer-stack">
      {issues.length === 0 ? (
        <div className="drawer-panel">No validation issues.</div>
      ) : (
        issues.map((issue) => (
          <div key={issue} className="drawer-panel warning">
            {issue}
          </div>
        ))
      )}
    </div>
  );
}
