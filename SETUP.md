# 🚀 Setup Guide - Mosaic Animator

## Prerequisites

- **Node.js** 16+ (recommend 18 or 20)
- **npm** or **yarn** package manager

Check your versions:
```bash
node --version  # Should be 16.x or higher
npm --version   # Should be 8.x or higher
```

## Installation Steps

### 1. Navigate to Project Directory

```bash
cd mosaic-animator
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- React 18.2
- TypeScript 5.2
- Vite 5.0
- gif.js 0.2.0
- All necessary dev dependencies

**Note**: If you see warnings about peer dependencies, they can usually be safely ignored for this project.

### 3. Start Development Server

```bash
npm run dev
```

You should see output like:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### 4. Open in Browser

Open your browser to `http://localhost:5173`

The app should load with the dark theme and gradient header.

## Build for Production

### Build the Project

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

Opens the production build at `http://localhost:4173`

## Deployment Options

### Static Hosting (Recommended)

The app is 100% client-side and works on any static host:

**Netlify:**
1. Drag and drop the `dist/` folder to Netlify
2. Done! Your app is live

**Vercel:**
```bash
npm install -g vercel
vercel
```

**GitHub Pages:**
1. Push to GitHub repository
2. Enable GitHub Pages
3. Set source to `dist/` directory

**Cloudflare Pages:**
1. Connect repository
2. Set build command: `npm run build`
3. Set output directory: `dist`

### Manual Static Hosting

Simply copy the contents of `dist/` to any web server:
- Apache
- Nginx
- Any CDN
- Any static file host

## Troubleshooting

### "Module not found" errors during install

**Issue**: npm can't find packages

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### gif.js worker errors in production

**Issue**: GIF encoding fails in production build

**Solution**: gif.js should work automatically with Vite. If you encounter issues:

1. Check browser console for errors
2. Ensure you're using a modern browser (Chrome 90+, Firefox 88+, Safari 15+)
3. Try reducing GIF settings (lower resolution, fewer frames)

### Build fails with TypeScript errors

**Issue**: Type checking errors

**Solution**:
```bash
# Check specific errors
npm run build

# If needed, you can skip type checking (not recommended):
vite build --mode development
```

### Port 5173 already in use

**Issue**: Dev server can't start

**Solution**:
```bash
# Kill process on port 5173
npx kill-port 5173

# Or specify different port
npm run dev -- --port 3000
```

### Large bundle size warnings

**Issue**: Build warnings about chunk sizes

**Solution**: This is expected for the gif.js library. The warnings can be safely ignored. If you need to optimize:

1. gif.js is already using code splitting
2. The worker is loaded separately
3. For further optimization, consider lazy loading the GIF export component

## Testing the App

### Quick Test Workflow

1. **Prepare test images:**
   - Find 1 goal image (any photo works)
   - Find 1-5 tile photos (varied colors work best)

2. **Upload images:**
   - Drag goal image to first dropzone
   - Drag 1-5 tiles to second dropzone

3. **Generate mosaic:**
   - Adjust settings if desired
   - Click "Generate Mosaic"
   - Should see mosaic appear in ~1-5 seconds

4. **Export GIF:**
   - Click on mosaic to set focus point
   - Adjust animation settings
   - Click "Export GIF"
   - Wait for progress bars to complete
   - Download the result

### Expected Performance

- **Mosaic generation**: 1-10 seconds depending on settings
- **GIF rendering**: 5-15 seconds for 20 FPS, 4s duration
- **GIF encoding**: 10-30 seconds depending on settings

### Browser Compatibility

Tested and working on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 15+
- ✅ Edge 90+

May not work on:
- ❌ Internet Explorer
- ❌ Very old mobile browsers
- ❌ Browsers without Canvas API support

## Development Tips

### Hot Module Replacement (HMR)

Vite provides instant updates while developing:
- Edit any `.tsx` or `.css` file
- Browser updates automatically
- State is preserved when possible

### TypeScript Checking

```bash
# Check types without building
npx tsc --noEmit
```

### Code Structure

- **Components**: UI components in `src/components/`
- **Utilities**: Core algorithms in `src/utils/`
- **Styling**: All CSS in `src/App.css`
- **Types**: TypeScript definitions in respective `.ts` files

### Adding Features

Example: Add new easing function

1. Edit `src/utils/easing.ts`:
```typescript
export const myEasing: EasingFunction = (t) => t * t;
```

2. Add to exports:
```typescript
export const EASING_OPTIONS = {
  // existing...
  myEasing
};
```

3. Update type:
```typescript
export type EasingType = keyof typeof EASING_OPTIONS;
```

4. UI automatically updates with new option!

## Performance Optimization

### For Development

The dev server is already optimized. If it feels slow:
- Close unused browser tabs
- Reduce preview canvas sizes in code
- Use smaller test images

### For Production

The production build is optimized by Vite:
- Code splitting
- Minification
- Tree shaking
- Asset optimization

### Memory Management

If users report memory issues:
- Add warning for large settings
- Implement streaming GIF encoding (advanced)
- Add "reduce memory" preset with smaller defaults

## Getting Help

1. **Check console**: Press F12 → Console tab for errors
2. **Check README**: Detailed usage instructions
3. **Check this file**: Common setup issues
4. **Browser DevTools**: Network tab shows if files are loading

## Success Checklist

- [ ] Node.js 16+ installed
- [ ] `npm install` completed without errors
- [ ] `npm run dev` starts server
- [ ] Browser opens to localhost:5173
- [ ] App loads with dark theme and gradient
- [ ] Can upload images successfully
- [ ] Can generate mosaic
- [ ] Can export GIF

If all boxes are checked - you're ready to create amazing mosaics! 🎉

---

**Happy Creating!** 🎨
