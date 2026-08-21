import "./DashboardCard.css";

function DashboardCard({ icon, title, description, onClick, footer, badge }) {

    return (

        <div
            className="dashboard-card"
            onClick={onClick}
        >
            {badge ? <div className="card-badge-pill">{badge}</div> : null}

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