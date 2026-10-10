import { UserGroupIcon } from '@heroicons/react/24/outline'
import pythonLogo from '../assets/technologies/python.png'
import javascriptLogo from '../assets/technologies/javascript.png'
import flutterLogo from '../assets/technologies/flutter.png'

const logos = { python: pythonLogo, javascript: javascriptLogo, js: javascriptLogo, flutter: flutterLogo }

export default function TechnologyIcon({ technology, className = '' }) {
  const logo = logos[(technology || '').trim().toLowerCase()]
  if (!logo) return <span aria-label="Топ" className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ${className}`}><UserGroupIcon className="h-6 w-6" /></span>
  return <span aria-label={technology} className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-2 ${className}`}><img src={logo} alt="" className="h-full w-full object-contain" /></span>
}
