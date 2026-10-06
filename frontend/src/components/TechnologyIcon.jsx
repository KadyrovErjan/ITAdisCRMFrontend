import { UserGroupIcon } from '@heroicons/react/24/outline'

const styles = {
  python: ['Py', 'bg-blue-100 text-blue-700'],
  flutter: ['Fl', 'bg-sky-100 text-sky-600'],
  javascript: ['JS', 'bg-yellow-100 text-yellow-700'],
  js: ['JS', 'bg-yellow-100 text-yellow-700'],
}

export default function TechnologyIcon({ technology, className = '' }) {
  const key = (technology || '').trim().toLowerCase()
  const item = styles[key]
  if (!item) return <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ${className}`}><UserGroupIcon className="h-6 w-6" /></span>
  return <span aria-label={technology} className={`inline-flex h-12 w-12 items-center justify-center rounded-xl text-sm font-black ${item[1]} ${className}`}>{item[0]}</span>
}
