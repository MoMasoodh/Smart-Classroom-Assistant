import "./Header.css";

function Header({ title, subtitle }) {

  return (

    <div className="header">

      <div>

        <h1>{title}</h1>

        <p>{subtitle}</p>

      </div>

    </div>

  );

}

export default Header;