# WebView2 Installation Guide

## 🔧 Prerequisites for PhotoSorter

PhotoSorter requires **Microsoft Edge WebView2 Runtime** to function properly on Windows.

### Automatic Installation (Recommended)

The latest PhotoSorter installer (`PhotoSorter_0.1.0_x64-setup.exe`) will automatically download and install WebView2 if it's missing.

### Manual Installation

If you encounter the error: **"WebView2Loader.dll was not found"**, you need to install WebView2:

#### Option 1: Using Windows Package Manager
```powershell
winget install Microsoft.EdgeWebView2Runtime
```

#### Option 2: Direct Download
1. Visit: https://developer.microsoft.com/microsoft-edge/webview2/
2. Download **Evergreen Standalone Installer**
3. Run the installer as Administrator

#### Option 3: Using Chocolatey
```powershell
choco install webview2
```

### Verification

After installation, you can verify WebView2 is installed by checking:
- **Apps & Features** → Look for "Microsoft Edge WebView2 Runtime"
- **Registry**: `HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}`

### System Requirements

- **OS**: Windows 7 SP1, Windows 8.1, Windows 10, Windows 11
- **Architecture**: x64, x86, ARM64
- **Size**: ~179 MB download

### Troubleshooting

If you still encounter issues:

1. **Restart your computer** after WebView2 installation
2. **Run as Administrator** - Right-click PhotoSorter.exe → "Run as administrator"
3. **Check Windows Updates** - Ensure your Windows is up to date
4. **Antivirus**: Temporarily disable antivirus during installation

### For Developers

If you're building PhotoSorter from source:
- WebView2 is automatically configured in `tauri.conf.json`
- Build process includes WebView2 bootstrapper
- No additional setup required

### Support

If you continue to experience issues, please:
1. Check your Windows version compatibility
2. Ensure you have administrator privileges
3. Contact support with your error details

---

**Note**: WebView2 is a Microsoft component that enables modern web technologies in desktop applications. It's safe and widely used by many applications.
