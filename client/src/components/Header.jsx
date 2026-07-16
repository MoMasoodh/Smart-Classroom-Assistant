import "./Header.css";

function Header({ title, subtitle, actions }) {

  return (

    <header className="header">

      <div>

        <h1>{title}</h1>

        <p>{subtitle}</p>

      </div>

      {actions ? <div className="header-actions">{actions}</div> : null}

    </header>

  );

}

export default Header;