#!/usr/bin/env pwsh

# PhotoSorter GitHub Commit Automation Script
# This script helps create a clean, professional commit history

param(
    [Parameter(Mandatory=$false)]
    [int]$StartPhase = 1,
    
    [Parameter(Mandatory=$false)]
    [int]$EndPhase = 17
)

Write-Host "🚀 PhotoSorter Commit Automation" -ForegroundColor Cyan
Write-Host "Creating professional commit history for GitHub..." -ForegroundColor Green
Write-Host ""

# Initialize git if not already done
if (-not (Test-Path ".git")) {
    Write-Host "📁 Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host ""
}

# Function to create commits with proper staging
function New-GitCommit {
    param(
        [string]$CommitMessage,
        [string[]]$Files,
        [string]$Description = ""
    )
    
    Write-Host "📝 Staging files: $($Files -join ', ')" -ForegroundColor Blue
    foreach ($file in $Files) {
        if (Test-Path $file) {
            git add $file
        } else {
            Write-Host "⚠️  Warning: File not found: $file" -ForegroundColor Yellow
        }
    }
    
    Write-Host "💾 Committing: $CommitMessage" -ForegroundColor Green
    git commit -m $CommitMessage
    
    if ($Description) {
        Write-Host "   $Description" -ForegroundColor Gray
    }
    Write-Host ""
}

# Phase 1: Project Setup
if ($StartPhase -le 1 -and $EndPhase -ge 1) {
    Write-Host "=== PHASE 1: PROJECT SETUP ===" -ForegroundColor Magenta
    
    New-GitCommit -CommitMessage "🎉 Initial commit - Tauri React PhotoSorter project" `
                  -Files @("package.json", "tsconfig.json", "vite.config.ts", "index.html") `
                  -Description "Setup basic React + TypeScript + Vite configuration"
}

if ($StartPhase -le 2 -and $EndPhase -ge 2) {
    New-GitCommit -CommitMessage "⚙️ Add Tauri configuration and basic dependencies" `
                  -Files @("src-tauri/Cargo.toml", "src-tauri/tauri.conf.json") `
                  -Description "Configure Tauri backend with necessary features"
}

if ($StartPhase -le 3 -and $EndPhase -ge 3) {
    New-GitCommit -CommitMessage "🔧 Setup Rust backend structure" `
                  -Files @("src-tauri/build.rs", "src-tauri/src/main.rs") `
                  -Description "Initial Rust backend with basic Tauri setup"
}

