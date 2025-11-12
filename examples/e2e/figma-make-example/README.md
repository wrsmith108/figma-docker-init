# Figma Make Example - Portfolio Website

This is a complete end-to-end example demonstrating how to use **vibe-to-docker** with a [Figma Make](https://www.figma.com) exported project.

## Project Overview

This is a portfolio website designed in Figma and built with:
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Vanilla CSS** - Custom styling (no framework)
- **Component-based architecture** - Modular design

This represents a typical workflow where designers create pixel-perfect designs in Figma, export them with Figma Make (or similar tools), and convert them to production-ready React applications.

## Project Structure

```
figma-make-example/
├── src/
│   ├── components/
│   │   ├── Hero.jsx          # Hero section
│   │   ├── Hero.css
│   │   ├── Projects.jsx      # Projects showcase
│   │   ├── Projects.css
│   │   ├── Contact.jsx       # Contact section
│   │   └── Contact.css
│   ├── App.jsx               # Main app component
│   ├── App.css               # Global styles
│   └── main.jsx              # React entry point
├── index.html                # HTML template
├── package.json              # Dependencies and scripts
├── vite.config.js            # Vite configuration
└── .vibe-docker/             # Generated Docker config (after running vibe-to-docker)
```

## Running Without Docker

First, install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Build for production:

```bash
npm run build
npm run preview
```

## Dockerizing with vibe-to-docker

### Step 1: Install vibe-to-docker

```bash
npm install -g vibe-to-docker
```

### Step 2: Initialize Docker Configuration

From the project root, run:

```bash
vibe-to-docker basic
```

Or for a UI-optimized setup:

```bash
vibe-to-docker ui-heavy
```

This will:
1. Detect your project type (React + Vite)
2. Auto-detect build output directory (`dist`)
3. Generate Docker configuration in `.vibe-docker/`
4. Assign available ports for services
5. Create `.env` from `.env.example`

### Step 3: Review Generated Configuration

Check the `.vibe-docker/` directory:

```
.vibe-docker/
├── Dockerfile            # Multi-stage Docker build
├── docker-compose.yml    # Service orchestration
├── .env                  # Environment variables
├── .env.example          # Environment template
├── nginx.conf            # Nginx configuration
└── DOCKER.md             # Docker documentation
```

### Step 4: Build and Run

Navigate to `.vibe-docker/` and start the containers:

```bash
cd .vibe-docker
docker-compose up -d --build
```

### Step 5: Access Your Application

The application will be available at:
- **Development**: http://localhost:3000 (hot reload enabled)
- **Production**: http://localhost:8080 (optimized build)
- **Nginx Proxy**: http://localhost:8888 (production with caching)

### Step 6: View Logs

```bash
cd .vibe-docker
docker-compose logs -f
```

## What Gets Detected

When you run `vibe-to-docker`, it automatically detects:

- **Project Name**: `figma-portfolio-site` (from package.json)
- **Framework**: `react-vite` (from dependencies)
- **TypeScript**: `false` (no TypeScript detected)
- **UI Library**: `none` (vanilla CSS)
- **Build Output**: `dist` (from vite.config.js)
- **Dependency Count**: ~10 (minimal dependencies)

## Figma-to-Code Workflow

This example represents a common workflow:

### 1. Design in Figma
- Create pixel-perfect designs
- Define components and variants
- Set up auto-layout and constraints
- Export design specifications

### 2. Export with Figma Make
- Use Figma Make plugin to export React components
- Generate component structure
- Extract CSS styles
- Create asset exports

### 3. Refine Code
- Organize components
- Add interactivity
- Implement state management
- Optimize performance

### 4. Dockerize with vibe-to-docker
- Run `vibe-to-docker` CLI
- Review generated configuration
- Build and deploy

## Design System Features

This example demonstrates:

1. **Component-based Architecture** - Reusable UI components
2. **Responsive Design** - Mobile-first approach
3. **Custom CSS** - No framework dependencies
4. **Semantic HTML** - Accessible markup
5. **Performance** - Optimized assets and code splitting

## Typical Figma Make Features

Figma Make exports typically include:

1. **React Components** - JSX with props
2. **CSS Modules** - Scoped styles per component
3. **Assets** - Optimized images and icons
4. **Typography** - Font families and sizes
5. **Colors** - Design tokens for consistency
6. **Spacing** - Consistent padding and margins
7. **Animations** - CSS transitions and keyframes

## Benefits of Docker

Once Dockerized:

✅ **Consistent Environment** - Same design rendering everywhere
✅ **Easy Deployment** - Deploy to any Docker host
✅ **Isolated Dependencies** - No conflicts with other projects
✅ **Production-Ready** - Nginx serving optimized assets
✅ **Scalable** - Easy to add backend services

## Advanced Configuration

### Adding Image Optimization

Edit `.vibe-docker/Dockerfile` to add image optimization:

```dockerfile
RUN npm install --save-dev imagemin imagemin-webp
RUN npm run optimize-images
```

### Custom Fonts

Add custom fonts to `public/fonts/` and update CSS:

```css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/CustomFont.woff2') format('woff2');
}
```

### Environment Variables

For dynamic configuration, add to `.vibe-docker/.env`:

```env
VITE_API_URL=https://api.example.com
VITE_ANALYTICS_ID=your-analytics-id
```

Access in React:
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

## Troubleshooting

### Build Errors

Ensure all assets are in the correct location:

```bash
npm run build
```

### Styling Issues

Check that CSS imports are correct:
```javascript
import './Component.css';
```

### Port Conflicts

Check `.vibe-docker/.env` for assigned ports. Modify if needed:

```env
DEV_PORT=3000
PROD_PORT=8080
NGINX_PORT=8888
```

### Assets Not Loading

Ensure assets are in the `public/` directory or imported in components:

```javascript
import logo from './assets/logo.png';
```

## Design Handoff Best Practices

### For Designers

1. **Use consistent naming** - Component names match code
2. **Organize layers** - Clear hierarchy in Figma
3. **Export assets** - 1x, 2x, 3x for different screens
4. **Document components** - Add descriptions and usage notes
5. **Define spacing** - Use 8px grid system
6. **Set constraints** - Define responsive behavior

### For Developers

1. **Review design specs** - Understand spacing, colors, typography
2. **Plan component structure** - Map Figma components to React
3. **Extract design tokens** - Colors, spacing, typography
4. **Implement responsively** - Mobile-first approach
5. **Test across devices** - Ensure pixel-perfect rendering
6. **Optimize assets** - Compress images, lazy load

## Deployment Options

### Simple Hosting

For static hosting:
```bash
npm run build
# Deploy dist/ to Netlify, Vercel, or similar
```

### Docker Deployment

For containerized deployment:
```bash
cd .vibe-docker
docker-compose up -d
```

### Cloud Platforms

- **Vercel**: Connect GitHub repo for auto-deployment
- **Netlify**: Drag-and-drop `dist/` folder
- **AWS S3**: Static website hosting
- **DigitalOcean App Platform**: Container deployment

## Learn More

- [Figma Documentation](https://help.figma.com)
- [Figma Make Plugin](https://www.figma.com/community)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Docker Documentation](https://docs.docker.com)
- [vibe-to-docker GitHub](https://github.com/wrsmith108/vibe-to-docker)

## Support

For issues specific to this example or vibe-to-docker, please visit:
https://github.com/wrsmith108/vibe-to-docker/issues
