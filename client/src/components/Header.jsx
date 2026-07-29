import "./Header.css";

function Header({ title, subtitle, actions }) {
  return (
    <header className="header fade-in">
      <div className="header-title-group">
        <h1 className="header-title">{title}</h1>
        {subtitle ? <p className="header-subtitle">{subtitle}</p> : null}
      </div>

      {actions ? <div className="header-actions">{actions}</div> : null}
    </header>
  );
}

export default Header;