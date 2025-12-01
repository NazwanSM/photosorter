import { useEffect, useState, useCallback, useMemo, useRef, memo, MouseEvent, WheelEvent, TouchEvent } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";
import { convertFileSrc } from "@tauri-apps/api/tauri";

type Orientation = "landscape" | "portrait" | "square";
type PhotoItem = { path: string; width: number; height: number; orientation: Orientation };
type ZoomState = { scale: number; x: number; y: number };

// EXIF data type
type ExifData = {
  camera_make?: string;
  camera_model?: string;
  lens?: string;
  focal_length?: string;
  aperture?: string;
  shutter_speed?: string;
  iso?: string;
  date_taken?: string;
  exposure_compensation?: string;
  flash?: string;
  white_balance?: string;
  metering_mode?: string;
  file_size?: string;
};

// Image cache for converted sources - shared across components
const srcCache = new Map<string, string>();

// Preload queue manager
class ImagePreloader {
  private queue: string[] = [];
  private loading = new Set<string>();
  private loaded = new Set<string>();
  private maxConcurrent = 3;

  add(paths: string[]) {
    for (const path of paths) {
      if (!this.loaded.has(path) && !this.loading.has(path) && !this.queue.includes(path)) {
        this.queue.push(path);
      }
    }
    this.processQueue();
  }

  private processQueue() {
    while (this.loading.size < this.maxConcurrent && this.queue.length > 0) {
      const path = this.queue.shift()!;
      this.loading.add(path);
      
      const img = new Image();
      const src = srcCache.get(path) || convertFileSrc(path);
      if (!srcCache.has(path)) srcCache.set(path, src);
      
      img.onload = () => {
        this.loading.delete(path);
        this.loaded.add(path);
        this.processQueue();
      };
      img.onerror = () => {
        this.loading.delete(path);
        this.processQueue();
      };
      img.src = src;
    }
  }

  isLoaded(path: string) {
    return this.loaded.has(path);
  }

  clear() {
    this.queue = [];
    this.loading.clear();
    this.loaded.clear();
  }
}

const preloader = new ImagePreloader();

