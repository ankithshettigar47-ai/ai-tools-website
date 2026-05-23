import React from 'react'
import { Question } from '../types/question'

interface QuestionListProps {
  questions: Question[]
  onQuestionSelect: (question: Question) => void
  selectedQuestion: Question | null
}

const QuestionList: React.FC<QuestionListProps> = ({ 
  questions, 
  onQuestionSelect, 
  selectedQuestion 
}) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">
          Interview Questions
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {questions.length} questions available
        </p>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {questions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No questions found. Try adjusting your search or filter.
          </div>
        ) : (
          questions.map((question) => (
            <div
              key={question.id}
              className={`p-4 border-b cursor-pointer transition-colors ${
                selectedQuestion?.id === question.id
                  ? 'bg-blue-50 border-blue-200'
                  : 'hover:bg-gray-50 border-gray-100'
              }`}
              onClick={() => onQuestionSelect(question)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900 text-sm">
                  {question.title}
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {question.category}
                </span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2">
                {question.question}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default QuestionList