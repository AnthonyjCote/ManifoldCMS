import { useBuilderStore } from "../../../features/builder/builder-store";

export function PageSeoTab() {
  const builder = useBuilderStore();

  return (
    <div className="drawer-tab-inner">
      <div className="drawer-stack">
        <label className="inspector-field">
          <span>SEO Title</span>
          <input
            value={builder.selectedPage.seo.title}
            onChange={(event) => builder.setPageSeo("title", event.target.value)}
          />
        </label>
        <label className="inspector-field">
          <span>SEO Description</span>
          <textarea
            value={builder.selectedPage.seo.description}
            onChange={(event) => builder.setPageSeo("description", event.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
