import { MdVerified } from 'react-icons/md'

export default function VerifiedBadge({ className = '', size = 16 }) {
  return (
    <MdVerified
      size={size}
      className={`shrink-0 ${className}`}
      style={{ 
        color: '#1d9bf0', 
        filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.1))',
        display: 'inline-block',
        verticalAlign: 'text-bottom'
      }}
      title="Verified"
    />
  )
}
