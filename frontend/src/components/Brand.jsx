export default function Brand({ light = false, compact = false }) {
  const main = light ? 'text-white' : 'text-[#0d512e]'
  const sub = light ? 'text-slate-400' : 'text-slate-500'
  return (
    <div className="flex items-center gap-2.5">
      <svg width="32" height="32" viewBox="0 0 60 60" aria-label="ITadis" role="img">
        <polygon points="30,6 50,50 38,50 30,30 22,50 10,50" fill={light ? '#ffffff' : '#0D512E'} />
        <polygon points="30,6 50,50 41,50 30,26" fill="#39A96B" />
      </svg>
      {!compact && <div className="leading-none"><p className={`text-xl font-extrabold ${main}`}>IT<span className="text-[#3fa76b]">adis</span></p><p className={`mt-1 text-[9px] font-semibold uppercase tracking-[.15em] ${sub}`}>Окуу борбору</p></div>}
    </div>
  )
}
