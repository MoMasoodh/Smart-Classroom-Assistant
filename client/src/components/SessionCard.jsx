function SessionCard({ session, onManage, onClose, onOpen }) {
	const createdDate = session?.createdAt ? new Date(session.createdAt).toLocaleDateString() : "—";
	const status = session?.isActive ? "Active" : "Closed";

	return (
		<div className="session-card">
			<div className="session-card-top">
				<div>
					<span className={`status-pill ${status.toLowerCase()}`}>{status}</span>
					<h3>{session.sessionName}</h3>
					<p>{session.subject}</p>
				</div>
				<div className="session-code">{session.sessionCode}</div>
			</div>

			<div className="session-meta">
				<span>Duration: {session.duration} min</span>
				<span>Created: {createdDate}</span>
			</div>

			<div className="session-actions">
				{onManage ? <button onClick={onManage}>Manage Session</button> : null}
				{onOpen ? <button className="secondary" onClick={onOpen}>Open</button> : null}
				{onClose ? <button className="danger" onClick={onClose}>Close Session</button> : null}
			</div>
		</div>
	);
}

export default SessionCard;
