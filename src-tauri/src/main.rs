#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use std::{fs, fs::File, io::BufReader, path::Path, path::PathBuf};
use anyhow::Result;
use rayon::prelude::*;
use parking_lot::Mutex;
use exif::{In, Tag, Reader as ExifReader};

#[derive(Serialize, Clone)]
pub struct PhotoItem {
  pub path: String,
  pub width: u32,
  pub height: u32,
  pub orientation: String, // "landscape" | "portrait" | "square"
}

#[derive(Serialize, Clone, Default)]
pub struct ExifData {
  pub camera_make: Option<String>,
  pub camera_model: Option<String>,
  pub lens: Option<String>,
  pub focal_length: Option<String>,
  pub aperture: Option<String>,
  pub shutter_speed: Option<String>,
  pub iso: Option<String>,
  pub date_taken: Option<String>,
  pub exposure_compensation: Option<String>,
  pub flash: Option<String>,
  pub white_balance: Option<String>,
  pub metering_mode: Option<String>,
  pub file_size: Option<String>,
}

#[derive(Serialize, Clone)]
pub struct BatchMoveResult {
  pub success: Vec<String>,
  pub failed: Vec<String>,
}

const SUPPORTED_EXTENSIONS: &[&str] = &["jpg", "jpeg", "png", "webp", "tif", "tiff", "bmp"];

#[inline]
fn get_orientation(w: u32, h: u32) -> &'static str {
  if w > h { "landscape" }
  else if h > w { "portrait" }
  else { "square" }
}

#[inline]
fn is_supported_image(path: &Path) -> bool {
  path.extension()
    .and_then(|s| s.to_str())
    .map(|ext| SUPPORTED_EXTENSIONS.contains(&ext.to_lowercase().as_str()))
    .unwrap_or(false)
}

/// Fast dimension reading using imagesize crate (reads only header bytes)
fn get_fast_dimensions(path: &Path) -> Option<(u32, u32)> {
  imagesize::size(path)
    .ok()
    .map(|size| (size.width as u32, size.height as u32))
}

#[tauri::command]
fn list_images(dir: String) -> Result<Vec<PhotoItem>, String> {
  let dir_path = Path::new(&dir);
  
  // Collect all image paths first
  let entries: Vec<PathBuf> = fs::read_dir(dir_path)
    .map_err(|e| e.to_string())?
    .filter_map(|e| e.ok())
    .map(|e| e.path())
    .filter(|p| p.is_file() && is_supported_image(p))
    .collect();

  // Process images in parallel using rayon
  let items: Vec<PhotoItem> = entries
    .par_iter()
    .filter_map(|p| {
      get_fast_dimensions(p).map(|(w, h)| PhotoItem {
        path: p.to_string_lossy().into_owned(),
        width: w,
        height: h,
        orientation: get_orientation(w, h).to_string(),
      })
    })
    .collect();

  Ok(items)
}

#[tauri::command]
fn list_images_recursive(dir: String, max_depth: Option<usize>) -> Result<Vec<PhotoItem>, String> {
  let depth = max_depth.unwrap_or(3);
  
  let entries: Vec<PathBuf> = walkdir::WalkDir::new(&dir)
    .max_depth(depth)
    .into_iter()
    .filter_map(|e| e.ok())
    .filter(|e| e.file_type().is_file())
    .map(|e| e.into_path())
    .filter(|p| is_supported_image(p))
    .collect();

  let items: Vec<PhotoItem> = entries
    .par_iter()
    .filter_map(|p| {
      get_fast_dimensions(p).map(|(w, h)| PhotoItem {
        path: p.to_string_lossy().into_owned(),
        width: w,
        height: h,
        orientation: get_orientation(w, h).to_string(),
      })
    })
    .collect();

  Ok(items)
}

#[tauri::command]
fn move_file(src: String, dest_dir: String) -> Result<String, String> {
  let src_path = Path::new(&src);
  let file_name = src_path.file_name().ok_or("Invalid file")?;
  fs::create_dir_all(&dest_dir).map_err(|e| e.to_string())?;
  
  let dest_path = Path::new(&dest_dir).join(file_name);
  
  // Try rename first (fastest, same filesystem)
  if fs::rename(&src_path, &dest_path).is_ok() {
    return Ok(dest_path.to_string_lossy().into_owned());
  }
  
  // Fallback to copy+delete for cross-filesystem moves
  fs::copy(&src_path, &dest_path).map_err(|e| e.to_string())?;
  fs::remove_file(&src_path).map_err(|e| e.to_string())?;
  
  Ok(dest_path.to_string_lossy().into_owned())
}

