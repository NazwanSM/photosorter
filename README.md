# 📸 PhotoSorter

A modern, desktop photo organization application built with **Tauri**, **React**, and **Rust**. Efficiently sort your photos into Landscape, Portrait, and Reject categories with lightning-fast keyboard shortcuts and a beautiful dark theme interface.

![PhotoSorter Demo](https://via.placeholder.com/800x450/0f0f23/6366f1?text=PhotoSorter+Desktop+App)

## ✨ Features

### 🖼️ **Image-Focused Design**
- **Large image display** with optimal viewing experience
- **Smart navigation** with overlay arrows and keyboard controls
- **Modern dark theme** with purple/blue accent colors
- **Responsive layout** that adapts to different screen sizes

### ⚡ **High Performance**
- **Image caching** system for faster loading
- **Lazy loading** for thumbnails to handle hundreds of photos
- **Preloading** next/previous images for seamless navigation
- **Optimized rendering** with React performance best practices

### ⌨️ **Keyboard-First Workflow**
- `←` `→` Navigate between photos
- `J` Sort as **Landscape**
- `K` Sort as **Portrait** 
- `X` Sort as **Reject**
- `S` **Skip** current photo
- `Z` **Undo** last action

### 🗂️ **Smart Organization**
- **Automatic folder creation** (Landscape, Portrait, Reject)
- **Undo functionality** with complete history tracking
- **Progress tracking** with visual progress bar
- **Batch processing** for photographer workflows

### 🛠️ **Built with Modern Technology**
- **Tauri** - Secure, fast desktop app framework
- **React** - Modern UI with TypeScript
- **Rust** - High-performance backend for file operations
- **Vite** - Lightning-fast development experience

## 🚀 Quick Start

### Prerequisites

#### For Users (Download & Run)
- **Windows 10/11** (x64)
- **Microsoft Edge WebView2 Runtime** (auto-installed with installer)

#### For Developers
- **Node.js** (v16 or higher)
- **Rust** (latest stable)
- **Tauri CLI**: `npm install -g @tauri-apps/cli`

### Installation

#### Option 1: Download Pre-built (Recommended)
1. **Download** from [Releases](https://github.com/NazwanSM/photosorter/releases)
2. **Run installer**: `PhotoSorter_0.1.0_x64-setup.exe` (auto-installs WebView2)
3. **Or use portable**: `PhotoSorter-Portable.exe` (requires manual WebView2 install)

> ⚠️ **WebView2 Required**: If you get "WebView2Loader.dll not found" error, see [WebView2 Installation Guide](WEBVIEW2_INSTALL.md)

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

## 📖 How to Use

### 1. **Select Photo Folder**
- Click **"📁 Select Folder"** button
- Choose a directory containing your photos
- The app will automatically scan for image files

### 2. **Sort Your Photos**
- **View**: Large image display shows current photo
- **Navigate**: Use arrow keys or click navigation overlays
- **Sort**: Press `J` (Landscape), `K` (Portrait), or `X` (Reject)
- **Skip**: Press `S` to skip without sorting
- **Undo**: Press `Z` to undo the last action

### 3. **Track Progress**
- **Progress bar** at top shows completion status
- **Thumbnail panel** displays all photos with current selection
- **File info** shows photo details and current position

### 4. **Results**
Your sorted photos will be organized into:
```
📁 Original Folder/
  📁 Landscape/     # Horizontal photos
  📁 Portrait/      # Vertical photos  
  📁 Reject/        # Photos to delete/review
```

## 🎨 User Interface

### **Main Layout**
- **Left Sidebar**: Controls, shortcuts, and photo information
- **Center Area**: Large image display with navigation
- **Right Panel**: Thumbnail queue with grid view

### **Color Scheme**
- **Primary Background**: Deep dark blue (`#0f0f23`)
- **Secondary**: Darker blue (`#1a1a2e`) 
- **Accent**: Purple/blue gradient (`#6366f1` → `#8b5cf6`)
- **Text**: High contrast white/gray for readability

### **Interactive Elements**
- **Smooth animations** for all interactions
- **Hover effects** with scale and shadow
- **Loading states** with progress indicators
- **Error handling** with fallback displays

## 🔧 Technical Details

### **Frontend (React + TypeScript)**
- **Component Architecture**: Functional components with hooks
- **State Management**: React useState with optimization
- **Performance**: useCallback, useMemo, lazy loading
- **Styling**: CSS custom properties with modern features

### **Backend (Rust + Tauri)**
- **File Operations**: Fast, safe file system access
- **Image Processing**: Metadata extraction and validation
- **Security**: Tauri's security model with scoped permissions
- **Cross-Platform**: Works on Windows, macOS, and Linux

### **Build System**
- **Vite**: Fast development server and build tool
- **Tauri Build**: Optimized desktop app packaging
- **TypeScript**: Full type safety across the application
- **ESLint**: Code quality and consistency

## 📊 Performance Features

### **Memory Optimization**
- **Limited thumbnail rendering** (max 50 visible)
- **Image caching** to prevent redundant loading
- **Garbage collection** for unused resources

### **Loading Optimization**
- **Lazy loading** for off-screen thumbnails
- **Preloading** for upcoming images
- **Progressive loading** with opacity transitions

### **Rendering Optimization**
- **CSS containment** for layout optimization
- **Hardware acceleration** with transform3d
- **Debounced scroll** handling for smooth performance

## 🛡️ Security & Permissions

PhotoSorter uses Tauri's security model with minimal required permissions:

- **File System**: Read/write access to selected directories only
- **Dialog**: Native file/folder selection dialogs
- **No Network**: Completely offline application
- **Sandboxed**: Rust backend provides memory safety

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Development Setup**
```bash
# Clone your fork
git clone https://github.com/NazwanSM/photosorter.git

# Install dependencies
npm install

# Start development server
npm run tauri:dev

# Run tests
npm run test

# Lint code
npm run lint
```

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tauri Team** - Amazing desktop app framework
- **React Team** - Excellent UI library
- **Rust Community** - Fast and safe systems programming
- **Photography Community** - Inspiration for workflow optimization

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/NazwanSM/photosorter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/NazwanSM/photosorter/discussions)
- **Email**: your.email@example.com

---

<div align="center">

**Made with ❤️ for photographers and digital organizers**

[![GitHub stars](https://img.shields.io/github/stars/NazwanSM/photosorter?style=social)](https://github.com/NazwanSM/photosorter/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/NazwanSM/photosorter?style=social)](https://github.com/NazwanSM/photosorter/network/members)
[![GitHub license](https://img.shields.io/github/license/NazwanSM/photosorter)](https://github.com/NazwanSM/photosorter/blob/main/LICENSE)

</div>
