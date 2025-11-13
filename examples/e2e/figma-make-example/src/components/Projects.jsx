import './Projects.css';

function Projects() {
  const projects = [
    {
      title: 'E-Commerce Platform',
      description: 'Modern shopping experience with seamless checkout',
      color: '#6366f1',
    },
    {
      title: 'Fitness Tracking App',
      description: 'Track workouts and nutrition with smart insights',
      color: '#ec4899',
    },
    {
      title: 'Real Estate Portal',
      description: 'Find your dream home with AI-powered search',
      color: '#10b981',
    },
  ];

  return (
    <section className="projects">
      <div className="projects-container">
        <h2 className="projects-title">Featured Projects</h2>
        <p className="projects-subtitle">
          Pixel-perfect designs transformed into production-ready applications
        </p>

        <div className="projects-grid">
          {projects.map((project, index) => (
            <div key={index} className="project-card">
              <div
                className="project-image"
                style={{ backgroundColor: project.color + '20' }}
              >
                <div
                  className="project-icon"
                  style={{ backgroundColor: project.color }}
                />
              </div>
              <h3 className="project-title">{project.title}</h3>
              <p className="project-description">{project.description}</p>
              <button className="project-link">
                View Project →
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Projects;
