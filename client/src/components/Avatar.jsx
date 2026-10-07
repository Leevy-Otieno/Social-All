import { AiOutlineUser } from 'react-icons/ai'
import { FaReact } from 'react-icons/fa'
import { getImageUrl } from '@/lib/utils'

export default function Avatar({ src, name, size = 40, className = '', isReactIcon = false }) {
  const style = { 
    width: size, 
    height: size, 
    minWidth: size, 
    minHeight: size,
    fontSize: size > 50 ? 18 : 14 
  }
  
  if (src) {
    return (
      <div className={`shrink-0 overflow-hidden rounded-full border border-border bg-surface ${className}`} style={style}>
        <img
          src={getImageUrl(src)}
          alt={name || 'avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
            e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center text-primary bg-primary/5"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" height="60%" width="60%" xmlns="http://www.w3.org/2000/svg"><path d="M858.5 763.6a374 374 0 0 0-80.6-119.5 375.63 375.63 0 0 0-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-.4.2-.8.3-1.2.5-44.8 18.9-85 46-119.5 80.6a375.63 375.63 0 0 0-80.6 119.5A371.7 371.7 0 0 0 136 901.8a8 8 0 0 0 8 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.4 3.6 7.8 8 7.8h60a8 8 0 0 0 8-8.2c-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362s17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362s-17.9 89.1-50.4 121.6S557.9 534 512 534z"></path></svg></div>';
          }}
        />
      </div>
    )
  }

  return (
    <div
      className={`shrink-0 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 border border-border ${className}`}
      style={style}
    >
      <AiOutlineUser size={size * 0.6} />
    </div>
  )
}
