import { useState, useEffect } from 'react'
import QuestionList from './components/QuestionList'
import QuestionDetail from './components/QuestionDetail'
import SearchBar from './components/SearchBar'
import CategoryFilter from './components/CategoryFilter'
import { Question } from './types/question'

function App() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    try {
      // For now, we'll use mock data
      // Later we'll replace this with Tauri API calls
      const mockQuestions: Question[] = [
        {
          id: '1',
          title: 'Tell me about yourself',
          category: 'Software Engineering',
          question: 'Tell me about yourself.',
          answer: 'I am a software engineer focused on building reliable web applications. My recent work has centered on backend services, frontend integration, and improving performance in existing products. I add the most value when a project needs structure, clear debugging, and steady execution.',
          tip: 'Keep it to present role, relevant strengths, and one or two outcomes.',
          slug: 'tell-me-about-yourself'
        },
        {
          id: '2',
          title: 'var vs let vs const',
          category: 'JavaScript',
          question: 'What is the difference between var, let, and const?',
          answer: 'var is function-scoped and can be redeclared. let is block-scoped and can be reassigned. const is block-scoped and cannot be reassigned after initialization. In modern JavaScript, const is the default and let is used when a value must change.',
          tip: 'Mention scope, reassignment, and hoisting behavior.',
          slug: 'var-let-const'
        }
      ]
      
      setQuestions(mockQuestions)
      setFilteredQuestions(mockQuestions)
      
      const uniqueCategories = ['All', ...Array.from(new Set(mockQuestions.map(q => q.category)))]
      setCategories(uniqueCategories)
    } catch (error) {
      console.error('Failed to load questions:', error)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    filterQuestions(query, selectedCategory)
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    filterQuestions(searchQuery, category)
  }

  const filterQuestions = (query: string, category: string) => {
    let filtered = questions

    if (category !== 'All') {
      filtered = filtered.filter(q => q.category === category)
    }

    if (query.trim()) {
      const queryLower = query.toLowerCase()
      filtered = filtered.filter(q => 
        q.title.toLowerCase().includes(queryLower) ||
        q.question.toLowerCase().includes(queryLower) ||
        q.answer.toLowerCase().includes(queryLower)
      )
    }

    setFilteredQuestions(filtered)
  }

  const handleQuestionSelect = (question: Question) => {
    setSelectedQuestion(question)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">AI Interview Tools</h1>
            <div className="flex items-center space-x-4">
              <SearchBar onSearch={handleSearch} />
              <CategoryFilter 
                categories={categories} 
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <QuestionList 
              questions={filteredQuestions} 
              onQuestionSelect={handleQuestionSelect}
              selectedQuestion={selectedQuestion}
            />
          </div>
          
          <div className="lg:col-span-2">
            {selectedQuestion ? (
              <QuestionDetail question={selectedQuestion} />
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  Select a question to view details
                </h2>
                <p className="text-gray-500">
                  Choose from the list of interview questions on the left to see detailed answers and tips.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App