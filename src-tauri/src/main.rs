#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use std::{fs, path::Path};
use anyhow::Result;

#[derive(Serialize, Clone)]
pub struct PhotoItem {
  pub path: String,
  pub width: u32,
  pub height: u32,
  pub orientation: String, // "landscape" | "portrait" | "square"
}

fn get_orientation(w: u32, h: u32) -> String {
  if w > h { "landscape".into() }
  else if h > w { "portrait".into() }
  else { "square".into() }
}

#[tauri::command]
fn list_images(dir: String) -> Result<Vec<PhotoItem>, String> {
  let mut out = Vec::new();
  let entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;
  for e in entries {
    let p = e.map_err(|e| e.to_string())?.path();
    let ext = p.extension().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();
    if !["jpg","jpeg","png","webp","tif","tiff","bmp"].contains(&ext.as_str()) { continue; }
    if let Ok((w,h)) = image::image_dimensions(&p) {
      out.push(PhotoItem {
        path: p.to_string_lossy().into(),
        width: w,
        height: h,
        orientation: get_orientation(w,h),
      });
    }
  }
  Ok(out)
}

#[tauri::command]
fn move_file(src: String, dest_dir: String) -> Result<(), String> {
  let src_path = Path::new(&src);
  let file_name = src_path.file_name().ok_or("Invalid file")?;
  fs::create_dir_all(&dest_dir).map_err(|e| e.to_string())?;
  let dest_path = Path::new(&dest_dir).join(file_name);
  fs::rename(&src_path, &dest_path).map_err(|e| e.to_string())?;
  Ok(())
}

#[tauri::command]
fn ensure_dirs(base: String) -> Result<(), String> {
  for d in ["Landscape","Portrait","Reject"] {
    let p = Path::new(&base).join(d);
    if let Err(e) = fs::create_dir_all(&p) { return Err(e.to_string()); }
  }
  Ok(())
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![list_images, move_file, ensure_dirs])
    .run(tauri::generate_context!())
    .expect("error while running tauri app");
}