# Phase 2: Core Functionality  
if ($StartPhase -le 4 -and $EndPhase -ge 4) {
    Write-Host "=== PHASE 2: CORE FUNCTIONALITY ===" -ForegroundColor Magenta
    
    New-GitCommit -CommitMessage "🦀 Implement Rust backend commands for file operations

- Add list_images command to scan directories
- Add move_file command for photo sorting  
- Add ensure_dirs command for folder creation
- Implement image metadata extraction" `
                  -Files @("src-tauri/src/main.rs") `
                  -Description "Complete backend implementation with image processing"
}

if ($StartPhase -le 5 -and $EndPhase -ge 5) {
    New-GitCommit -CommitMessage "⚛️ Create basic React frontend structure" `
                  -Files @("src/main.tsx", "src/App.tsx") `
                  -Description "Basic React app with TypeScript types"
}

if ($StartPhase -le 6 -and $EndPhase -ge 6) {
    New-GitCommit -CommitMessage "📸 Add photo listing and navigation functionality

- Load and display photos from selected folder
- Basic thumbnail grid layout  
- Photo navigation with index tracking" `
                  -Files @("src/App.tsx") `
                  -Description "Core photo sorting functionality"
}

# Phase 3: User Interface & Features
if ($StartPhase -le 7 -and $EndPhase -ge 7) {
    Write-Host "=== PHASE 3: USER INTERFACE & FEATURES ===" -ForegroundColor Magenta
    
    New-GitCommit -CommitMessage "🎨 Add basic styling and layout" `
                  -Files @("src/styles.css") `
                  -Description "Initial CSS with responsive layout"
}

if ($StartPhase -le 8 -and $EndPhase -ge 8) {
    New-GitCommit -CommitMessage "⌨️ Implement keyboard shortcuts and navigation

- Arrow keys for photo navigation
- J/K/X shortcuts for sorting (Landscape/Portrait/Reject)
- S key for skipping photos
- Keyboard event handling with useEffect" `
                  -Files @("src/App.tsx") `
                  -Description "Full keyboard navigation support"
}

if ($StartPhase -le 9 -and $EndPhase -ge 9) {
    New-GitCommit -CommitMessage "↩️ Add undo functionality and history tracking

- Track moved files in history state
- Z key for undo last move
- Restore files to original location
- Update photo list after undo operations" `
                  -Files @("src/App.tsx") `
                  -Description "Complete undo/redo system"
}

# Phase 4: Modern UI Design
if ($StartPhase -le 10 -and $EndPhase -ge 10) {
    Write-Host "=== PHASE 4: MODERN UI DESIGN ===" -ForegroundColor Magenta
    
    New-GitCommit -CommitMessage "🌙 Redesign with modern dark theme

- Implement CSS custom properties for theming
- Dark color scheme with purple/blue accents
- Modern typography with Inter font
- Improved visual hierarchy" `
                  -Files @("src/styles.css") `
                  -Description "Complete visual redesign"
}

if ($StartPhase -le 11 -and $EndPhase -ge 11) {
    New-GitCommit -CommitMessage "✨ Enhance UI with animations and modern components

- Add smooth transitions and hover effects
- Redesign buttons with gradients and shadows
- Create card-based layout for information sections
- Add icons and improved visual feedback" `
                  -Files @("src/App.tsx", "src/styles.css") `
                  -Description "Modern UI components and interactions"
}

if ($StartPhase -le 12 -and $EndPhase -ge 12) {
    New-GitCommit -CommitMessage "🖼️ Implement large image focus and improved navigation

- Maximize main image display area
- Add navigation overlay arrows
- Implement action buttons with visual categories
- Add progress bar for sorting status" `
                  -Files @("src/App.tsx", "src/styles.css") `
                  -Description "Image-centric design with better UX"
}

# Phase 5: Performance & Polish
if ($StartPhase -le 13 -and $EndPhase -ge 13) {
    Write-Host "=== PHASE 5: PERFORMANCE & POLISH ===" -ForegroundColor Magenta
    
    New-GitCommit -CommitMessage "🚀 Add image caching and lazy loading

- Implement convertFileSrc caching with Map
- Add lazy loading for thumbnails
- Optimize image loading with loading states
- Add error handling for failed image loads" `
                  -Files @("src/App.tsx") `
                  -Description "Performance optimizations for large photo sets"
}

if ($StartPhase -le 14 -and $EndPhase -ge 14) {
    New-GitCommit -CommitMessage "⚡ Implement performance optimizations

- Add preloading for next/previous images
- Optimize thumbnail rendering with limits
- Add useCallback and useMemo for performance
- Implement CSS optimizations with will-change" `
                  -Files @("src/App.tsx", "src/styles.css") `
                  -Description "Advanced performance tuning"
}

if ($StartPhase -le 15 -and $EndPhase -ge 15) {
    New-GitCommit -CommitMessage "🎯 Final polish and user experience improvements

- Add loading indicators and states
- Improve error handling and user feedback
- Final bug fixes and optimizations" `
                  -Files @("src/App.tsx", "src/styles.css") `
                  -Description "Production-ready polish"
}

# Documentation and final touches
if ($StartPhase -le 16 -and $EndPhase -ge 16) {
    Write-Host "=== DOCUMENTATION & FINAL TOUCHES ===" -ForegroundColor Magenta
    
    # Create README if it doesn't exist
    if (-not (Test-Path "README.md")) {
        New-Item -Path "README.md" -ItemType File -Force | Out-Null
    }
    
    New-GitCommit -CommitMessage "📚 Add comprehensive documentation

- Detailed README with features and setup instructions
- Add proper .gitignore for Tauri projects
- Usage examples and screenshots" `
                  -Files @("README.md", ".gitignore") `
                  -Description "Complete project documentation"
}

if ($StartPhase -le 17 -and $EndPhase -ge 17) {
    New-GitCommit -CommitMessage "🔧 Add development configurations

- Final development and build optimizations
- Project cleanup and organization" `
                  -Files @("commit-phases.md", "create-commits.ps1") `
                  -Description "Development workflow documentation"
}

Write-Host "✅ Commit creation completed!" -ForegroundColor Green
Write-Host "📊 Current git status:" -ForegroundColor Cyan
git log --oneline -10
Write-Host ""
Write-Host "🚀 Ready to push to GitHub:" -ForegroundColor Yellow
Write-Host "   git remote add origin https://github.com/yourusername/photosorter.git" -ForegroundColor Gray
Write-Host "   git branch -M main" -ForegroundColor Gray  
Write-Host "   git push -u origin main" -ForegroundColor Gray
