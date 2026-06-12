import './App.css'

function App() {
  return (
    <div className="app">
      <Header />
      <Hero />
      <Features />
      <Download />
      <Footer />
    </div>
  )
}

export default App

function Header() {
  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <img src="logo.png" alt="Rustype" width="32" height="32" />
          <span>Rustype</span>
        </div>
        <nav className="nav">
          <a href="#features">Features</a>
          <a href="#download">Download</a>
          <a href="https://github.com/sandhope/rustype" target="_blank" rel="noopener noreferrer">GitHub</a>
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <h1>Lightweight & High-performance</h1>
          <h2>Markdown Editor</h2>
          <p>Built with Tauri and React for speed and usability.</p>
          <div className="hero-buttons">
            <a href="#download" className="btn btn-primary">Get Started</a>
            <a href="https://github.com/sandhope/rustype" className="btn btn-secondary" target="_blank" rel="noopener noreferrer">View on GitHub</a>
          </div>
        </div>
        <div className="hero-image">
          <div className="editor-preview">
            <div className="editor-header">
              <div className="editor-tabs">
                <div className="tab active">README.md</div>
              </div>
            </div>
            <div className="editor-content">
              <pre><code># Welcome to Rustype

A lightweight Markdown editor built with **Tauri** and **React**.

## Features

- Fast and responsive
- Beautiful themes
- Export to multiple formats</code></pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Features() {
  const features = [
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Built with Tauri for native performance and minimal memory footprint.'
    },
    {
      icon: '🎨',
      title: 'Beautiful Themes',
      description: 'Multiple themes to suit your preferences and workflow.'
    },
    {
      icon: '📝',
      title: 'Rich Editing',
      description: 'Support for tables, code blocks, math formulas and more.'
    },
    {
      icon: '💾',
      title: 'Auto-save',
      description: 'Never lose your work with automatic saving.'
    },
    {
      icon: '🌙',
      title: 'Dark Mode',
      description: 'Switch between light and dark themes with ease.'
    },
    {
      icon: '📤',
      title: 'Export',
      description: 'Export to PDF, HTML and other formats.'
    }
  ]

  return (
    <section id="features" className="features">
      <div className="container">
        <h2>Features</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <span className="feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Download() {
  return (
    <section id="download" className="download">
      <div className="container">
        <h2>Download</h2>
        <p className="download-subtitle">Available for macOS, Windows and Linux.</p>
        <div className="download-buttons">
          <a href="https://github.com/sandhope/rustype/releases/latest" className="download-btn mac">
            <span className="os-icon">🍎</span>
            <div className="os-info">
              <span className="os-name">macOS</span>
              <span className="os-version">Intel & Apple Silicon</span>
            </div>
          </a>
          <a href="https://github.com/sandhope/rustype/releases/latest" className="download-btn windows">
            <span className="os-icon">🪟</span>
            <div className="os-info">
              <span className="os-name">Windows</span>
              <span className="os-version">64-bit</span>
            </div>
          </a>
          <a href="https://github.com/sandhope/rustype/releases/latest" className="download-btn linux">
            <span className="os-icon">🐧</span>
            <div className="os-info">
              <span className="os-name">Linux</span>
              <span className="os-version">AppImage</span>
            </div>
          </a>
        </div>
        <p className="download-footer">Or download on <a href="https://github.com/sandhope/rustype/releases" target="_blank" rel="noopener noreferrer">GitHub Releases</a></p>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-logo">
            <img src="logo.png" alt="Rustype" width="24" height="24" />
            <span>Rustype</span>
          </div>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#download">Download</a>
            <a href="https://github.com/sandhope/rustype" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
        <div className="footer-copyright">
          <p>© 2026 Rustype. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}