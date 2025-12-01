# 📸 PhotoSorter

A modern, high-performance desktop photo organization application built with **Tauri**, **React**, and **Rust**. Efficiently sort your photos into Landscape, Portrait, Favorite, and Reject categories with lightning-fast keyboard shortcuts, zoom capabilities, EXIF data display, and a beautiful dark theme interface.

![PhotoSorter Demo](https://via.placeholder.com/800x450/0f0f23/6366f1?text=PhotoSorter+Desktop+App)

## ✨ Features

### 🖼️ **Image-Focused Design**
- **Large image display** with optimal viewing experience
- **Zoom & Pan** - Click to zoom, scroll to adjust, drag to pan
- **Smart navigation** with overlay arrows and keyboard controls
- **Modern dark theme** with purple/blue accent colors
- **Responsive layout** that adapts to different screen sizes

### ⚡ **High Performance**
- **Parallel image processing** with Rayon for multi-core utilization
- **Fast dimension reading** using imagesize (header-only parsing)
- **Virtual scrolling** for thumbnail grid (handles 1000+ photos)
- **Image caching** system for faster loading
- **Preloading** next/previous images for seamless navigation

### 📷 **EXIF Data Display**
- **Camera info** - Make, Model, Lens
- **Exposure settings** - Aperture, Shutter Speed, ISO, Focal Length
- **Date taken** and other metadata
- **File size** information
- All displayed in the sidebar alongside file details

### 🔀 **Compare Mode**
- **Side-by-side comparison** of two photos
- Press `C` to enter compare mode
- Select second photo from thumbnails
- Press `1` or `2` to keep preferred photo

### 📂 **Subfolder Scanning**
- **Include Subfolders** toggle in sidebar
- Recursively scan directories up to 5 levels deep
- Perfect for organized photo libraries

### ⌨️ **Keyboard-First Workflow**
| Key | Action |
|-----|--------|
| `←` `→` | Navigate between photos |
| `J` | Sort as **Landscape** |
| `K` | Sort as **Portrait** |
| `F` | Sort as **Favorite** ⭐ |
| `X` | Sort as **Reject** |
| `D` / `Delete` | **Delete permanently** |
| `S` | **Skip** current photo |
| `Z` | **Undo** last action |
| `C` | Enter **Compare** mode |
| `+` `-` `0` | Zoom controls (in zoom view) |
| `ESC` | Close zoom/compare view |

### 🗂️ **Smart Organization**
- **On-demand folder creation** (folders only created when files are moved)
- **Four categories**: Landscape, Portrait, Favorite, Reject
- **Undo functionality** with complete history tracking (up to 100 actions)
- **Progress tracking** with visual progress bar
- **Permanent delete** option with confirmation dialog

### 🛠️ **Built with Modern Technology**
- **Tauri** - Secure, fast desktop app framework
- **React 18** - Modern UI with TypeScript
- **Rust** - High-performance backend with parallel processing
- **Vite** - Lightning-fast development experience

## 🚀 Quick Start

### Prerequisites

#### For Users (Download & Run)
- **Windows 10/11** (x64)
- **Microsoft Edge WebView2 Runtime** (bundled with installer)

#### For Developers
- **Node.js** (v18 or higher)
- **Rust** (latest stable with GNU toolchain)
- **Tauri CLI**: Included in devDependencies

### Installation

#### Option 1: Download Pre-built (Recommended)
1. **Download** from [Releases](https://github.com/NazwanSM/photosorter/releases)
2. **Run installer**: `PhotoSorter_1.0.0_x64-setup.exe` (includes WebView2)
3. **Launch** PhotoSorter from Start Menu

> 📦 **Installer Size**: ~186 MB (includes WebView2 runtime)

#### Option 2: Build from Source

1. **Clone the repository**
   ```bash
   git clone https://github.com/NazwanSM/photosorter.git
   cd photosorter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run tauri:dev
   ```

4. **Build for production**
   ```bash
   npm run tauri:build
   ```

   Output will be in `src-tauri/target/x86_64-pc-windows-gnu/release/bundle/`

## 📖 How to Use

### 1. **Select Photo Folder**
- Click **"📁 Select Folder"** button
- Optionally enable **"📂 Include Subfolders"** toggle
- Choose a directory containing your photos
- The app will automatically scan for image files (JPG, PNG, WebP, TIFF, BMP)

### 2. **View Photo Details**
- **File Details** panel shows name, resolution, orientation, progress
- **EXIF Data** displays camera info, exposure settings, date taken
- Click on the main image to **zoom in** for detailed inspection

### 3. **Sort Your Photos**
- **Navigate**: Use arrow keys or click navigation overlays
- **Sort**: Press keyboard shortcuts or click action buttons
  - `J` → Landscape folder
  - `K` → Portrait folder
  - `F` → Favorite folder ⭐
  - `X` → Reject folder
- **Skip**: Press `S` to skip without sorting
- **Delete**: Press `D` to permanently delete (with confirmation)
- **Undo**: Press `Z` to undo the last move action

### 4. **Compare Photos**
- Press `C` to enter compare mode with current photo
- Click another thumbnail to compare side-by-side
- Press `1` to keep left photo, `2` to keep right photo
- Press `ESC` to exit without action

### 5. **Results**
Your sorted photos will be organized into:
```
📁 Original Folder/
  📁 Landscape/     # Horizontal photos (J)
  📁 Portrait/      # Vertical photos (K)
  📁 Favorite/      # Best shots (F) ⭐
  📁 Reject/        # Photos to review/delete (X)
```

> 💡 Folders are only created when you move the first file to them

## 🎨 User Interface

### **Main Layout**
- **Left Sidebar**: Controls, shortcuts, file info, and EXIF data (scrollable)
- **Center Area**: Large image display with zoom capability
- **Right Panel**: Thumbnail queue with virtual scrolling

### **Color Scheme**
- **Primary Background**: Deep dark blue (`#0f0f23`)
- **Secondary**: Darker blue (`#1a1a2e`) 
- **Accent**: Purple/blue gradient (`#6366f1` → `#8b5cf6`)
- **Text**: High contrast white/gray for readability
- **Custom Scrollbars**: Subtle, matching theme

### **Interactive Elements**
- **Smooth animations** for all interactions
- **Hover effects** with scale and shadow
- **Loading states** with progress indicators
- **Zoom controls** with mouse wheel, buttons, and gestures

## 🔧 Technical Details

### **Frontend (React + TypeScript)**
- **Virtual Scrolling**: Handles thousands of thumbnails efficiently
- **Memoization**: useCallback, useMemo for optimal re-renders
- **Image Preloading**: Smart preloader for adjacent images
- **Responsive Design**: Adapts to different window sizes

### **Backend (Rust + Tauri)**
- **Parallel Processing**: Rayon for multi-core image scanning
- **EXIF Reading**: kamadak-exif crate for metadata extraction
- **Fast Dimensions**: imagesize crate (header-only, no full decode)
- **Recursive Scanning**: walkdir with configurable depth
- **Safe File Operations**: Atomic moves with fallback to copy+delete

### **Performance Optimizations**
- **LTO** (Link-Time Optimization) enabled
- **Single codegen unit** for maximum optimization
- **Strip symbols** for smaller binary
- **Panic abort** to reduce binary size

## 📊 Supported Formats

| Format | Extension | EXIF Support |
|--------|-----------|--------------|
| JPEG | .jpg, .jpeg | ✅ Full |
| PNG | .png | ❌ No |
| WebP | .webp | ❌ No |
| TIFF | .tif, .tiff | ✅ Full |
| BMP | .bmp | ❌ No |

## 🛡️ Security & Permissions

PhotoSorter uses Tauri's security model with minimal required permissions:

- **File System**: Read/write access to selected directories only
- **Dialog**: Native file/folder selection dialogs
- **No Network**: Completely offline application
- **No Telemetry**: Your photos stay private

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Development Commands**
```bash
# Install dependencies
npm install

# Start development server (hot reload)
npm run tauri:dev

# Build for production
npm run tauri:build

# Build with debug symbols
npm run tauri:build:debug

# Lint code
npm run lint
```

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tauri Team** - Amazing desktop app framework
- **React Team** - Excellent UI library
- **Rust Community** - Fast and safe systems programming
- **kamadak-exif** - EXIF metadata parsing
- **Rayon** - Data parallelism library

---

<div align="center">

**Made with ❤️ for photographers and digital organizers**

[![GitHub stars](https://img.shields.io/github/stars/NazwanSM/photosorter?style=social)](https://github.com/NazwanSM/photosorter/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/NazwanSM/photosorter?style=social)](https://github.com/NazwanSM/photosorter/network/members)
[![GitHub license](https://img.shields.io/github/license/NazwanSM/photosorter)](https://github.com/NazwanSM/photosorter/blob/main/LICENSE)

</div>
