const STEPS = ["Target", "Readiness", "Export", "Verify", "Finish"];

export function ExportWizardView() {
  return (
    <section className="view-shell">
      <header className="view-header">
        <h1>Export Wizard</h1>
        <p>Run deterministic Astro export and verification.</p>
      </header>
      <ol className="wizard-steps">
        {STEPS.map((step, index) => (
          <li key={step} className={index === 0 ? "active" : ""}>
            {step}
          </li>
        ))}
      </ol>
      <div className="placeholder-block">Step content area</div>
    </section>
  );
}
