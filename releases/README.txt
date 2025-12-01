# 📸 PhotoSorter v1.0.0 - Release

Modern desktop photo sorting application built with Tauri, React & Rust.
Optimized for performance with parallel processing and virtual scrolling.

## 🚀 Quick Start

### Option 1: NSIS Installer (Recommended) ⭐
**Double-click:** PhotoSorter_1.0.0_x64-setup.exe
- Full installation with Start Menu shortcuts
- WebView2 runtime embedded (works offline)
- Automatic updates support
- Proper Windows integration
- Size: ~2.6 MB

### Option 2: MSI Installer
**Double-click:** PhotoSorter_1.0.0_x64_en-US.msi
- Enterprise/IT admin friendly
- WebView2 runtime embedded
- Group Policy support
- Size: ~3.3 MB

## ⌨️ Keyboard Shortcuts

- ← → Navigate between photos
- J Sort as Landscape 
- K Sort as Portrait
- X Sort as Reject
- S Skip current photo
- Z Undo last action

## 📁 How It Works

1. Select Folder containing your photos
2. Review each photo in large display
3. Sort using keyboard shortcuts or buttons
4. Photos are organized into:
   - Landscape/ - Horizontal photos
   - Portrait/ - Vertical photos  
   - Reject/ - Photos to delete/review

## 🚀 Performance Optimizations

- Parallel image processing with Rayon
- Fast dimension reading (header-only)
- Virtual scrolling for thousands of photos
- Image preloading (5 next + 2 previous)
- GPU-accelerated rendering

## 🛠️ System Requirements

- Windows 10/11 (64-bit)
- 4 GB RAM minimum
- WebView2 Runtime (included in installer)

---
Built with Tauri, React, TypeScript & Rust
