import './Hero.css';

function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-badge">
          Designed in Figma
        </div>
        <h1 className="hero-title">
          Creative Developer
          <br />
          <span className="hero-highlight">& Designer</span>
        </h1>
        <p className="hero-description">
          Crafting beautiful digital experiences with pixel-perfect precision.
          From Figma to production-ready code.
        </p>
        <div className="hero-buttons">
          <button className="button button-primary">View Projects</button>
          <button className="button button-secondary">Get in Touch</button>
        </div>
      </div>
      <div className="hero-image">
        <div className="hero-placeholder">
          <svg width="400" height="400" viewBox="0 0 400 400" fill="none">
            <rect width="400" height="400" rx="200" fill="#6366f1" opacity="0.1"/>
            <circle cx="200" cy="200" r="150" fill="#6366f1" opacity="0.2"/>
            <circle cx="200" cy="200" r="100" fill="#6366f1" opacity="0.3"/>
          </svg>
        </div>
      </div>
    </section>
  );
}

export default Hero;
