import { Link } from 'react-router-dom';

const NotFound = () => (
  <section>
    <div className="container">
      <div className="tool-result-box fade-in" style={{ marginTop: '2rem' }}>
        <div className="tool-result-icon">404</div>
        <div className="tool-result-title">Page Not Found</div>
        <p className="tool-result-meta">
          The page you are looking for does not exist or may have been moved.
        </p>
        <div className="tool-result-actions">
          <Link to="/" className="btn btn-primary">Go Home</Link>
          <Link to="/tools" className="btn btn-outline">Browse Tools</Link>
        </div>
      </div>
    </div>
  </section>
);

export default NotFound;
