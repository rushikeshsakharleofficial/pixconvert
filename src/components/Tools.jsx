import { Outlet, Navigate, useLocation } from 'react-router-dom';

const Tools = () => {
  const location = useLocation();
  if (location.pathname === '/tools' || location.pathname === '/tools/') {
    return <Navigate to="/tools/converter" replace />;
  }

  return (
    <section>
      <div className="container">
        <h2 className="section-title fade-in visible">
          {location.pathname.includes('gif') ? '🎞️ GIF Maker' : '🔄 Universal Converter'}
        </h2>
        <p className="section-subtitle fade-in visible">All processing happens right here in your browser — nothing is uploaded</p>
        <div className="glass fade-in visible" style={{ marginTop: '1rem' }}>
          <Outlet />
        </div>
      </div>
    </section>
  );
};

export default Tools;
