import "./DashboardCard.css";

function DashboardCard({ icon, title, description, onClick, footer }) {

    return (

        <div
            className="dashboard-card"
            onClick={onClick}
        >

            <div className="card-icon">
                {icon}
            </div>

            <h2>{title}</h2>

            <p>{description}</p>

            {footer ? <div className="dashboard-card-footer">{footer}</div> : null}

        </div>

    );

}

export default DashboardCard;