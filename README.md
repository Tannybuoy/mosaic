# 🎨 Mosaic Animator

Create stunning photo mosaics from your images and export them as smooth zoom-out GIF animations. Built with React, TypeScript, and pure browser technologies - no backend required!

![Mosaic Animator Demo](https://img.shields.io/badge/status-production_ready-success)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)
![React](https://img.shields.io/badge/React-18.2-61dafb)

## ✨ Features

- **100% Client-Side Processing** - Everything runs in your browser, no server required
- **Photo Mosaic Generation** - Transform any image into a mosaic using 1-5 tile photos
- **Smooth Zoom Animations** - Create cinematic zoom-out effects from tile detail to full mosaic
- **GIF Export** - Export your animations as high-quality GIFs
- **Interactive Controls** - Fine-tune every aspect of your mosaic and animation
- **Real-time Preview** - See tile detail with zoom preview while designing
- **Focus Point Selection** - Click anywhere on the mosaic to set the animation start point
- **Color Matching** - Optional tint overlay improves color accuracy
- **Responsive Performance** - Optimized rendering with progress tracking

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open your browser to the URL shown (typically `http://localhost:5173`)

### Build for Production

```bash
npm run build
npm run preview
```

## 📖 How to Use

### 1. Upload Images

- **Goal Image**: The target image you want to recreate as a mosaic (required)
- **Tile Photos**: 1-5 photos that will be used as repeating tiles (required)

Supported formats: JPG, PNG, WEBP

### 2. Generate Mosaic

Configure your mosaic:
- **Output Width** (600-2000px): Final mosaic resolution
- **Tile Size** (8-64px): Size of each tile - smaller = more detail
- **Tint Overlay** (0-60%): Color overlay to improve matching with goal image

Click "Generate Mosaic" and watch it build!

### 3. Set Focus Point

Click anywhere on the generated mosaic to set where the animation should start zoomed in. The animation will zoom out from this point to reveal the full mosaic.

### 4. Configure Animation

Fine-tune your GIF:
- **GIF Width** (400/600/800px): Output size affects file size and quality
- **Duration** (2-8s): How long the animation runs
- **FPS** (10-30): Frames per second - higher = smoother but larger file
- **Start Zoom** (6x-20x): Initial zoom level - higher shows more tile detail
- **Easing**: Animation curve (linear, ease out, ease in, ease in-out)

### 5. Export GIF

Click "Export GIF" to render and encode your animation. Progress bars show:
1. Frame rendering progress
2. GIF encoding progress

Preview your GIF and download when ready!

## 🔬 How It Works

### Mosaic Generation Algorithm

1. **Tile Preprocessing**
   - Each tile photo is cropped to a square (center crop)
   - Scaled to the chosen tile size
   - Average RGB color is calculated for matching

2. **Goal Image Processing**
   - Goal image is scaled to output dimensions (maintaining aspect ratio)
   - Divided into a grid based on tile size

3. **Tile Matching**
   - For each grid cell in the goal image:
     - Calculate average RGB color of that region
     - Find the tile photo with closest color match (Euclidean RGB distance)
     - Draw the matching tile into the mosaic

4. **Optional Tint Overlay**
   - Apply semi-transparent color overlay matching the goal region
   - Improves color accuracy while maintaining tile visibility

### Animation Rendering

1. **Frame Generation**
   - Calculate zoom levels from start zoom to 1.0 (full view)
   - Apply easing function for smooth motion
   - For each frame:
     - Calculate crop rectangle based on current zoom
     - Center on focus point with boundary clamping
     - Render cropped region scaled to GIF dimensions

2. **GIF Encoding**
   - Uses gif.js library with Web Workers
   - Processes frames asynchronously to keep UI responsive
   - Optimized quality settings (quality: 10)

## ⚡ Performance Tips

### For Best Quality
- Use **smaller tile sizes** (8-16px) for detailed mosaics
- Set **higher FPS** (20-30) for smoother animations
- Use **larger GIF width** (800px) for sharper output
- Enable **tint overlay** (20-40%) for better color matching

### For Smaller File Sizes
- Use **larger tile sizes** (32-64px)
- Set **lower FPS** (10-15)
- Use **smaller GIF width** (400-600px)
- Keep **duration shorter** (2-4s)

### Performance Trade-offs

| Setting | Quality | File Size | Processing Time |
|---------|---------|-----------|-----------------|
| Tile Size 8px | High detail | Longer render | More tiles to match |
| Tile Size 32px | Lower detail | Faster render | Fewer tiles to match |
| FPS 30 | Smooth | Large | More frames to encode |
| FPS 10 | Choppy | Small | Fewer frames to encode |
| GIF Width 800px | Sharp | Large | More pixels per frame |
| GIF Width 400px | Softer | Small | Fewer pixels per frame |

### Browser Memory Considerations

- Large mosaics (2000px width, 8px tiles) create ~62,500 tiles
- High FPS + long duration creates many frames (8s × 30fps = 240 frames)
- Each frame is stored in memory during encoding
- If the browser runs out of memory:
  - Reduce output width
  - Increase tile size
  - Lower FPS
  - Shorten duration

## 🛠️ Technology Stack

- **React 18** - UI framework
- **TypeScript 5** - Type safety
- **Vite** - Build tool and dev server
- **Canvas 2D API** - Image processing and rendering
- **gif.js** - GIF encoding with Web Workers
- **ImageBitmap API** - Optimized image decoding

## 📁 Project Structure

```
mosaic-animator/
├── src/
│   ├── components/
│   │   ├── UploadPanel.tsx      # File upload UI
│   │   ├── MosaicControls.tsx   # Mosaic generation settings
│   │   ├── MosaicCanvas.tsx     # Mosaic display with zoom preview
│   │   └── GifExporter.tsx      # Animation settings and export
│   ├── utils/
│   │   ├── imageLoad.ts         # Image loading with ImageBitmap
│   │   ├── color.ts             # RGB color utilities
│   │   ├── mosaic.ts            # Mosaic generation algorithm
│   │   ├── easing.ts            # Animation easing functions
│   │   └── gif.ts               # GIF rendering and encoding
│   ├── App.tsx                  # Main application component
│   ├── App.css                  # Styling
│   └── main.tsx                 # Entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎨 Design Features

- **Modern Dark Theme** with gradient accents
- **Custom Font Stack** - Unbounded display font + JetBrains Mono
- **Responsive Layout** - Works on desktop and mobile
- **Smooth Animations** - CSS transitions and loading states
- **Interactive Previews** - Real-time zoom preview while designing
- **Progress Tracking** - Visual feedback during processing

## 🔧 Customization

### Adding New Easing Functions

Edit `src/utils/easing.ts`:

```typescript
export const myEasing: EasingFunction = (t: number) => {
  // Your easing formula here
  return t;
};

export const EASING_OPTIONS = {
  // ... existing options
  myEasing
} as const;
```

### Adjusting Color Matching

The tile matching uses Euclidean RGB distance. To implement different color spaces (LAB, HSL), modify `color.ts`:

```typescript
export function colorDistance(c1: RGB, c2: RGB): number {
  // Convert to LAB or other color space
  // Calculate perceptual distance
  return distance;
}
```

### Web Worker Configuration

gif.js uses Web Workers for encoding. The worker script path is configured in `src/utils/gif.ts`:

```typescript
const gif = new GIF({
  workers: 2, // Number of workers
  quality: 10, // 1-30, lower = better quality
  workerScript: '/gif.worker.js'
});
```

Note: The gif.js library expects the worker script to be available. In production builds, you may need to copy the worker file to your public directory.

## 🐛 Troubleshooting

### GIF encoding fails or is very slow
- Try reducing GIF width to 400px
- Lower FPS to 10-15
- Reduce duration to 2-3 seconds
- The browser may be out of memory - try smaller settings

### Mosaic generation is slow
- Use larger tile sizes (32-64px)
- Reduce output width
- Close other browser tabs to free memory

### Colors don't match well
- Increase tint overlay opacity (40-60%)
- Use more diverse tile photos with different colors
- Ensure tile photos have good color variety

### Animation starts at wrong position
- Click on the mosaic preview to set focus point
- The red marker shows where animation will start
- Click near the most interesting tile detail

## 📝 License

MIT License - feel free to use this project however you'd like!

## 🤝 Contributing

This is a production-ready demo project. Feel free to fork and customize for your needs!

## 🙏 Credits

- **gif.js** - GIF encoding library by jnordberg
- **Unbounded** font by NaN and Manushi Parikh
- **JetBrains Mono** font by JetBrains

---

Made with ❤️ using React + TypeScript + Canvas API
