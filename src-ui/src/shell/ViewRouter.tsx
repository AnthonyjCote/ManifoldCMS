import type { ViewDefinition } from "../types/ui";

type ViewRouterProps = {
  viewDefinition: ViewDefinition;
};

export function ViewRouter({ viewDefinition }: ViewRouterProps) {
  const ActiveView = viewDefinition.component;
  return (
    <div className={`view-router view-${viewDefinition.id}`}>
      <ActiveView />
    </div>
  );
}
