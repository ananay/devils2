'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils'

interface Review {
  id: number
  rating: number
  content: string
  createdAt: Date
  user: {
    id: number
    name: string
    avatarUrl: string | null
  }
}

interface ReviewSectionProps {
  productId: number
  reviews: Review[]
}

export function ReviewSection({ productId, reviews: initialReviews }: ReviewSectionProps) {
  const [reviews, setReviews] = useState(initialReviews)
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<{ name: string } | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, content }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      setReviews([data.review, ...reviews])
      setContent('')
      setRating(5)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="border-t border-charcoal-800 pt-12">
      <h2 className="font-serif text-3xl font-bold text-white mb-8">Customer Reviews</h2>

      {/* Review Form */}
      {user ? (
        <div className="glass rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Write a Review</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-charcoal-300 mb-2">Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <svg
                      className={`w-8 h-8 transition-colors ${
                        star <= rating ? 'text-gold-500' : 'text-charcoal-600'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Review Content */}
            <div>
              <label className="block text-sm font-medium text-charcoal-300 mb-2">Your Review</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-charcoal-900 border border-charcoal-700 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent text-white placeholder-charcoal-500 resize-none"
                placeholder="Share your thoughts about this product..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-burgundy-700 to-burgundy-800 text-white rounded-lg font-semibold hover:from-burgundy-600 hover:to-burgundy-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      ) : (
        <div className="glass rounded-xl p-6 mb-8 text-center">
          <p className="text-charcoal-400">
            <a href="/login" className="text-gold-500 hover:text-gold-400">Sign in</a> to leave a review
          </p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <p className="text-charcoal-400 text-center py-8">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="glass rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-charcoal-700 flex items-center justify-center text-xl">
                  {review.user.avatarUrl ? (
                    <img
                      src={review.user.avatarUrl}
                      alt={review.user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{review.user.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">{review.user.name}</span>
                    <span className="text-charcoal-500 text-sm">{formatDate(review.createdAt)}</span>
                  </div>
                  <div className="flex items-center mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${star <= review.rating ? 'text-gold-500' : 'text-charcoal-600'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  {/* SECURITY FIX: Removed dangerouslySetInnerHTML to prevent XSS attacks. */}
                  <p className="text-charcoal-300 whitespace-pre-wrap">
                    {review.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}