// Zoom Viewer Component
const ZoomViewer = memo(function ZoomViewer({
  src,
  onClose
}: {
  src: string;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState<ZoomState>({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchDistance = useRef<number | null>(null);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => {
      const newScale = Math.min(Math.max(prev.scale * delta, 0.5), 10);
      return { ...prev, scale: newScale };
    });
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - zoom.x, y: e.clientY - zoom.y });
    }
  }, [zoom.x, zoom.y]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setZoom(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDistance.current = Math.sqrt(dx * dx + dy * dy);
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - zoom.x, y: e.touches[0].clientY - zoom.y });
    }
  }, [zoom.x, zoom.y]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const delta = distance / lastTouchDistance.current;
      lastTouchDistance.current = distance;
      setZoom(prev => {
        const newScale = Math.min(Math.max(prev.scale * delta, 0.5), 10);
        return { ...prev, scale: newScale };
      });
    } else if (e.touches.length === 1 && isDragging) {
      setZoom(prev => ({
        ...prev,
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      }));
    }
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    lastTouchDistance.current = null;
  }, []);

  const handleDoubleClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    if (zoom.scale > 1) {
      setZoom({ scale: 1, x: 0, y: 0 });
    } else {
      setZoom({ scale: 2.5, x: 0, y: 0 });
    }
  }, [zoom.scale]);

  const resetZoom = useCallback(() => {
    setZoom({ scale: 1, x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setZoom(prev => ({ ...prev, scale: Math.min(prev.scale * 1.3, 10) }));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => ({ ...prev, scale: Math.max(prev.scale * 0.7, 0.5) }));
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        case '0':
          resetZoom();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, zoomIn, zoomOut, resetZoom]);

  return (
    <div 
      className="zoom-overlay"
      onClick={onClose}
    >
      <div className="zoom-toolbar">
        <button className="zoom-btn" onClick={(e) => { e.stopPropagation(); zoomOut(); }} title="Zoom Out (-)">
          ➖
        </button>
        <span className="zoom-level">{Math.round(zoom.scale * 100)}%</span>
        <button className="zoom-btn" onClick={(e) => { e.stopPropagation(); zoomIn(); }} title="Zoom In (+)">
          ➕
        </button>
        <button className="zoom-btn" onClick={(e) => { e.stopPropagation(); resetZoom(); }} title="Reset (0)">
          🔄
        </button>
        <button className="zoom-btn close" onClick={onClose} title="Close (Esc)">
          ✕
        </button>
      </div>

      <div className="zoom-hint">
        Scroll to zoom • Drag to pan • Double-click to toggle zoom • Press ESC to close
      </div>

      <div
        ref={containerRef}
        className="zoom-container"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
        onClick={(e) => e.stopPropagation()}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <img
          src={src}
          alt="Zoomed view"
          className="zoom-image"
          style={{
            transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
          draggable={false}
        />
      </div>
    </div>
  );
});

// Memoized thumbnail component
// Compare Mode Component
const CompareViewer = memo(function CompareViewer({
  photo1,
  photo2,
  getImageSrc,
  onClose,
  onSelect1,
  onSelect2
}: {
  photo1: PhotoItem | null;
  photo2: PhotoItem | null;
  getImageSrc: (path: string) => string;
  onClose: () => void;
  onSelect1: () => void;
  onSelect2: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '1') onSelect1();
      if (e.key === '2') onSelect2();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onSelect1, onSelect2]);

  return (
    <div className="compare-overlay" onClick={onClose}>
      <div className="compare-toolbar">
        <span className="compare-hint">Press 1 to keep left • Press 2 to keep right • ESC to close</span>
        <button className="zoom-btn close" onClick={onClose}>✕</button>
      </div>
      <div className="compare-container" onClick={e => e.stopPropagation()}>
        <div className="compare-panel">
          {photo1 ? (
            <>
              <img src={getImageSrc(photo1.path)} alt="Compare 1" />
              <div className="compare-label">
                <span className="compare-key">1</span>
                {photo1.path.split(/[/\\]/).pop()}
              </div>
            </>
          ) : (
            <div className="compare-empty">Select first photo from thumbnails</div>
          )}
        </div>
        <div className="compare-divider" />
        <div className="compare-panel">
          {photo2 ? (
            <>
              <img src={getImageSrc(photo2.path)} alt="Compare 2" />
              <div className="compare-label">
                <span className="compare-key">2</span>
                {photo2.path.split(/[/\\]/).pop()}
              </div>
            </>
          ) : (
            <div className="compare-empty">Select second photo from thumbnails</div>
          )}
        </div>
      </div>
    </div>
  );
});

