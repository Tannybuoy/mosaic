# 🏗️ Architecture Documentation - Mosaic Animator

This document explains the technical architecture, design decisions, and implementation details of the Mosaic Animator application.

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Component Architecture](#component-architecture)
4. [Data Flow](#data-flow)
5. [Core Algorithms](#core-algorithms)
6. [Performance Optimizations](#performance-optimizations)
7. [Browser APIs Used](#browser-apis-used)

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────┐        ┌──────────────────┐        │
│  │  React UI     │◄──────►│  State Manager   │        │
│  │  Components   │        │  (useState)      │        │
│  └───────┬───────┘        └────────┬─────────┘        │
│          │                         │                   │
│          ▼                         ▼                   │
│  ┌───────────────────────────────────────────┐        │
│  │         Utility Modules                   │        │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────┐ │        │
│  │  │ Image    │  │ Mosaic   │  │  GIF    │ │        │
│  │  │ Loading  │  │Generator │  │Encoder  │ │        │
│  │  └──────────┘  └──────────┘  └─────────┘ │        │
│  └───────────────────────────────────────────┘        │
│          │                         │                   │
│          ▼                         ▼                   │
│  ┌───────────────────────────────────────────┐        │
│  │         Browser APIs                      │        │
│  │  • Canvas 2D  • ImageBitmap  • Workers   │        │
│  └───────────────────────────────────────────┘        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Client-Side First**: All processing happens in the browser
2. **Progressive Enhancement**: Features degrade gracefully
3. **Performance-Conscious**: Async processing with progress feedback
4. **Type Safety**: Full TypeScript coverage
5. **Modular Design**: Separate concerns into focused modules

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2 | UI framework, component composition |
| TypeScript | 5.2 | Type safety, developer experience |
| Vite | 5.0 | Build tool, dev server, HMR |
| Canvas API | Native | Image processing, rendering |
| gif.js | 0.2.0 | GIF encoding with Web Workers |

### Why These Choices?

**React**: 
- Component-based architecture fits the multi-step workflow
- Hooks provide clean state management
- Virtual DOM handles frequent canvas updates efficiently

**TypeScript**:
- Catches errors at compile time
- Excellent IDE support
- Self-documenting code with interfaces

**Vite**:
- Fast dev server with HMR
- Optimized production builds
- Simple configuration
- Great TypeScript support

**Canvas 2D API**:
- Native browser support
- High performance for image manipulation
- Direct pixel access via ImageData
- No external dependencies for core rendering

**gif.js**:
- Pure JavaScript, no native dependencies
- Web Worker support for non-blocking encoding
- Good quality output
- Active maintenance

## Component Architecture

### Component Hierarchy

```
App
├── UploadPanel
│   ├── Goal Image Dropzone
│   └── Tile Photos Dropzone
├── MosaicControls
│   ├── Output Width Slider
│   ├── Tile Size Slider
│   └── Tint Opacity Slider
├── MosaicCanvas
│   ├── Canvas Display
│   ├── Focus Point Marker
│   └── Zoom Preview
└── GifExporter
    ├── Animation Settings
    ├── Progress Bars
    └── GIF Preview/Download
```

### Component Responsibilities

#### App.tsx
**Role**: Application orchestrator

```typescript
// State management
- Upload state (goal image, tile photos)
- Mosaic state (settings, canvas, tiles)
- GIF state (settings, blob, progress)
- Workflow orchestration

// Key functions
- handleGenerateMosaic(): Coordinates mosaic generation
- handleExportGif(): Coordinates GIF export
- handleReset(): Clears all state
```

#### UploadPanel.tsx
**Role**: File upload interface

```typescript
// Features
- Drag-and-drop support
- File validation (type, count)
- Thumbnail previews
- Remove/replace functionality

// Props
- goalImage: File | null
- tilePhotos: File[]
- onGoalImageChange: (file) => void
- onTilePhotosChange: (files) => void
```

#### MosaicControls.tsx
**Role**: Mosaic generation settings

```typescript
// Settings
- outputWidth: 600-2000px
- tileSize: 8-64px
- tintOpacity: 0-0.6

// Features
- Range sliders with live values
- Disabled state during generation
- Generate button with validation
```

#### MosaicCanvas.tsx
**Role**: Mosaic display and interaction

```typescript
// Features
- Canvas rendering
- Click to set focus point
- Mouse-over zoom preview
- Focus point marker

// Technical details
- Uses refs for canvas elements
- Handles canvas scaling for display
- Converts click coordinates to normalized values
```

#### GifExporter.tsx
**Role**: Animation configuration and export

```typescript
// Settings
- width: 400/600/800px
- duration: 2-8s
- fps: 10-30
- startZoom: 6-20x
- easing: linear/easeOut/easeIn/easeInOut

// Features
- Two-phase progress (render + encode)
- GIF preview
- Download with proper filename
```

## Data Flow

### 1. Upload Flow

```
User selects files
    ↓
FileReader creates object URLs
    ↓
Validation (type, count)
    ↓
State updates (goalImage, tilePhotos)
    ↓
UI shows thumbnails
```

### 2. Mosaic Generation Flow

```
User clicks "Generate Mosaic"
    ↓
Load images (loadImageFromFile)
    ↓
Create ImageBitmap if supported
    ↓
Preprocess tiles (preprocessTiles)
    ├── Crop to square
    ├── Scale to tile size
    └── Calculate average color
    ↓
Generate mosaic (generateMosaic)
    ├── Scale goal image
    ├── Divide into grid
    ├── Match tiles to grid cells
    └── Apply optional tint
    ↓
Store canvas in state
    ↓
UI displays mosaic
```

### 3. GIF Export Flow

```
User clicks "Export GIF"
    ↓
Render frames (renderZoomFrames)
    ├── Calculate zoom progression
    ├── Apply easing function
    ├── For each frame:
    │   ├── Calculate crop rectangle
    │   ├── Draw to frame canvas
    │   └── Extract ImageData
    └── Return frame array
    ↓
Encode GIF (encodeGif)
    ├── Initialize gif.js encoder
    ├── Add frames with delays
    ├── Start Web Worker encoding
    └── Return Blob
    ↓
Create object URL
    ↓
Display preview and download button
```

## Core Algorithms

### 1. Tile Preprocessing

**Purpose**: Convert tile photos into optimized tiles with color data

```typescript
Algorithm: preprocessTiles(images, tileSize)
Input: Array of loaded images, desired tile size
Output: Array of {canvas, averageColor, originalFile}

For each image:
  1. Calculate square crop (center crop)
     size = min(image.width, image.height)
     sx = (image.width - size) / 2
     sy = (image.height - size) / 2
  
  2. Create tile canvas at tileSize × tileSize
  
  3. Draw cropped square scaled to tile size
     drawImage(image, sx, sy, size, size, 0, 0, tileSize, tileSize)
  
  4. Get ImageData
  
  5. Calculate average RGB:
     For each pixel:
       r_total += pixel.r
       g_total += pixel.g
       b_total += pixel.b
     avg_r = r_total / pixel_count
     avg_g = g_total / pixel_count
     avg_b = b_total / pixel_count
  
  6. Store {canvas, averageColor}
```

**Complexity**: O(T × S²) where T = tile count, S = tile size

### 2. Mosaic Generation

**Purpose**: Map tiles to grid cells based on color matching

```typescript
Algorithm: generateMosaic(goalImage, tiles, config)
Input: Goal image, preprocessed tiles, settings
Output: Mosaic canvas

1. Calculate output dimensions:
   outputHeight = outputWidth × (goalImage.height / goalImage.width)
   gridWidth = floor(outputWidth / tileSize)
   gridHeight = floor(outputHeight / tileSize)

2. Scale goal image to actualWidth × actualHeight

3. Create mosaic canvas

4. For each grid cell (gridX, gridY):
   a. Calculate pixel position (x, y)
   
   b. Get region average color:
      Extract ImageData for tileSize × tileSize region
      Calculate average RGB
   
   c. Find closest tile:
      bestTileIndex = 0
      minDistance = Infinity
      For each tile:
        distance = sqrt(
          (regionR - tileR)² + 
          (regionG - tileG)² + 
          (regionB - tileB)²
        )
        if distance < minDistance:
          minDistance = distance
          bestTileIndex = currentIndex
   
   d. Draw tile to mosaic:
      drawImage(tiles[bestTileIndex].canvas, x, y)
   
   e. Apply tint if enabled:
      fillStyle = rgb(regionR, regionG, regionB)
      globalAlpha = tintOpacity
      fillRect(x, y, tileSize, tileSize)
   
   f. Yield to browser every 100 cells:
      if cellIndex % 100 == 0:
        await sleep(0)

5. Return mosaic canvas
```

**Complexity**: O(G × T) where G = grid cells, T = tile count
- Grid cells: (width/tileSize) × (height/tileSize)
- For 1200px width, 16px tiles: 75 × 75 = 5,625 cells
- With 5 tiles: 5,625 × 5 = 28,125 operations

**Optimization**: 
- Chunk processing (100 cells at a time)
- Cached tile colors (not recalculated)
- Euclidean distance in RGB space (fast)

### 3. Frame Rendering

**Purpose**: Generate animation frames with zoom effect

```typescript
Algorithm: renderZoomFrames(mosaicCanvas, config)
Input: Mosaic canvas, animation settings
Output: Array of ImageData frames

1. Calculate frame count:
   frameCount = duration × fps

2. Calculate focus point in pixels:
   focusX = focusPoint.x × mosaicCanvas.width
   focusY = focusPoint.y × mosaicCanvas.height

3. For each frame i in [0, frameCount):
   a. Calculate progress (0 to 1):
      t = i / (frameCount - 1)
   
   b. Apply easing:
      easedT = easingFunction(t)
   
   c. Interpolate zoom:
      currentZoom = startZoom + (1 - startZoom) × easedT
   
   d. Calculate crop dimensions:
      cropWidth = gifWidth / currentZoom
      cropHeight = gifHeight / currentZoom
   
   e. Calculate crop position (centered on focus):
      cropX = focusX - cropWidth / 2
      cropY = focusY - cropHeight / 2
   
   f. Clamp to mosaic bounds:
      cropX = clamp(cropX, 0, mosaicWidth - cropWidth)
      cropY = clamp(cropY, 0, mosaicHeight - cropHeight)
   
   g. Draw frame:
      drawImage(
        mosaicCanvas,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, gifWidth, gifHeight
      )
   
   h. Extract ImageData:
      frames.push(getImageData(0, 0, gifWidth, gifHeight))
   
   i. Yield every 10 frames:
      if i % 10 == 0:
        await sleep(0)

4. Return {frames, frameDelay}
```

**Complexity**: O(F × W × H) where F = frames, W = width, H = height
- Example: 80 frames × 600 × 600 = 28.8M pixel operations

**Optimization**:
- Frame canvas reused (not recreated)
- ImageData extraction minimized
- Async yielding prevents UI freeze

### 4. Easing Functions

**Purpose**: Control animation acceleration

```typescript
// Linear (constant speed)
linear(t) = t

// Ease Out Cubic (fast start, slow end)
easeOutCubic(t) = 1 - (1 - t)³

// Ease In Cubic (slow start, fast end)
easeInCubic(t) = t³

// Ease In-Out Cubic (slow start and end)
easeInOutCubic(t) = 
  if t < 0.5:
    4 × t³
  else:
    1 - (-2t + 2)³ / 2
```

**Effect on Animation**:
- Linear: Robotic, mechanical feel
- Ease Out: Natural deceleration (recommended)
- Ease In: Falling/accelerating feel
- Ease In-Out: Smooth beginning and end

## Performance Optimizations

### 1. Async Processing with Chunking

**Problem**: Long synchronous operations freeze the UI

**Solution**: Process in chunks with async yields

```typescript
// Process 100 cells, then yield
for (let start = 0; start < totalCells; start += chunkSize) {
  await new Promise(resolve => setTimeout(resolve, 0));
  
  for (let i = start; i < start + chunkSize; i++) {
    // Process cell
  }
}
```

**Benefit**: 
- UI remains responsive
- Progress can be shown
- User can see incremental results

### 2. ImageBitmap Optimization

**Problem**: HTMLImageElement decoding is slow

**Solution**: Use ImageBitmap API when available

```typescript
if ('createImageBitmap' in window) {
  bitmap = await createImageBitmap(img);
  // Use bitmap for faster drawImage() calls
}
```

**Benefit**:
- 2-3× faster image decoding
- Better memory usage
- Automatic hardware acceleration

### 3. Canvas Context Options

**Problem**: Default canvas settings are slower

**Solution**: Optimize context creation

```typescript
const ctx = canvas.getContext('2d', {
  willReadFrequently: true  // Optimize for getImageData()
});
```

**Benefit**:
- Faster ImageData access
- Better performance for color sampling

### 4. Web Workers for GIF Encoding

**Problem**: GIF encoding blocks the main thread

**Solution**: gif.js uses Web Workers

```typescript
const gif = new GIF({
  workers: 2,  // Use 2 worker threads
  quality: 10
});
```

**Benefit**:
- Main thread stays responsive
- Faster encoding on multi-core CPUs
- Progress updates during encoding

### 5. Memory Management

**Problem**: Large canvases and ImageData consume memory

**Solution**: Multiple strategies

```typescript
// Revoke object URLs when done
URL.revokeObjectURL(url);

// Clear canvases before removing references
ctx.clearRect(0, 0, width, height);

// Process frames in batches instead of all at once
// (future enhancement)
```

## Browser APIs Used

### Canvas 2D API

**Usage**: All image processing and rendering

```typescript
// Drawing
ctx.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh)

// Pixel access
ctx.getImageData(x, y, width, height)

// Styling
ctx.fillStyle = 'rgb(r, g, b)'
ctx.globalAlpha = opacity
ctx.fillRect(x, y, width, height)
```

### ImageBitmap API

**Usage**: Fast image decoding

```typescript
const bitmap = await createImageBitmap(
  imageElement,
  sx, sy, sw, sh,
  { resizeWidth, resizeHeight, resizeQuality: 'high' }
)
```

### File API

**Usage**: Reading uploaded files

```typescript
const objectURL = URL.createObjectURL(file)
URL.revokeObjectURL(objectURL)
```

### Web Workers

**Usage**: GIF encoding (via gif.js)

```typescript
// gif.js handles worker management internally
const gif = new GIF({ workers: 2 })
```

### RequestAnimationFrame

**Usage**: Yielding to browser

```typescript
await new Promise(resolve => setTimeout(resolve, 0))
// Alternative: requestAnimationFrame(callback)
```

## Future Enhancements

### Potential Improvements

1. **Progressive GIF Encoding**
   - Stream frames to encoder instead of buffering all
   - Reduces memory usage for long animations

2. **WebGL Rendering**
   - GPU-accelerated mosaic generation
   - Shader-based color matching
   - 10-100× faster for large mosaics

3. **Video Export**
   - Use MediaRecorder API
   - Output MP4 instead of GIF
   - Better quality, smaller files

4. **Advanced Color Matching**
   - LAB color space for perceptual matching
   - Dithering for better gradients
   - Adaptive tile selection

5. **Batch Processing**
   - Process multiple mosaics
   - Queue system
   - Background processing

6. **Undo/Redo**
   - History stack
   - State snapshots
   - Canvas caching

---

This architecture provides a solid foundation for a production-quality mosaic animation tool while maintaining simplicity and performance.
