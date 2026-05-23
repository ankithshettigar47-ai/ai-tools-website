import React from 'react'
import { Question } from '../types/question'

interface QuestionDetailProps {
  question: Question
}

const QuestionDetail: React.FC<QuestionDetailProps> = ({ question }) => {
  return (
    <div className="bg-white rounded-lg shadow fade-in">
      <div className="p-6 border-b">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {question.title}
          </h2>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            {question.category}
          </span>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Question
            </h3>
            <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
              {question.question}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Answer
            </h3>
            <div className="text-gray-900 bg-blue-50 p-4 rounded-lg leading-relaxed">
              {question.answer}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Expert Tip
            </h3>
            <div className="text-sm text-gray-700 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
              💡 {question.tip}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6 bg-gray-50 border-t">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Question ID: {question.slug}
          </div>
          <div className="flex space-x-2">
            <button className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
              Copy Answer
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
              Add Note
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionDetail