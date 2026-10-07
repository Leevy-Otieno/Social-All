import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(timestamp) {
  if (!timestamp) return ''
  
  // Handle SQLite datetime format "2024-01-15 12:30:45"
  let normalized = timestamp
  if (typeof timestamp === 'string' && timestamp.includes(' ') && !timestamp.includes('T')) {
    normalized = timestamp.replace(' ', 'T') + 'Z' // Assume SQLite stores UTC
  } else if (typeof timestamp === 'string' && !timestamp.endsWith('Z')) {
    normalized = timestamp + 'Z'
  }
  
  const d = new Date(normalized)
  if (isNaN(d.getTime())) return timestamp
  
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)
  
  if (diffInSeconds < 5) return 'Just now'
  if (diffInSeconds < 60) return `${diffInSeconds}s`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

export function formatFullDate(timestamp) {
  if (!timestamp) return ''
  let normalized = timestamp
  if (typeof timestamp === 'string' && timestamp.includes(' ') && !timestamp.includes('T')) {
    normalized = timestamp.replace(' ', 'T') + 'Z'
  } else if (typeof timestamp === 'string' && !timestamp.endsWith('Z')) {
    normalized = timestamp + 'Z'
  }
  const d = new Date(normalized)
  const now = new Date()
  
  const isToday = d.toDateString() === now.toDateString()
  const options = { hour: 'numeric', minute: '2-digit', hour12: true }
  if (!isToday) {
    options.month = 'short'
    options.day = 'numeric'
  }
  return d.toLocaleString('en-US', options)
}

export function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

import { getStorageBaseUrl } from './platform'

export function getImageUrl(path) {
  if (!path) return null
  if (path.startsWith('http') || path.startsWith('data:')) return path
  return `${getStorageBaseUrl()}/${path}`
}

export function compressImage(file, maxKb = 200) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        const maxDim = 1200
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round(h * maxDim / w); w = maxDim }
          else { w = Math.round(w * maxDim / h); h = maxDim }
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        let quality = 0.9
        const tryCompress = () => {
          canvas.toBlob((blob) => {
            if (!blob) return resolve(null)
            if (blob.size > maxKb * 1024 && quality > 0.2) {
              quality -= 0.1
              tryCompress()
            } else {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }))
            }
          }, 'image/jpeg', quality)
        }
        tryCompress()
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}
