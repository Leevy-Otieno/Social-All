import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { postAPI } from '@/lib/api'
import PostCard from '@/components/PostCard'
import { AiOutlineArrowLeft } from 'react-icons/ai'

export default function PostPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    postAPI.get(postId).then(r => setPost(r.data.post)).catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [postId, navigate])

  return (
    <div className="min-h-screen fade-in">
      {/* Header */}
      <div
        className="sticky top-0 z-20 flex items-center gap-3 px-4 h-12 border-b"
        style={{ background: 'rgba(255,255,255,0.95)', borderColor: 'var(--border)', backdropFilter: 'blur(12px)' }}
      >
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full" style={{ color: 'var(--text-2)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <AiOutlineArrowLeft size={20} />
        </button>
        <span className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>Post</span>
      </div>

      {loading ? (
        <div className="p-4 animate-pulse space-y-3">
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-full" style={{ background: 'var(--border)' }} />
            <div className="flex-1 space-y-2">
              <div className="h-3 rounded w-32" style={{ background: 'var(--border)' }} />
              <div className="h-3 rounded w-56" style={{ background: 'var(--border)' }} />
            </div>
          </div>
          <div className="h-64 rounded-xl" style={{ background: 'var(--border)' }} />
        </div>
      ) : post ? (
        <PostCard item={{ type: 'post', data: post }} />
      ) : null}
    </div>
  )
}
