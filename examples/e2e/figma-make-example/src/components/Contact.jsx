import './Contact.css';

function Contact() {
  return (
    <section className="contact">
      <div className="contact-container">
        <h2 className="contact-title">Let's Work Together</h2>
        <p className="contact-description">
          Have a project in mind? Let's turn your Figma designs into beautiful,
          production-ready applications.
        </p>

        <div className="contact-info">
          <div className="contact-item">
            <div className="contact-icon">📧</div>
            <h3>Email</h3>
            <p>hello@example.com</p>
          </div>

          <div className="contact-item">
            <div className="contact-icon">💼</div>
            <h3>LinkedIn</h3>
            <p>linkedin.com/in/yourname</p>
          </div>

          <div className="contact-item">
            <div className="contact-icon">🐙</div>
            <h3>GitHub</h3>
            <p>github.com/yourname</p>
          </div>
        </div>

        <button className="contact-button">Get in Touch</button>

        <footer className="contact-footer">
          <p>Designed in Figma • Built with React & Vite • Dockerized with vibe-to-docker</p>
        </footer>
      </div>
    </section>
  );
}

export default Contact;
