/* Footer component */
const { Link: FooterLink } = ReactRouterDOM;

const Footer = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer-links">
        {[["/","Home"],["/tools","Tools"],["/about","About"],["/privacy","Privacy"],["/contact","Contact"]].map(([href,label]) => (
          <FooterLink to={href} key={label}>{label}</FooterLink>
        ))}
      </div>
      <p>© {new Date().getFullYear()} PixConvert. All rights reserved. Built with ❤️ — 100% client-side.</p>
    </div>
  </footer>
);
window.Footer = Footer;
