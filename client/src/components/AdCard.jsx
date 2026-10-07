import { useEffect, useRef, useState } from 'react'
import { getConfig } from '@/config'
import { adAPI } from '@/lib/api'
import { AiFillYoutube, AiOutlineLink, AiOutlineArrowRight } from 'react-icons/ai'

/**
 * AdCard — renders differently based on `size` prop:
 *   'full'    → large card, used in the main feed
 *   'compact' → small horizontal banner, used in notifications / explore / profile
 */
export default function AdCard({ ad, size = 'full' }) {
  const ref = useRef(null)
  const config = getConfig()
  const tracked = useRef(false)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !tracked.current) {
          tracked.current = true
          adAPI.impression(ad.id).catch(() => {})
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ad.id])

  const handleClick = () => {
    adAPI.click(ad.id).catch(() => {})
    if (ad.cta_url && ad.cta_url !== '#') window.open(ad.cta_url, '_blank')
  }

  const getYoutubeId = (url) => {
    const match = url?.match(/^.*(youtu.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]*)/)
    return match && match[2].length === 11 ? match[2] : null
  }
  const ytId = ad.type === 'youtube' ? getYoutubeId(ad.youtube_url) : null

  const label = config.ads?.sponsoredLabel || 'Sponsored'

  // ── Compact banner (notifications / explore) ─────────────────────
  if (size === 'compact') {
    return (
      <div
        ref={ref}
        onClick={handleClick}
        className="mx-3 my-2 rounded-xl overflow-hidden cursor-pointer group transition-all active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, var(--primary-light) 0%, #EFF6FF 100%)',
          border: '1px solid rgba(37,99,235,0.15)',
        }}
      >
        <div className="flex items-center gap-3 p-3">
          {/* Sponsored label */}
          <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
            style={{ background: 'var(--primary)' }}>
            <AiOutlineLink size={18} color="white" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Sponsored badge */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--primary)' }}>
                {label}
              </span>
            </div>
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-1)' }}>{ad.title}</p>
            {ad.caption && <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-3)' }}>{ad.caption}</p>}
          </div>

          <div className="shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors group-hover:bg-opacity-90"
            style={{ background: 'var(--primary)', color: 'white' }}>
            {ad.cta_text || 'View'}
            <AiOutlineArrowRight size={12} />
          </div>
        </div>
      </div>
    )
  }

  // ── Full card (main feed) ─────────────────────────────────────────
  return (
    <div
      ref={ref}
      className="relative overflow-hidden"
      style={{
        background: 'var(--background)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Sponsored top bar — highlighted but not overbearing */}
      <div
        className="flex items-center gap-2 px-4 py-2 border-b"
        style={{
          background: 'linear-gradient(to right, #FEF3C7, #FDE68A)',
          borderColor: '#FCD34D',
          borderLeft: '3px solid #D97706',
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#D97706' }} />
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#92400E' }}>
          {label}
        </span>
        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(217,119,6,0.15)', color: '#B45309' }}>Ad</span>
      </div>

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            {ad.type === 'youtube'
              ? <AiFillYoutube size={22} style={{ color: '#EF4444' }} />
              : <AiOutlineLink size={18} style={{ color: 'var(--primary)' }} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-1)' }}>{ad.title}</p>
            {ad.cta_url && ad.cta_url !== '#' && (
              <p className="text-[10px] truncate" style={{ color: 'var(--text-3)' }}>
                {(() => { try { return new URL(ad.cta_url).hostname } catch { return ad.cta_url } })()}
              </p>
            )}
          </div>
        </div>

        {/* YouTube embed */}
        {ad.type === 'youtube' && ytId && (
          <div
            className="relative mb-3 rounded-xl overflow-hidden cursor-pointer group/yt"
            style={{ aspectRatio: '16/9', background: '#000' }}
            onClick={() => setIsPlaying(true)}
          >
            {!isPlaying ? (
              <>
                <img
                  src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl group-hover/yt:scale-110 transition-transform"
                    style={{ background: '#EF4444' }}>
                    <div className="ml-1 border-l-[16px] border-l-white border-t-[9px] border-t-transparent border-b-[9px] border-b-transparent" />
                  </div>
                </div>
              </>
            ) : (
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            )}
          </div>
        )}

        {/* Image */}
        {ad.image && ad.type !== 'youtube' && (
          <div
            className="relative mb-3 rounded-xl overflow-hidden cursor-pointer group/img"
            onClick={handleClick}
            style={{ maxHeight: 280 }}
          >
            <img
              src={ad.image}
              alt={ad.title}
              className="w-full object-cover transition-transform duration-500 group-hover/img:scale-105"
              style={{ maxHeight: 280 }}
            />
          </div>
        )}

        {/* Caption */}
        {ad.caption && (
          <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-2)' }}>{ad.caption}</p>
        )}

        {/* CTA button with subtle pulse animation */}
        <button
          onClick={handleClick}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] btn-cta-pulse"
          style={{
            background: 'var(--primary)',
            color: 'white',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
        >
          <span>{ad.cta_text || 'Learn More'}</span>
          <AiOutlineArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
