import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function FormattedText({ text, className = '', truncateLines = 0 }) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  
  if (!text) return null

  const parts = text.split(/([@#][a-zA-Z0-9_]+)/g)
  
  const shouldTruncate = truncateLines > 0 && !expanded && text.length > 50

  return (
    <div className={className}>
      <p className={shouldTruncate ? `line-clamp-${truncateLines} inline` : 'inline'}>
        {parts.map((part, i) => {
          if (part.startsWith('@')) {
            const username = part.slice(1)
            return (
              <span
                key={i}
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/profile/${username}`)
                }}
                className="text-primary hover:underline cursor-pointer font-medium"
              >
                {part}
              </span>
            )
          }
          if (part.startsWith('#')) {
            const tag = part.slice(1)
            return (
              <span
                key={i}
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/explore?q=${tag}`)
                }}
                className="text-primary hover:underline cursor-pointer font-medium"
              >
                {part}
              </span>
            )
          }
          return <span key={i}>{part}</span>
        })}
      </p>
      {shouldTruncate && (
        <button 
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(true)
          }}
          className="text-text-muted text-xs font-bold ml-1 hover:text-text-secondary"
        >
          ...more
        </button>
      )}
    </div>
  )
}
