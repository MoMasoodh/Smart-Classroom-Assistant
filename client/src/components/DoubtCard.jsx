function DoubtCard({ doubt, onAnswer, onAiAnswer, readOnly = false }) {
	return (
		<article className="doubt-card">
			<div className="doubt-card-head">
				<div>
					<span className={`status-pill ${doubt.status?.toLowerCase() || "pending"}`}>
						{doubt.status || "Pending"}
					</span>
					<h3>{doubt.studentName}</h3>
					<p>{doubt.subject}</p>
				</div>
				<span className="doubt-date">
					{doubt.createdAt ? new Date(doubt.createdAt).toLocaleString() : ""}
				</span>
			</div>

			<p className="doubt-question">{doubt.question}</p>

			{doubt.answer ? (
				<div className="doubt-answer">
					<strong>Teacher Answer</strong>
					<p>{doubt.answer}</p>
				</div>
			) : null}

			{!readOnly ? (
				<div className="doubt-actions">
					{onAnswer ? <button onClick={onAnswer}>Answer</button> : null}
					{onAiAnswer ? <button className="secondary" onClick={onAiAnswer}>AI Answer</button> : null}
				</div>
			) : null}
		</article>
	);
}

export default DoubtCard;
