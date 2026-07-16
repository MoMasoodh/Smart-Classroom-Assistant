import { Link } from "react-router-dom";

function Navbar() {
	return (
		<header className="navbar">
			<Link to="/" className="navbar-brand">
				Smart Classroom Assistant
			</Link>

			<nav className="navbar-links">
				<Link to="/student-login">Student Join</Link>
				<Link to="/teacher-login">Teacher Login</Link>
			</nav>
		</header>
	);
}

export default Navbar;
