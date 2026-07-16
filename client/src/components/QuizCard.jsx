function QuizCard({ question, index, total, selectedAnswer, onSelect }) {
	return (
		<section className="quiz-card">
			<div className="quiz-card-header">
				<span>Question {index + 1}</span>
				<span>{index + 1} of {total}</span>
			</div>
			<h3>{question.question}</h3>
			<div className="quiz-options">
				{question.options.map((option) => (
					<button
						key={option}
						type="button"
						className={selectedAnswer === option ? "quiz-option active" : "quiz-option"}
						onClick={() => onSelect(option)}
					>
						{option}
					</button>
				))}
			</div>
		</section>
	);
}

export default QuizCard;