#[tauri::command]
fn batch_move_files(files: Vec<String>, dest_dir: String) -> Result<BatchMoveResult, String> {
  fs::create_dir_all(&dest_dir).map_err(|e| e.to_string())?;
  
  let success = Mutex::new(Vec::new());
  let failed = Mutex::new(Vec::new());
  
  files.par_iter().for_each(|src| {
    let src_path = Path::new(src);
    if let Some(file_name) = src_path.file_name() {
      let dest_path = Path::new(&dest_dir).join(file_name);
      
      let moved = fs::rename(&src_path, &dest_path).is_ok() || 
        (fs::copy(&src_path, &dest_path).is_ok() && fs::remove_file(&src_path).is_ok());
      
      if moved {
        success.lock().push(src.clone());
      } else {
        failed.lock().push(src.clone());
      }
    } else {
      failed.lock().push(src.clone());
    }
  });

  Ok(BatchMoveResult {
    success: success.into_inner(),
    failed: failed.into_inner(),
  })
}

#[tauri::command]
fn get_image_count(dir: String) -> Result<usize, String> {
  let count = fs::read_dir(&dir)
    .map_err(|e| e.to_string())?
    .filter_map(|e| e.ok())
    .filter(|e| e.path().is_file() && is_supported_image(&e.path()))
    .count();
  
  Ok(count)
}

#[tauri::command]
fn get_exif_data(path: String) -> Result<ExifData, String> {
  let file = File::open(&path).map_err(|e| e.to_string())?;
  let file_size = file.metadata().map(|m| format_file_size(m.len())).ok();
  
  let mut reader = BufReader::new(file);
  let exif = ExifReader::new().read_from_container(&mut reader);
  
  let mut data = ExifData::default();
  data.file_size = file_size;
  
  if let Ok(exif) = exif {
    // Camera info
    if let Some(field) = exif.get_field(Tag::Make, In::PRIMARY) {
      data.camera_make = Some(field.display_value().to_string().trim_matches('"').to_string());
    }
    if let Some(field) = exif.get_field(Tag::Model, In::PRIMARY) {
      data.camera_model = Some(field.display_value().to_string().trim_matches('"').to_string());
    }
    if let Some(field) = exif.get_field(Tag::LensModel, In::PRIMARY) {
      data.lens = Some(field.display_value().to_string().trim_matches('"').to_string());
    }
    
    // Exposure settings
    if let Some(field) = exif.get_field(Tag::FocalLength, In::PRIMARY) {
      data.focal_length = Some(field.display_value().to_string());
    }
    if let Some(field) = exif.get_field(Tag::FNumber, In::PRIMARY) {
      data.aperture = Some(format!("f/{}", field.display_value()));
    }
    if let Some(field) = exif.get_field(Tag::ExposureTime, In::PRIMARY) {
      data.shutter_speed = Some(format!("{} s", field.display_value()));
    }
    if let Some(field) = exif.get_field(Tag::PhotographicSensitivity, In::PRIMARY) {
      data.iso = Some(format!("ISO {}", field.display_value()));
    }
    if let Some(field) = exif.get_field(Tag::ExposureBiasValue, In::PRIMARY) {
      data.exposure_compensation = Some(format!("{} EV", field.display_value()));
    }
    
    // Date
    if let Some(field) = exif.get_field(Tag::DateTimeOriginal, In::PRIMARY) {
      data.date_taken = Some(field.display_value().to_string().trim_matches('"').to_string());
    }
    
    // Other settings
    if let Some(field) = exif.get_field(Tag::Flash, In::PRIMARY) {
      data.flash = Some(field.display_value().to_string());
    }
    if let Some(field) = exif.get_field(Tag::WhiteBalance, In::PRIMARY) {
      data.white_balance = Some(field.display_value().to_string());
    }
    if let Some(field) = exif.get_field(Tag::MeteringMode, In::PRIMARY) {
      data.metering_mode = Some(field.display_value().to_string());
    }
  }
  
  Ok(data)
}

fn format_file_size(bytes: u64) -> String {
  const KB: u64 = 1024;
  const MB: u64 = KB * 1024;
  const GB: u64 = MB * 1024;
  
  if bytes >= GB {
    format!("{:.2} GB", bytes as f64 / GB as f64)
  } else if bytes >= MB {
    format!("{:.2} MB", bytes as f64 / MB as f64)
  } else if bytes >= KB {
    format!("{:.2} KB", bytes as f64 / KB as f64)
  } else {
    format!("{} B", bytes)
  }
}

#[tauri::command]
fn delete_file(path: String) -> Result<(), String> {
  let file_path = Path::new(&path);
  if !file_path.exists() {
    return Err("File not found".to_string());
  }
  fs::remove_file(file_path).map_err(|e| e.to_string())
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      list_images, 
      list_images_recursive,
      move_file, 
      batch_move_files,
      get_image_count,
      get_exif_data,
      delete_file
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri app");
}
