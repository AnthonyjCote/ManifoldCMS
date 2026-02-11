export function PublishView() {
  return (
    <section className="view-shell">
      <header className="view-header">
        <h1>Publish</h1>
        <p>Push exported repo to staging.</p>
      </header>
      <form className="publish-form" onSubmit={(event) => event.preventDefault()}>
        <label>
          Repo URL
          <input placeholder="git@github.com:org/repo.git" />
        </label>
        <label>
          Branch
          <input defaultValue="staging" />
        </label>
        <label>
          Export Folder
          <input placeholder="/path/to/export" />
        </label>
        <label>
          Commit Message
          <input placeholder="chore(export): project YYYY-MM-DD HH:mm" />
        </label>
        <button className="primary-btn">Publish</button>
      </form>
    </section>
  );
}