// Memoized thumbnail component
const Thumbnail = memo(function Thumbnail({ 
  photo, 
  isActive, 
  onClick, 
  index 
}: {
  photo: PhotoItem;
  isActive: boolean;
  onClick: () => void;
  index: number;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const src = useMemo(() => {
    const cached = srcCache.get(photo.path);
    if (cached) return cached;
    const newSrc = convertFileSrc(photo.path);
    srcCache.set(photo.path, newSrc);
    return newSrc;
  }, [photo.path]);

  return (
    <div 
      className={`thumb-wrap${isActive ? ' active' : ''}`}
      onClick={onClick}
      title={photo.path.split(/[/\\]/).pop()}
    >
      {!hasError ? (
        <img 
          className="thumb" 
          src={src}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          alt={`Thumbnail ${index + 1}`}
          loading="lazy"
          decoding="async"
          style={{
            opacity: isLoaded ? 1 : 0.5,
            transition: 'opacity 0.2s ease'
          }}
        />
      ) : (
        <div className="thumb-error">📷</div>
      )}
    </div>
  );
});

// Virtual list for thumbnails
const VirtualThumbnailGrid = memo(function VirtualThumbnailGrid({
  items,
  activeIndex,
  onSelect,
  containerHeight,
  compareMode,
  comparePhoto1,
  onAddToCompare
}: {
  items: PhotoItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
  containerHeight: number;
  compareMode?: boolean;
  comparePhoto1?: PhotoItem | null;
  onAddToCompare?: (photo: PhotoItem) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemHeight = 90; // thumb height + gap
  const itemsPerRow = 3;
  const rowCount = Math.ceil(items.length / itemsPerRow);
  const totalHeight = rowCount * itemHeight;
  
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRowCount = Math.ceil(containerHeight / itemHeight) + 2;
  const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
  const endRow = Math.min(rowCount, startRow + visibleRowCount);
  
  const visibleItems = useMemo(() => {
    const start = startRow * itemsPerRow;
    const end = Math.min(items.length, endRow * itemsPerRow);
    return items.slice(start, end).map((item, i) => ({
      item,
      index: start + i
    }));
  }, [items, startRow, endRow, itemsPerRow]);

  // Scroll to active item
  useEffect(() => {
    if (scrollRef.current) {
      const activeRow = Math.floor(activeIndex / itemsPerRow);
      const activeTop = activeRow * itemHeight;
      const activeBottom = activeTop + itemHeight;
      const viewTop = scrollRef.current.scrollTop;
      const viewBottom = viewTop + containerHeight;
      
      if (activeTop < viewTop) {
        scrollRef.current.scrollTop = activeTop - itemHeight;
      } else if (activeBottom > viewBottom) {
        scrollRef.current.scrollTop = activeBottom - containerHeight + itemHeight;
      }
    }
  }, [activeIndex, containerHeight, itemsPerRow, itemHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  if (items.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px 20px', 
        color: 'var(--text-secondary)',
        fontSize: '14px'
      }}>
        No photos loaded.<br/>Select a folder to begin.
      </div>
    );
  }

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      style={{ 
        height: containerHeight, 
        overflowY: 'auto',
        position: 'relative'
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div 
          className="grid"
          style={{ 
            position: 'absolute',
            top: startRow * itemHeight,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map(({ item, index }) => {
            const isCompare1 = comparePhoto1?.path === item.path;
            return (
              <Thumbnail
                key={item.path}
                photo={item}
                isActive={index === activeIndex}
                onClick={() => {
                  if (compareMode && onAddToCompare && !isCompare1) {
                    onAddToCompare(item);
                  } else {
                    onSelect(index);
                  }
                }}
                index={index}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default function App() {
  const [baseDir, setBaseDir] = useState<string>("");
  const [items, setItems] = useState<PhotoItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [history, setHistory] = useState<Array<{ src: string; destDir: string; file: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
  
  // New state for features
  const [includeSubfolders, setIncludeSubfolders] = useState(false);
  const [exifData, setExifData] = useState<ExifData | null>(null);
  const [exifLoading, setExifLoading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePhoto1, setComparePhoto1] = useState<PhotoItem | null>(null);
  const [comparePhoto2, setComparePhoto2] = useState<PhotoItem | null>(null);

  const current = items[idx];

  // Get cached image source
  const getImageSrc = useCallback((path: string) => {
    const cached = srcCache.get(path);
    if (cached) return cached;
    const src = convertFileSrc(path);
    srcCache.set(path, src);
    return src;
  }, []);

  // Preload adjacent images
  useEffect(() => {
    if (items.length === 0) return;
    
    const preloadPaths: string[] = [];
    // Preload next 5 and previous 2 images
    for (let i = -2; i <= 5; i++) {
      const preloadIdx = idx + i;
      if (preloadIdx >= 0 && preloadIdx < items.length && preloadIdx !== idx) {
        preloadPaths.push(items[preloadIdx].path);
      }
    }
    preloader.add(preloadPaths);
  }, [idx, items]);

  // Load EXIF data when current photo changes
  useEffect(() => {
    if (!current) {
      setExifData(null);
      return;
    }
    
    let cancelled = false;
    setExifLoading(true);
    
    invoke<ExifData>("get_exif_data", { path: current.path })
      .then(data => {
        if (!cancelled) setExifData(data);
      })
      .catch(() => {
        if (!cancelled) setExifData(null);
      })
      .finally(() => {
        if (!cancelled) setExifLoading(false);
      });
    
    return () => { cancelled = true; };
  }, [current?.path]);

  async function loadDir() {
    const dir = await open({ directory: true, multiple: false });
    if (!dir || Array.isArray(dir)) return;
    
    setIsLoading(true);
    setLoadingProgress(0);
    srcCache.clear();
    preloader.clear();
    
    try {
      setBaseDir(String(dir));
      // Folders will be created on-demand when files are moved
      
      setLoadingProgress(10);
      
      // Use recursive or non-recursive listing based on toggle
      const list = includeSubfolders 
        ? await invoke<PhotoItem[]>("list_images_recursive", { dir, maxDepth: 5 })
        : await invoke<PhotoItem[]>("list_images", { dir });
      setLoadingProgress(100);
      
      // Sort by filename for consistent ordering
      list.sort((a, b) => {
        const nameA = a.path.split(/[/\\]/).pop() || '';
        const nameB = b.path.split(/[/\\]/).pop() || '';
        return nameA.localeCompare(nameB, undefined, { numeric: true });
      });
      
      setItems(list);
      setIdx(0);
      setHistory([]);
      setComparePhoto1(null);
      setComparePhoto2(null);
      
      // Start preloading first few images
      if (list.length > 0) {
        preloader.add(list.slice(0, 10).map(p => p.path));
      }
    } catch (error) {
      console.error('Error loading directory:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const moveTo = useCallback(async (bucket: "Landscape" | "Portrait" | "Favorite" | "Reject") => {
    if (!current || !baseDir) return;
    
    const destDir = `${baseDir}/${bucket}`;
    const file = current.path.split(/[/\\]/).pop()!;
    
    try {
      await invoke("move_file", { src: current.path, destDir });
      
      setHistory((h) => [{ src: current.path, destDir, file }, ...h.slice(0, 99)]); // Keep last 100
      
      setItems((arr) => {
        const copy = [...arr];
        copy.splice(idx, 1);
        return copy;
      });
      
      setIdx((i) => Math.min(i, Math.max(0, items.length - 2)));
      
      // Remove from cache
      srcCache.delete(current.path);
    } catch (error) {
      console.error('Error moving file:', error);
    }
  }, [current, baseDir, idx, items.length]);

  const undo = useCallback(async () => {
    const last = history[0];
    if (!last || !baseDir) return;
    
    try {
      const movedPath = `${last.destDir}/${last.file}`;
      await invoke("move_file", { src: movedPath, destDir: baseDir });
      
      const list = await invoke<PhotoItem[]>("list_images", { dir: baseDir });
      list.sort((a, b) => {
        const nameA = a.path.split(/[/\\]/).pop() || '';
        const nameB = b.path.split(/[/\\]/).pop() || '';
        return nameA.localeCompare(nameB, undefined, { numeric: true });
      });
      
      setItems(list);
      setHistory((h) => h.slice(1));
    } catch (error) {
      console.error('Error undoing move:', error);
    }
  }, [history, baseDir]);

  const deletePhoto = useCallback(async () => {
    if (!current) return;
    
    // Confirm before deleting
    const fileName = current.path.split(/[/\\]/).pop();
    if (!confirm(`Are you sure you want to permanently delete "${fileName}"?\n\nThis action cannot be undone.`)) {
      return;
    }
    
    try {
      await invoke("delete_file", { path: current.path });
      
      setItems((arr) => {
        const copy = [...arr];
        copy.splice(idx, 1);
        return copy;
      });
      
      setIdx((i) => Math.min(i, Math.max(0, items.length - 2)));
      
      // Remove from cache
      srcCache.delete(current.path);
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete the file. It may be in use or protected.');
    }
  }, [current, idx, items.length]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Skip if typing in input or compare mode is active
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (compareMode) return; // Compare mode has its own handlers
      
      switch (e.key) {
        case "ArrowRight":
          setIdx((i) => Math.min(i + 1, items.length - 1));
          break;
        case "ArrowLeft":
          setIdx((i) => Math.max(i - 1, 0));
          break;
        case "j":
        case "J":
          moveTo("Landscape");
          break;
        case "k":
        case "K":
          moveTo("Portrait");
          break;
        case "f":
        case "F":
          moveTo("Favorite");
          break;
        case "x":
        case "X":
          moveTo("Reject");
          break;
        case "s":
        case "S":
          setIdx((i) => Math.min(i + 1, items.length - 1));
          break;
        case "z":
        case "Z":
          if (!e.ctrlKey && !e.metaKey) undo();
          break;
        case "c":
        case "C":
          if (!e.ctrlKey && !e.metaKey && current) {
            setComparePhoto1(current);
            setCompareMode(true);
          }
          break;
        case "Delete":
        case "d":
        case "D":
          if (!e.ctrlKey && !e.metaKey) deletePhoto();
          break;
      }
    }
    
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length, moveTo, undo, compareMode, current, deletePhoto]);

  // Progress percentage
  const progressPercent = useMemo(() => {
    if (items.length === 0) return 0;
    return ((items.length - idx) / items.length) * 100;
  }, [items.length, idx]);

  return (
    <div className="main">
      {/* Progress Bar */}
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Sidebar */}
      <div className="sidebar">
        <button className="btn" onClick={loadDir} disabled={isLoading}>
          {isLoading ? `⏳ Loading... ${loadingProgress}%` : '📁 Select Folder'}
        </button>
        
        {/* Subfolder Toggle */}
        <label className="toggle-label">
          <input 
            type="checkbox" 
            checked={includeSubfolders}
            onChange={(e) => setIncludeSubfolders(e.target.checked)}
          />
          <span>📂 Include Subfolders</span>
        </label>

        {/* Compare Mode Button */}
        {current && (
          <button 
            className="btn compare-btn" 
            onClick={() => {
              setComparePhoto1(current);
              setCompareMode(true);
            }}
          >
            🔀 Compare Mode (C)
          </button>
        )}
        
        <div className="shortcuts-card">
          <div className="shortcuts-title">⌨️ Keyboard Shortcuts</div>
          <div className="shortcut-item">
            <span>Previous/Next</span>
            <div style={{display: 'flex', gap: '4px'}}>
              <span className="shortcut-key">←</span>
              <span className="shortcut-key">→</span>
            </div>
          </div>
          <div className="shortcut-item">
            <span>Landscape</span>
            <span className="shortcut-key">J</span>
          </div>
          <div className="shortcut-item">
            <span>Portrait</span>
            <span className="shortcut-key">K</span>
          </div>
          <div className="shortcut-item">
            <span>Favorite</span>
            <span className="shortcut-key">F</span>
          </div>
          <div className="shortcut-item">
            <span>Reject</span>
            <span className="shortcut-key">X</span>
          </div>
          <div className="shortcut-item">
            <span>Skip</span>
            <span className="shortcut-key">S</span>
          </div>
          <div className="shortcut-item">
            <span>Undo</span>
            <span className="shortcut-key">Z</span>
          </div>
          <div className="shortcut-item">
            <span>Compare</span>
            <span className="shortcut-key">C</span>
          </div>
          <div className="shortcut-item">
            <span>Delete</span>
            <span className="shortcut-key">D</span>
          </div>
        </div>

        {/* Undo Button */}
        {history.length > 0 && (
          <button className="btn" onClick={undo} style={{
            background: 'linear-gradient(135deg, var(--warning), #d97706)',
            marginTop: '0'
          }}>
            ↶ Undo ({history.length})
          </button>
        )}

        {current && (
          <div className="file-info">
            <div className="file-info-title">📋 File Details</div>
            <div className="file-detail">
              <strong>Name:</strong><br/>
              <span className="file-name">{current.path.split(/[/\\]/).pop()}</span>
            </div>
            <div className="file-detail">
              <strong>Resolution:</strong> {current.width} × {current.height}
            </div>
            <div className="file-detail">
              <strong>Orientation:</strong> {current.orientation}
            </div>
            <div className="file-detail">
              <strong>Progress:</strong> {idx + 1} of {items.length}
            </div>
            {exifData?.file_size && (
              <div className="file-detail">
                <strong>File Size:</strong> {exifData.file_size}
              </div>
            )}
            
            {/* EXIF Data Section */}
            {exifLoading ? (
              <div className="exif-section">
                <div className="exif-section-title">📷 Camera Info</div>
                <div className="exif-loading">Loading EXIF...</div>
              </div>
            ) : exifData && (exifData.camera_model || exifData.focal_length || exifData.date_taken) ? (
              <div className="exif-section">
                <div className="exif-section-title">📷 Camera Info</div>
                {(exifData.camera_make || exifData.camera_model) && (
                  <div className="exif-row">
                    <span className="exif-label">Camera</span>
                    <span className="exif-value">{[exifData.camera_make, exifData.camera_model].filter(Boolean).join(' ')}</span>
                  </div>
                )}
                {exifData.lens && (
                  <div className="exif-row">
                    <span className="exif-label">Lens</span>
                    <span className="exif-value">{exifData.lens}</span>
                  </div>
                )}
                {exifData.focal_length && (
                  <div className="exif-row">
                    <span className="exif-label">Focal</span>
                    <span className="exif-value">{exifData.focal_length}</span>
                  </div>
                )}
                {exifData.aperture && (
                  <div className="exif-row">
                    <span className="exif-label">Aperture</span>
                    <span className="exif-value">{exifData.aperture}</span>
                  </div>
                )}
                {exifData.shutter_speed && (
                  <div className="exif-row">
                    <span className="exif-label">Shutter</span>
                    <span className="exif-value">{exifData.shutter_speed}</span>
                  </div>
                )}
                {exifData.iso && (
                  <div className="exif-row">
                    <span className="exif-label">ISO</span>
                    <span className="exif-value">{exifData.iso}</span>
                  </div>
                )}
                {exifData.exposure_compensation && (
                  <div className="exif-row">
                    <span className="exif-label">Exp Comp</span>
                    <span className="exif-value">{exifData.exposure_compensation}</span>
                  </div>
                )}
                {exifData.date_taken && (
                  <div className="exif-row">
                    <span className="exif-label">Date</span>
                    <span className="exif-value">{exifData.date_taken}</span>
                  </div>
                )}
                {exifData.flash && (
                  <div className="exif-row">
                    <span className="exif-label">Flash</span>
                    <span className="exif-value">{exifData.flash}</span>
                  </div>
                )}
                {exifData.white_balance && (
                  <div className="exif-row">
                    <span className="exif-label">WB</span>
                    <span className="exif-value">{exifData.white_balance}</span>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Main Image Area */}
      <div className="image-container">
        {!current ? (
          <div className="welcome-screen">
            <div className="welcome-icon">🖼️</div>
            <div>
              <div className="welcome-title">Welcome to PhotoSorter</div>
              <div className="welcome-subtitle">
                Select a folder to start organizing your photos into Landscape, Portrait, Favorite, and Reject categories.
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Navigation overlays */}
            {idx > 0 && (
              <div 
                className="navigation-overlay prev" 
                onClick={() => setIdx((i) => Math.max(i - 1, 0))}
              >
                <div className="nav-arrow">‹</div>
              </div>
            )}
            {idx < items.length - 1 && (
              <div 
                className="navigation-overlay next" 
                onClick={() => setIdx((i) => Math.min(i + 1, items.length - 1))}
              >
                <div className="nav-arrow">›</div>
              </div>
            )}

            {/* Hint */}
            <div className="hint">
              Use keyboard shortcuts or click the buttons below to sort
            </div>

            {/* Main Image */}
            <div className="image-wrapper" onClick={() => setShowZoom(true)} title="Click to zoom">
              <div className="zoom-icon-hint">🔍</div>
              <img 
                src={getImageSrc(current.path)} 
                className="bigimg" 
                alt="Current photo"
                decoding="async"
                style={{
                  willChange: 'auto',
                  contain: 'layout style paint',
                  cursor: 'zoom-in'
                }}
              />
            </div>

            {/* Zoom Viewer Modal */}
            {showZoom && (
              <ZoomViewer
                src={getImageSrc(current.path)}
                onClose={() => setShowZoom(false)}
              />
            )}

            {/* Compare Mode Modal */}
            {compareMode && (
              <CompareViewer
                photo1={comparePhoto1}
                photo2={comparePhoto2}
                getImageSrc={getImageSrc}
                onClose={() => {
                  setCompareMode(false);
                  setComparePhoto1(null);
                  setComparePhoto2(null);
                }}
                onSelect1={() => {
                  // Keep photo1, reject photo2
                  if (comparePhoto2) {
                    const photo2Idx = items.findIndex(p => p.path === comparePhoto2.path);
                    if (photo2Idx >= 0) {
                      moveTo("Reject");
                    }
                  }
                  setCompareMode(false);
                  setComparePhoto1(null);
                  setComparePhoto2(null);
                }}
                onSelect2={() => {
                  // Keep photo2, reject photo1
                  if (comparePhoto1) {
                    const photo1Idx = items.findIndex(p => p.path === comparePhoto1.path);
                    if (photo1Idx >= 0) {
                      setIdx(photo1Idx);
                      setTimeout(() => moveTo("Reject"), 50);
                    }
                  }
                  setCompareMode(false);
                  setComparePhoto1(null);
                  setComparePhoto2(null);
                }}
              />
            )}

            {/* Action Buttons */}
            <div className="action-buttons">
              <button 
                className="action-btn landscape" 
                onClick={() => moveTo("Landscape")}
              >
                🌄 Landscape
              </button>
              <button 
                className="action-btn portrait" 
                onClick={() => moveTo("Portrait")}
              >
                🖼️ Portrait
              </button>
              <button 
                className="action-btn favorite" 
                onClick={() => moveTo("Favorite")}
              >
                ⭐ Favorite
              </button>
              <button 
                className="action-btn reject" 
                onClick={() => moveTo("Reject")}
              >
                🗑️ Reject
              </button>
              <button 
                className="action-btn delete" 
                onClick={deletePhoto}
              >
                ❌ Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Queue/Thumbnails with Virtual Scrolling */}
      <div className="queue">
        <div className="queue-header">
          <div className="queue-title">📸 Photos</div>
          {items.length > 0 && (
            <div className="queue-count">{items.length}</div>
          )}
          {isLoading && (
            <div style={{ color: 'var(--accent-primary)', fontSize: '12px' }}>
              Loading...
            </div>
          )}
          {compareMode && (
            <div style={{ color: 'var(--warning)', fontSize: '11px' }}>
              Click to compare
            </div>
          )}
        </div>
        
        <VirtualThumbnailGrid
          items={items}
          activeIndex={idx}
          onSelect={setIdx}
          containerHeight={window.innerHeight - 180}
          compareMode={compareMode}
          comparePhoto1={comparePhoto1}
          onAddToCompare={(photo) => setComparePhoto2(photo)}
        />
      </div>
    </div>
  );
}
