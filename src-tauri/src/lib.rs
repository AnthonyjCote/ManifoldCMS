use std::fs;
use std::path::{Path, PathBuf};
use std::collections::{HashMap, HashSet};

use chrono::Utc;
use serde::{Deserialize, Serialize};

const PROJECT_META_FILE: &str = "project.json";
const SITE_FILE: &str = "site.json";
const SITEMAP_FILE: &str = "sitemap.json";
const PAGES_DIR: &str = "pages";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProjectMetadata {
  name: String,
  slug: String,
  site_url: String,
  created_at: String,
  updated_at: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProjectRecord {
  id: String,
  name: String,
  path: String,
  updated_at: String,
  site_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SiteDoc {
  site_name: String,
  base_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SitemapDoc {
  page_order: Vec<String>,
  root_page_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PageSeoDoc {
  title: String,
  description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BlockStyleDoc {
  variant: String,
  margin_top: Option<String>,
  margin_bottom: Option<String>,
  padding_top: Option<String>,
  padding_right: Option<String>,
  padding_bottom: Option<String>,
  padding_left: Option<String>,
  border_width: Option<String>,
  border_style: Option<String>,
  border_color: Option<String>,
  border_radius: Option<String>,
  background_color: Option<String>,
  text_color: Option<String>,
  font_size: Option<String>,
  primitive_styles: Option<HashMap<String, HashMap<String, String>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BlockDoc {
  id: String,
  #[serde(rename = "type")]
  block_type: String,
  props: serde_json::Value,
  visibility: String,
  style_overrides: BlockStyleDoc,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PageDoc {
  id: String,
  title: String,
  route: String,
  seo: PageSeoDoc,
  blocks: Vec<BlockDoc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BuilderProjectDoc {
  site: SiteDoc,
  sitemap: SitemapDoc,
  pages: Vec<PageDoc>,
  selected_page_id: String,
}

fn now_iso() -> String {
  Utc::now().to_rfc3339()
}

fn normalize_slug(raw: &str) -> String {
  let mut slug = raw.trim().to_lowercase();
  if slug.is_empty() {
    slug = "new-project".to_string();
  }

  let mut sanitized = String::new();
  for ch in slug.chars() {
    if ch.is_ascii_alphanumeric() || ch == '-' {
      sanitized.push(ch);
    } else if ch.is_ascii_whitespace() || ch == '_' {
      sanitized.push('-');
    }
  }

  while sanitized.contains("--") {
    sanitized = sanitized.replace("--", "-");
  }

  sanitized.trim_matches('-').to_string()
}

fn normalize_site_url(raw: &str) -> String {
  let trimmed = raw.trim();
  if trimmed.is_empty() {
    return "https://example.com".to_string();
  }
  if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
    return trimmed.to_string();
  }
  format!("https://{}", trimmed)
}

fn read_project_metadata(project_dir: &Path) -> Result<ProjectMetadata, String> {
  let meta_path = project_dir.join(PROJECT_META_FILE);
  let content = fs::read_to_string(&meta_path)
    .map_err(|err| format!("Failed reading {}: {}", meta_path.display(), err))?;
  serde_json::from_str::<ProjectMetadata>(&content)
    .map_err(|err| format!("Failed parsing {}: {}", meta_path.display(), err))
}

fn write_project_metadata(project_dir: &Path, metadata: &ProjectMetadata) -> Result<(), String> {
  let meta_path = project_dir.join(PROJECT_META_FILE);
  let content =
    serde_json::to_string_pretty(metadata).map_err(|err| format!("Failed serializing metadata: {}", err))?;
  fs::write(&meta_path, content)
    .map_err(|err| format!("Failed writing {}: {}", meta_path.display(), err))
}

fn project_record_from_dir(project_dir: &Path) -> Result<ProjectRecord, String> {
  let metadata = read_project_metadata(project_dir)?;
  let path = project_dir
    .to_str()
    .ok_or_else(|| "Project path is not valid UTF-8".to_string())?
    .to_string();
  Ok(ProjectRecord {
    id: path.clone(),
    name: metadata.name,
    path,
    updated_at: metadata.updated_at,
    site_url: metadata.site_url,
  })
}

fn write_json_file<T: Serialize>(path: &Path, value: &T) -> Result<(), String> {
  let content =
    serde_json::to_string_pretty(value).map_err(|err| format!("Failed serializing {}: {}", path.display(), err))?;
  fs::write(path, content).map_err(|err| format!("Failed writing {}: {}", path.display(), err))
}

fn read_json_file<T: for<'de> Deserialize<'de>>(path: &Path) -> Result<T, String> {
  let content =
    fs::read_to_string(path).map_err(|err| format!("Failed reading {}: {}", path.display(), err))?;
  serde_json::from_str::<T>(&content).map_err(|err| format!("Failed parsing {}: {}", path.display(), err))
}

fn page_doc_path(project_dir: &Path, page: &PageDoc) -> PathBuf {
  project_dir.join(PAGES_DIR).join(format!("{}.json", page.id))
}

fn canonical_page_id_from_route(route: &str) -> String {
  let trimmed = route.trim();
  if trimmed.is_empty() || trimmed == "/" {
    return "home".to_string();
  }
  let normalized = trimmed
    .trim_start_matches('/')
    .split('/')
    .filter(|segment| !segment.is_empty())
    .flat_map(|segment| segment.chars())
    .map(|ch| {
      if ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' {
        ch.to_ascii_lowercase()
      } else {
        '-'
      }
    })
    .collect::<String>()
    .replace('_', "-");
  let collapsed = normalized
    .split('-')
    .filter(|part| !part.is_empty())
    .collect::<Vec<_>>()
    .join("-");
  if collapsed.is_empty() {
    "home".to_string()
  } else {
    collapsed
  }
}

fn default_builder_doc(metadata: &ProjectMetadata) -> BuilderProjectDoc {
  let home = PageDoc {
    id: "home".to_string(),
    title: "Home".to_string(),
    route: "/".to_string(),
    seo: PageSeoDoc {
      title: "Home".to_string(),
      description: "".to_string(),
    },
    blocks: Vec::new(),
  };

  BuilderProjectDoc {
    site: SiteDoc {
      site_name: metadata.name.clone(),
      base_url: metadata.site_url.clone(),
    },
    sitemap: SitemapDoc {
      page_order: vec![home.id.clone()],
      root_page_id: home.id.clone(),
    },
    pages: vec![home.clone()],
    selected_page_id: home.id,
  }
}

fn normalize_builder_doc(doc: BuilderProjectDoc) -> BuilderProjectDoc {
  let mut pages = doc.pages;
  if pages.is_empty() {
    pages.push(PageDoc {
      id: "home".to_string(),
      title: "Home".to_string(),
      route: "/".to_string(),
      seo: PageSeoDoc {
        title: "Home".to_string(),
        description: "".to_string(),
      },
      blocks: Vec::new(),
    });
  }

  let mut id_map = HashMap::<String, String>::new();
  let mut used_ids = HashSet::<String>::new();
  for page in &mut pages {
    let previous_id = page.id.clone();
    let base_id = canonical_page_id_from_route(&page.route);
    let mut next_id = base_id.clone();
    let mut counter = 2;
    while used_ids.contains(&next_id) {
      next_id = format!("{}-{}", base_id, counter);
      counter += 1;
    }
    page.id = next_id.clone();
    used_ids.insert(next_id.clone());
    id_map.insert(previous_id, next_id);
  }

  let page_ids: HashSet<String> = pages.iter().map(|page| page.id.clone()).collect();
  let mut page_order: Vec<String> = doc
    .sitemap
    .page_order
    .into_iter()
    .map(|page_id| id_map.get(&page_id).cloned().unwrap_or(page_id))
    .filter(|page_id| page_ids.contains(page_id))
    .collect();

  for page in &pages {
    if !page_order.contains(&page.id) {
      page_order.push(page.id.clone());
    }
  }

  let mapped_root = id_map
    .get(&doc.sitemap.root_page_id)
    .cloned()
    .unwrap_or(doc.sitemap.root_page_id);
  let root_page_id = if page_ids.contains(&mapped_root) {
    mapped_root
  } else {
    page_order
      .first()
      .cloned()
      .unwrap_or_else(|| "page-home".to_string())
  };

  let mapped_selected = id_map
    .get(&doc.selected_page_id)
    .cloned()
    .unwrap_or(doc.selected_page_id);
  let selected_page_id = if page_ids.contains(&mapped_selected) {
    mapped_selected
  } else {
    root_page_id.clone()
  };

  BuilderProjectDoc {
    site: doc.site,
    sitemap: SitemapDoc {
      page_order,
      root_page_id,
    },
    pages,
    selected_page_id,
  }
}

fn persist_builder_doc(project_dir: &Path, doc: &BuilderProjectDoc) -> Result<(), String> {
  let normalized = normalize_builder_doc(doc.clone());
  let pages_dir = project_dir.join(PAGES_DIR);
  fs::create_dir_all(&pages_dir)
    .map_err(|err| format!("Failed creating pages dir {}: {}", pages_dir.display(), err))?;

  write_json_file(&project_dir.join(SITE_FILE), &normalized.site)?;
  write_json_file(&project_dir.join(SITEMAP_FILE), &normalized.sitemap)?;

  let mut expected_files = HashSet::<PathBuf>::new();
  for page in &normalized.pages {
    let page_path = page_doc_path(project_dir, page);
    expected_files.insert(page_path.clone());
    write_json_file(&page_path, page)?;
  }

  let existing = fs::read_dir(&pages_dir)
    .map_err(|err| format!("Failed reading pages dir {}: {}", pages_dir.display(), err))?;
  for entry in existing {
    let Ok(entry) = entry else {
      continue;
    };
    let path = entry.path();
    if path.extension().and_then(|ext| ext.to_str()) != Some("json") {
      continue;
    }
    if !expected_files.contains(&path) {
      let _ = fs::remove_file(path);
    }
  }

  Ok(())
}

fn load_builder_doc(project_dir: &Path) -> Result<BuilderProjectDoc, String> {
  let metadata = read_project_metadata(project_dir)?;
  let site_path = project_dir.join(SITE_FILE);
  let sitemap_path = project_dir.join(SITEMAP_FILE);
  let pages_dir = project_dir.join(PAGES_DIR);

  if !site_path.exists() || !sitemap_path.exists() || !pages_dir.exists() {
    let doc = default_builder_doc(&metadata);
    persist_builder_doc(project_dir, &doc)?;
    return Ok(doc);
  }

  let site = read_json_file::<SiteDoc>(&site_path)?;
  let sitemap = read_json_file::<SitemapDoc>(&sitemap_path)?;
  let mut pages_by_id: HashMap<String, PageDoc> = HashMap::new();

  let entries =
    fs::read_dir(&pages_dir).map_err(|err| format!("Failed reading pages dir: {}", err))?;
  for entry in entries {
    let Ok(entry) = entry else {
      continue;
    };
    let path = entry.path();
    if path.extension().and_then(|ext| ext.to_str()) != Some("json") {
      continue;
    }
    if let Ok(page) = read_json_file::<PageDoc>(&path) {
      pages_by_id.insert(page.id.clone(), page);
    }
  }

  if pages_by_id.is_empty() {
    let doc = default_builder_doc(&metadata);
    persist_builder_doc(project_dir, &doc)?;
    return Ok(doc);
  }

  let mut pages: Vec<PageDoc> = Vec::new();
  for page_id in &sitemap.page_order {
    if let Some(page) = pages_by_id.remove(page_id) {
      pages.push(page);
    }
  }
  let mut remaining: Vec<PageDoc> = pages_by_id.into_values().collect();
  remaining.sort_by(|a, b| a.title.cmp(&b.title));
  pages.extend(remaining);

  let loaded = normalize_builder_doc(BuilderProjectDoc {
    site,
    sitemap,
    pages,
    selected_page_id: "".to_string(),
  });
  persist_builder_doc(project_dir, &loaded)?;
  Ok(loaded)
}

#[tauri::command]
fn list_projects(workspace_root: String) -> Result<Vec<ProjectRecord>, String> {
  let workspace = PathBuf::from(workspace_root);
  if !workspace.exists() {
    return Ok(Vec::new());
  }
  if !workspace.is_dir() {
    return Err("Workspace root must be a directory".to_string());
  }

  let mut projects = Vec::new();
  let entries =
    fs::read_dir(&workspace).map_err(|err| format!("Failed reading workspace: {}", err))?;

  for entry in entries {
    let Ok(entry) = entry else {
      continue;
    };
    let path = entry.path();
    if !path.is_dir() {
      continue;
    }
    let Some(name) = path.file_name().and_then(|n| n.to_str()) else {
      continue;
    };
    if !name.ends_with(".manifold") {
      continue;
    }
    if !path.join(PROJECT_META_FILE).exists() {
      continue;
    }
    if let Ok(record) = project_record_from_dir(&path) {
      projects.push(record);
    }
  }

  projects.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
  Ok(projects)
}

#[tauri::command]
fn create_project(
  workspace_root: String,
  name: String,
  slug: String,
  site_url: String,
) -> Result<ProjectRecord, String> {
  let workspace = PathBuf::from(workspace_root);
  if !workspace.exists() {
    fs::create_dir_all(&workspace)
      .map_err(|err| format!("Failed creating workspace {}: {}", workspace.display(), err))?;
  }
  if !workspace.is_dir() {
    return Err("Workspace root must be a directory".to_string());
  }

  let normalized_slug = normalize_slug(&slug);
  if normalized_slug.is_empty() {
    return Err("Project slug is required".to_string());
  }
  let project_dir = workspace.join(format!("{}.manifold", normalized_slug));
  if project_dir.exists() {
    return Err(format!("Project {} already exists", project_dir.display()));
  }

  fs::create_dir_all(&project_dir)
    .map_err(|err| format!("Failed creating project {}: {}", project_dir.display(), err))?;

  let timestamp = now_iso();
  let metadata = ProjectMetadata {
    name: name.trim().to_string(),
    slug: normalized_slug,
    site_url: normalize_site_url(&site_url),
    created_at: timestamp.clone(),
    updated_at: timestamp,
  };
  write_project_metadata(&project_dir, &metadata)?;
  let builder_doc = default_builder_doc(&metadata);
  persist_builder_doc(&project_dir, &builder_doc)?;
  project_record_from_dir(&project_dir)
}

#[tauri::command]
fn update_project_site_url(project_path: String, site_url: String) -> Result<ProjectRecord, String> {
  let project_dir = PathBuf::from(project_path);
  if !project_dir.is_dir() {
    return Err("Project path is invalid".to_string());
  }
  let mut metadata = read_project_metadata(&project_dir)?;
  metadata.site_url = normalize_site_url(&site_url);
  metadata.updated_at = now_iso();
  write_project_metadata(&project_dir, &metadata)?;
  project_record_from_dir(&project_dir)
}

#[tauri::command]
fn pick_workspace_directory() -> Option<String> {
  rfd::FileDialog::new()
    .set_title("Select Manifold Workspace Folder")
    .pick_folder()
    .and_then(|path| path.to_str().map(|value| value.to_string()))
}

#[tauri::command]
fn load_builder_project(project_path: String) -> Result<BuilderProjectDoc, String> {
  let project_dir = PathBuf::from(project_path);
  if !project_dir.is_dir() {
    return Err("Project path is invalid".to_string());
  }
  load_builder_doc(&project_dir)
}

#[tauri::command]
fn save_builder_project(project_path: String, document: BuilderProjectDoc) -> Result<(), String> {
  let project_dir = PathBuf::from(project_path);
  if !project_dir.is_dir() {
    return Err("Project path is invalid".to_string());
  }
  persist_builder_doc(&project_dir, &document)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::default().build())
    .invoke_handler(tauri::generate_handler![
      list_projects,
      create_project,
      update_project_site_url,
      pick_workspace_directory,
      load_builder_project,
      save_builder_project
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
