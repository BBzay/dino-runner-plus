# Deployment Guide

## Building for Production

```bash
# Install dependencies (if not already done)
npm install

# Run full build (TypeScript check + Vite production bundle)
npm run build
```

This outputs static files to `dist/`:

```
dist/
  index.html           (~1 KB)
  assets/
    index-XXXXX.js     (~575 KB, ~145 KB gzipped)
```

The entire game is a single HTML file and one JS bundle. No server-side logic, no API calls, no external assets.

### Preview Locally

```bash
npm run preview
```

Opens the production build on a local server (usually `http://localhost:4173`).

## Deployment Options

### GitHub Pages

1. Build the project:
   ```bash
   npm run build
   ```

2. Option A -- Deploy `dist/` manually:
   - Push the `dist/` folder contents to a `gh-pages` branch
   - Enable GitHub Pages in repo settings, source: `gh-pages` branch

3. Option B -- Use `gh-pages` package:
   ```bash
   npx gh-pages -d dist
   ```

4. Option C -- GitHub Actions (automated):
   Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [main]
   permissions:
     contents: read
     pages: write
     id-token: write
   jobs:
     deploy:
       runs-on: ubuntu-latest
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
         - run: npm ci
         - run: npm run build
         - uses: actions/upload-pages-artifact@v3
           with:
             path: dist
         - id: deployment
           uses: actions/deploy-pages@v4
   ```

**Note:** If deploying to a subpath (e.g., `username.github.io/dino-runner-plus/`), set the base in `vite.config.ts`:
```ts
export default defineConfig({
  base: '/dino-runner-plus/',
});
```

### Netlify

1. Connect your Git repository in the Netlify dashboard
2. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Deploy. Netlify handles the rest, including HTTPS.

Alternatively, drag-and-drop the `dist/` folder onto [Netlify Drop](https://app.netlify.com/drop).

### Vercel

```bash
npx vercel --prod
```

Or connect the repo in the Vercel dashboard. It auto-detects Vite projects.

### Any Static Host

The `dist/` folder is fully self-contained static files. Upload it to any static hosting:
- AWS S3 + CloudFront
- Cloudflare Pages
- Firebase Hosting
- Surge (`npx surge dist`)

## Performance Considerations

### Bundle Size
- Total JS: ~575 KB raw, **~145 KB gzipped**
- Three.js accounts for most of the bundle size
- Vite tree-shakes unused Three.js modules automatically

### Runtime Performance
- Target: **60 fps** on modern hardware
- Fixed 60Hz game loop with render interpolation
- Object pooling for obstacles, coins, power-ups, and particles (no runtime allocation during gameplay)
- InstancedMesh for 200 particles (single draw call)
- `devicePixelRatio` capped at 2 to prevent GPU strain on high-DPI displays
- Shadow map: 1024x1024 (good balance of quality and performance)

### Optimization Tips
- The game auto-pauses on tab switch (`visibilitychange`), saving GPU cycles
- Lower-end devices benefit from closing other GPU-intensive tabs
- Mobile browsers may throttle WebGL when battery is low

## Browser Testing Checklist

### Desktop

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | Primary target |
| Firefox | 90+ | Supported |
| Edge | 90+ | Supported |
| Safari | 15.4+ | Supported (test WebGL carefully) |

### Mobile

| Platform | Browser | Notes |
|----------|---------|-------|
| iOS | Safari 15.4+ | Touch input, responsive layout |
| iOS | Chrome | Uses WebKit engine on iOS |
| Android | Chrome | Primary mobile target |
| Android | Firefox | Supported |

### What to Test

- [ ] Game loads without console errors
- [ ] 3D scene renders (WebGL canvas visible)
- [ ] Menu screen shows with character selector
- [ ] Character selection works (arrow keys / click)
- [ ] Game starts on Space / tap
- [ ] Player jumps and ducks correctly
- [ ] Obstacles spawn and scroll
- [ ] Coins spawn and can be collected
- [ ] Power-ups spawn and activate (shield bubble, speed streaks, wings)
- [ ] Collision detection works (game over on hit)
- [ ] Score increments during gameplay
- [ ] High score saves and displays on restart
- [ ] Game over screen shows with score summary
- [ ] Restart works from game over screen
- [ ] Backspace returns to menu from game over
- [ ] Audio plays (SFX + music)
- [ ] Mute button toggles audio (persists on reload)
- [ ] Day/night cycle transitions smoothly
- [ ] Particle effects render (dust, sparks)
- [ ] Screen shake on collision
- [ ] No frame drops below 30fps during normal gameplay
- [ ] Touch controls work on mobile (tap = jump, hold low = duck)
- [ ] Layout scales correctly on different screen sizes
- [ ] Game pauses when switching tabs

## Troubleshooting

### Blank screen / no WebGL
- Check browser supports WebGL 2.0: visit `chrome://gpu` or [get.webgl.org](https://get.webgl.org)
- Ensure hardware acceleration is enabled in browser settings
- Update GPU drivers

### No audio
- Browsers require a user interaction before playing audio. The first tap/click enables it.
- Check the mute button (top right of game, or press M)

### Poor performance
- Close other GPU-intensive tabs
- Reduce browser window size (fewer pixels to render)
- Check `devicePixelRatio` -- high-DPI displays render more pixels
- Disable browser extensions that inject into pages
