# QuantumFlow Desktop ⚛️

The desktop version of the **QuantumFlow** quantum computing simulator. Built with Electron, it provides a seamless, high-performance experience for building and visualizing quantum circuits.

## 🚀 Features

- **Full Simulator Access**: All the features of the web version, including the AI-powered assistant and 3D Bloch sphere visualization.
- **Native Experience**: Desktop integration with custom window controls and state persistence.
- **Offline Ready**: Bundled with the Next.js static export for fast, offline access.
- **AI Assistant**: Natural language processing to help you understand and generate quantum circuits.
- **Cross-Platform**: Support for Windows, macOS (via ZIP), and Linux (DEB/RPM).

## 🛠️ Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run in development mode:
   ```bash
   npm start
   ```

### Building the Web Application

The Electron application depends on the static export of the main Next.js application. Before packaging, ensure the main app is built:

```bash
# From the project root
npm run build
```

### Packaging

To package the application for your current platform:

```bash
# Package the app
npm run package

# Create installers (e.g., .exe for Windows)
npm run make
```

The output will be located in the `out/` directory.

## 🏗️ Architecture

- **Main Process**: Electron + TypeScript
- **Renderer**: Next.js Static Export (loaded via custom `app://` protocol)
- **Styling**: Tailwind CSS (inherited from the web project)
- **Bundler**: Webpack + Electron Forge

## 🧩 Tech Stack

- **Electron**: Core framework for desktop application.
- **Next.js**: Powering the user interface.
- **Lucide React**: For beautiful icons.
- **TypeScript**: Ensuring type safety across the board.
- **Electron Forge**: Simplifies the build and distribution process.

---

Built with Passion for Quantum Computing.
