import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";
import { convertFileSrc } from "@tauri-apps/api/tauri";

type Orientation = "landscape" | "portrait" | "square";
type PhotoItem = { path: string; width: number; height: number; orientation: Orientation };

export default function App() {
  const [baseDir, setBaseDir] = useState<string>("");
  const [items, setItems] = useState<PhotoItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [history, setHistory] = useState<Array<{ src: string; destDir: string; file: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageCache, setImageCache] = useState<Map<string, string>>(new Map());

  const current = items[idx];

  // Memoized converted image source with caching
  const getCurrentImageSrc = useCallback((photo: PhotoItem) => {
    if (!photo) return '';
    
    const cached = imageCache.get(photo.path);
    if (cached) return cached;
    
    const src = convertFileSrc(photo.path);
    setImageCache(prev => new Map(prev).set(photo.path, src));
    return src;
  }, [imageCache]);

  async function loadDir() {
    const dir = await open({ directory: true, multiple: false });
    if (!dir || Array.isArray(dir)) return;
    
    setIsLoading(true);
    try {
      setBaseDir(String(dir));
      await invoke("ensure_dirs", { base: dir });
      const list = await invoke<PhotoItem[]>("list_images", { dir });
      setItems(list);
      setIdx(0);
      setImageCache(new Map()); // Clear cache when loading new directory
    } catch (error) {
      console.error('Error loading directory:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function moveTo(bucket: "Landscape" | "Portrait" | "Reject") {
    if (!current || !baseDir) return;
    const destDir = `${baseDir}/${bucket}`;
    const file = current.path.split(/[/\\]/).pop()!;
    await invoke("move_file", { src: current.path, destDir });
    setHistory((h) => [{ src: current.path, destDir, file }, ...h]);
    setItems((arr) => {
      const copy = [...arr];
      copy.splice(idx, 1);
      return copy;
    });
    setIdx((i) => Math.min(i, Math.max(0, items.length - 2)));
  }

  async function undo() {
    const last = history[0];
    if (!last || !baseDir) return;
    const movedPath = `${last.destDir}/${last.file}`;
    await invoke("move_file", { src: movedPath, destDir: baseDir });
    const list = await invoke<PhotoItem[]>("list_images", { dir: baseDir });
    setItems(list);
    setHistory((h) => h.slice(1));
  }

  // Optimized thumbnail component with lazy loading
  const LazyThumbnail = useCallback(({ photo, isActive, onClick, index }: {
    photo: PhotoItem;
    isActive: boolean;
    onClick: () => void;
    index: number;
  }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    
    return (
      <div 
        className={["thumb-wrap", isActive ? "active" : ""].join(" ")}
        onClick={onClick}
        title={photo.path.split(/[/\\]/).pop()}
      >
        {!hasError ? (
          <img 
            className="thumb" 
            src={getCurrentImageSrc(photo)}
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              setHasError(true);
              console.error('Thumbnail load error:', photo.path);
            }}
            alt={`Thumbnail ${index + 1}`}
            loading="lazy"
            style={{
              opacity: isLoaded ? 1 : 0.5,
              transition: 'opacity 0.3s ease'
            }}
          />
        ) : (
          <div className="thumb-error">
            📷
          </div>
        )}
      </div>
    );
  }, [getCurrentImageSrc]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current) return;
      if (e.key === "ArrowRight") setIdx((i) => Math.min(i + 1, items.length - 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
      if (e.key.toLowerCase() === "j") moveTo("Landscape");
      if (e.key.toLowerCase() === "k") moveTo("Portrait");
      if (e.key.toLowerCase() === "x") moveTo("Reject");
      if (e.key.toLowerCase() === "s") setIdx((i) => Math.min(i + 1, items.length - 1));
      if (e.key.toLowerCase() === "z") undo();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, idx, baseDir, history, current]);

  return (
    <div className="main">
      {/* Progress Bar */}
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: items.length > 0 ? `${((items.length - idx) / items.length) * 100}%` : '0%' }}
        />
      </div>

      {/* Sidebar */}
      <div className="sidebar">
        <button className="btn" onClick={loadDir} disabled={isLoading}>
          {isLoading ? '⏳ Loading...' : '📁 Select Folder'}
        </button>
        
        <div className="shortcuts-card">
          <div className="shortcuts-title">
            ⌨️ Keyboard Shortcuts
          </div>
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
        </div>

        {/* Undo Button */}
        {history.length > 0 && (
          <button className="btn" onClick={undo} style={{
            background: 'linear-gradient(135deg, var(--warning), #d97706)',
            marginTop: '0'
          }}>
            ↶ Undo Last Move
          </button>
        )}

        {current && (
          <div className="file-info">
            <div className="file-info-title">
              📋 File Details
            </div>
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
                Select a folder to start organizing your photos into Landscape, Portrait, and Reject categories.
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Navigation overlays */}
            <div 
              className="navigation-overlay prev" 
              onClick={() => setIdx((i) => Math.max(i - 1, 0))}
              style={{ display: idx > 0 ? 'flex' : 'none' }}
            >
              <div className="nav-arrow">‹</div>
            </div>
            <div 
              className="navigation-overlay next" 
              onClick={() => setIdx((i) => Math.min(i + 1, items.length - 1))}
              style={{ display: idx < items.length - 1 ? 'flex' : 'none' }}
            >
              <div className="nav-arrow">›</div>
            </div>

            {/* Hint */}
            <div className="hint">
              Use keyboard shortcuts or click the buttons below to sort
            </div>

            {/* Main Image */}
            <div className="image-wrapper">
              <img 
                src={getCurrentImageSrc(current)} 
                className="bigimg" 
                onError={(e) => {
                  console.error('Failed to load image:', current.path);
                  console.error('Converted src:', getCurrentImageSrc(current));
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', current.path);
                  // Preload next and previous images for better performance
                  if (idx < items.length - 1) {
                    const nextImg = new Image();
                    nextImg.src = getCurrentImageSrc(items[idx + 1]);
                  }
                  if (idx > 0) {
                    const prevImg = new Image();
                    prevImg.src = getCurrentImageSrc(items[idx - 1]);
                  }
                }}
                alt="Current photo"
                style={{
                  imageRendering: 'auto',
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(0)', // Force hardware acceleration
                }}
              />
            </div>

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
                className="action-btn reject" 
                onClick={() => moveTo("Reject")}
              >
                🗑️ Reject
              </button>
            </div>
          </>
        )}
      </div>

      {/* Queue/Thumbnails */}
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
        </div>
        
        {items.length > 0 ? (
          <div className="grid" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            {items.slice(0, Math.min(items.length, 50)).map((photo, i) => (
              <LazyThumbnail
                key={photo.path}
                photo={photo}
                isActive={i === idx}
                onClick={() => setIdx(i)}
                index={i}
              />
            ))}
            {items.length > 50 && (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '20px',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontStyle: 'italic'
              }}>
                Showing first 50 of {items.length} photos. Navigate with keyboard arrows or action buttons.
              </div>
            )}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: 'var(--text-secondary)',
            fontSize: '14px'
          }}>
            No photos loaded.<br/>Select a folder to begin.
          </div>
        )}
      </div>
    </div>
  );
}
