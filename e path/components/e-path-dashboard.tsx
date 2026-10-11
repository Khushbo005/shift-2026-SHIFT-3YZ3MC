'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Lenis from 'lenis'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BatteryCharging, Bot, CalendarCheck, CheckCircle2, ChevronRight, CircleGauge, Download, LocateFixed, LogIn, MapPin, Navigation, Route, Search, Sparkles, Zap, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

const lime = '#b7ff00'
type Station = { name: string; area: string; batteries: number; total: number; tariff: number; status: 'open' | 'closed'; type: 'swapping' | 'charging'; coords: [number, number]; city: string }
const stationSeed: Station[] = [
  { name: 'Lanka Gate Swap', area: 'Lanka, Varanasi', batteries: 12, total: 20, tariff: 50, status: 'open', type: 'swapping', coords: [25.2677, 82.9913], city: 'Varanasi' },
  { name: 'IIT BHU Hub', area: 'BHU Campus', batteries: 8, total: 16, tariff: 45, status: 'open', type: 'swapping', coords: [25.2625, 82.9891], city: 'Varanasi' },
  { name: 'Assi Ghat Fast Charge', area: 'Assi Ghat', batteries: 16, total: 24, tariff: 18, status: 'open', type: 'charging', coords: [25.2896, 83.0067], city: 'Varanasi' },
  { name: 'Cantt Mobility', area: 'Varanasi Cantt', batteries: 5, total: 12, tariff: 50, status: 'closed', type: 'swapping', coords: [25.3336, 82.9965], city: 'Varanasi' },
]
const cityCenters: Record<string, [number, number]> = { varanasi: [25.3176, 82.9739], kanpur: [26.4499, 80.3319], delhi: [28.6139, 77.209], lucknow: [26.8467, 80.9462], mumbai: [19.076, 72.8777] }
const makeCityStations = (city: string, center: [number, number]): Station[] => ['Central Swap', 'North Fast Charge', 'East Mobility Hub'].map((name, index) => ({ name: `${city} ${name}`, area: `${city} city network`, batteries: 6 + index * 3, total: 12 + index * 4, tariff: index === 1 ? 16 : 48, status: index === 2 ? 'closed' : 'open', type: index === 1 ? 'charging' : 'swapping', coords: [center[0] + (index - 1) * 0.035, center[1] + (index - 1) * 0.04], city })) as Station[]
const revenue = [{ day: 'Mon', value: 4200 }, { day: 'Tue', value: 5100 }, { day: 'Wed', value: 4700 }, { day: 'Thu', value: 6800 }, { day: 'Fri', value: 6100 }, { day: 'Sat', value: 8200 }, { day: 'Sun', value: 7600 }]
const health = [{ name: 'A-104', value: 94 }, { name: 'A-108', value: 88 }, { name: 'B-201', value: 96 }, { name: 'B-209', value: 82 }, { name: 'C-402', value: 91 }]

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useInView(ref, { once: true, amount: 0.18 })
  return <motion.div ref={ref} className={className} initial={{ opacity: 0, y: 34 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>
}

function Battery({ compact = false }: { compact?: boolean }) {
  return <motion.div className={`battery-wrap ${compact ? 'battery-small' : ''}`} animate={{ y: [0, -10, 0], rotate: [-1, 1, -1] }} transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}>
    <div className="battery-glow" />
    <div className="battery-top"><span /></div>
    <div className="battery-body"><div className="battery-label">E<span>-</span>PATH</div><div className="battery-bolt"><Zap /></div><div className="battery-level" /></div>
    <div className="battery-base" />
  </motion.div>
}

function EVGraphic() {
  return <motion.div className="ev-scene" animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
    <div className="ev-halo" />
    <motion.div className="swap-station" animate={{ rotate: [-1, 1, -1] }} transition={{ duration: 6, repeat: Infinity }}><div className="station-top"><Zap /></div><div className="station-screen">READY<br /><b>100%</b></div><div className="station-slots"><i /><i /><i /></div></motion.div>
    <div className="rickshaw"><div className="rickshaw-roof" /><div className="rickshaw-cabin"><span>E</span><span>RIDE</span></div><div className="wheel wheel-a" /><div className="wheel wheel-b" /></div>
    <div className="road-line" />
    <motion.div className="orbit-chip chip-one" animate={{ y: [0, -15, 0], x: [0, 7, 0] }} transition={{ duration: 3.8, repeat: Infinity }}><Battery compact /></motion.div>
    <motion.div className="orbit-chip chip-two" animate={{ y: [0, 12, 0], x: [0, -6, 0] }} transition={{ duration: 4.6, repeat: Infinity }}><Sparkles /></motion.div>
  </motion.div>
}

const LeafletMap = dynamic(() => import('./leaflet-map'), { ssr: false })
function MapPanel({ onBook }: { onBook: (station: Station) => void }) { return <LeafletMap onBook={onBook} /> }
/*
  const [selected, setSelected] = useState<Station>(stationSeed[1])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'swapping' | 'charging'>('all')
  const [center, setCenter] = useState<[number, number]>(cityCenters.varanasi)
  const [stations, setStations] = useState<Station[]>(stationSeed)
  const [locationMessage, setLocationMessage] = useState('')
  const visibleStations = stations.filter((station) => filter === 'all' || station.type === filter)
  const searchCity = async (value: string) => {
    setQuery(value)
    const key = value.trim().toLowerCase()
    if (!key) return
    const match = Object.entries(cityCenters).find(([city]) => city.startsWith(key))
    if (match) { setCenter(match[1]); setStations(match[0] === 'varanasi' ? stationSeed : makeCityStations(match[0][0].toUpperCase() + match[0].slice(1), match[1])); setLocationMessage(`Showing live network around ${match[0][0].toUpperCase() + match[0].slice(1)}`); return }
    if (value.trim().length < 3) return
    try { const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(value)}`); const result = await response.json(); if (result[0]) { const nextCenter: [number, number] = [Number(result[0].lat), Number(result[0].lon)]; setCenter(nextCenter); setStations(makeCityStations(result[0].display_name.split(',')[0], nextCenter)); setLocationMessage(`Showing nearby stations around ${result[0].display_name.split(',')[0]}`) } } catch { setLocationMessage('Search unavailable · try a supported city') }
  }
  const detectLocation = () => navigator.geolocation?.getCurrentPosition(({ coords }) => { const next: [number, number] = [coords.latitude, coords.longitude]; setCenter(next); setStations(makeCityStations('Nearby', next)); setLocationMessage('Showing stations near your location') }, () => setLocationMessage('Location permission was not granted'))
  return <div className="map-shell leaflet-shell">
    <div className="map-toolbar"><div className="map-search"><Search /><input value={query} onChange={(event) => searchCity(event.target.value)} placeholder="Search city or area" aria-label="Search city or area" /></div><button className="locate-button" onClick={detectLocation}><LocateFixed /> Detect My Location</button><span className="location-message">{locationMessage}</span></div>
    <div className="map-filters" role="group" aria-label="Station type filter">{[['all', 'All Stations'], ['swapping', 'Battery Swapping'], ['charging', 'Fast Charging']].map(([value, label]) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value as typeof filter)}>{value === 'swapping' ? '🔋 ' : value === 'charging' ? '🔌 ' : ''}{label}</button>)}</div>
    <MapContainer center={center} zoom={12} scrollWheelZoom className="leaflet-map"><MapRecenter center={center} /><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{visibleStations.map((station) => <CircleMarker key={`${station.name}-${station.coords.join('-')}`} center={station.coords} radius={10} pathOptions={{ color: station.status === 'open' ? '#79b900' : '#d54949', fillColor: station.status === 'open' ? '#b7ff00' : '#f35b5b', fillOpacity: 0.95, weight: 3 }} eventHandlers={{ click: () => setSelected(station) }}><Popup><div className="leaflet-popup-content"><div className="popup-badges"><span className={station.type}>{station.type === 'swapping' ? 'Battery Swapping' : 'Fast Charging'}</span><span className={station.status}>{station.status === 'open' ? 'OPEN' : 'CLOSED'}</span></div><h3>{station.name}</h3><p>{station.area}</p><div className="popup-stats"><span><b>{station.batteries}/{station.total}</b> slots</span><span><b>₹{station.tariff}</b>/{station.type === 'swapping' ? 'swap' : 'kWh'}</span></div><a href={`https://maps.google.com/?q=${station.coords[0]},${station.coords[1]}`} target="_blank" rel="noreferrer">View on Google Maps <ChevronRight /></a></div></Popup></CircleMarker>)}</MapContainer>
    <div className="map-card"><div className={`station-status ${selected.status}`}><span /> {selected.status === 'open' ? 'OPEN · 6 AM - 11 PM' : 'CLOSED · MAINTENANCE'}</div><h3>{selected.name}</h3><p><MapPin /> {selected.area}</p><div className="station-stats"><div><strong>{selected.batteries}/{selected.total}</strong><small>Available Slots</small></div><div><strong>₹{selected.tariff}</strong><small>Per {selected.type === 'swapping' ? 'swap' : 'kWh'}</small></div></div><button className="lime-button small" disabled={selected.status === 'closed'} onClick={() => onBook(selected)}>Book Slot <ChevronRight /></button></div>
  </div>
}
  const [selected, setSelected] = useState(stations[1])


*/

export default function EPathDashboard() {
  const [bookingStation, setBookingStation] = useState<Station | null>(null)
  const [bookingToken, setBookingToken] = useState('')
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(900)
  const [view, setView] = useState<'driver' | 'fleet'>('driver')
  const [battery, setBattery] = useState(72)
  const [load, setLoad] = useState(80)
  const [mode, setMode] = useState('Eco')
  const scrollY = useMotionValue(0)
  const smoothY = useSpring(scrollY, { stiffness: 90, damping: 20 })
  const heroGlow = useTransform(smoothY, [0, 650], [0.18, 0])
  const range = useMemo(() => Math.round(Math.max(22, battery * (mode === 'Eco' ? 1.23 : mode === 'Normal' ? 1.05 : 0.84) - load * 0.08)), [battery, load, mode])

  useEffect(() => {
    if (!bookingConfirmed) return
    const timer = window.setInterval(() => setSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [bookingConfirmed])

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true, touchMultiplier: 1.2 })
    const frame = (time: number) => { lenis.raf(time); scrollY.set(lenis.scroll); requestAnimationFrame(frame) }
    const raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); lenis.destroy() }
  }, [scrollY])

  return <main className="epath-app">
    <motion.div className="scroll-glow" style={{ opacity: heroGlow }} />
    <header className="site-header"><a className="brand" href="#home"><span className="brand-mark">E</span><span>PATH</span><small>ई-पथ</small></a><nav><a href="#home">Home</a><a href="#stations">Stations Map</a><a href="#predictor">AI Predictor</a>{view === 'fleet' && <a href="#analytics">Fleet Analytics</a>}</nav><div className="header-actions"><div className="view-switcher" role="group" aria-label="Choose dashboard view"><button className={view === 'driver' ? 'active' : ''} onClick={() => setView('driver')}>Driver View</button><button className={view === 'fleet' ? 'active' : ''} onClick={() => setView('fleet')}>Fleet Owner</button></div><button className="header-cta" onClick={() => document.querySelector('#stations')?.scrollIntoView()}>Find a station <ChevronRight /></button></div></header>

    <section className="hero-section section-pad" id="home"><div className="hero-copy"><Reveal><div className="eyebrow"><span className="pulse-dot" /> AI-POWERED EV MOBILITY</div><h1>POWER YOUR<br /><em>ELECTRIC RIDE</em></h1><p className="hero-sub">Smart battery swapping and range intelligence for every ride across Varanasi.</p><div className="hero-actions"><button className="lime-button" onClick={() => document.querySelector('#stations')?.scrollIntoView()}>Find nearest station <MapPin /></button><button className="outline-button" onClick={() => document.querySelector('#predictor')?.scrollIntoView()}>Predict my range <CircleGauge /></button></div><div className="hero-meta"><span><b>24/7</b> swap access</span><span><b>4.8★</b> rider rating</span><span><b>62k+</b> swaps powered</span></div></Reveal></div><Reveal className="hero-art" delay={0.15}><EVGraphic /></Reveal></section>

    <section className="section-pad map-section" id="stations"><Reveal><div className="section-heading"><div><div className="eyebrow dark"><span className="pulse-dot" /> LIVE NETWORK</div><h2>Swap, go,<br /><em>keep moving.</em></h2></div><p>Find a charged battery when you need it. Our growing network keeps Varanasi's electric rides in motion.</p></div></Reveal><Reveal delay={0.1}><MapPanel onBook={(station) => { setBookingStation(station); setBookingToken(`EP-${Math.floor(100000 + Math.random() * 899999)}`); setBookingConfirmed(false) }} /></Reveal></section>

    <section className="section-pad predictor-section" id="predictor"><Reveal><div className="section-heading centered"><div className="eyebrow"><Bot /> INTELLIGENCE, ON BOARD</div><h2>Know your <em>next mile.</em></h2><p>Our AI reads the road ahead so you can ride with confidence.</p></div></Reveal><div className="predictor-grid"><Reveal delay={0.1}><div className="panel predictor-card"><div className="panel-title"><div><span className="eyebrow">RANGE PREDICTOR</span><h3>Set your ride</h3></div><div className="ai-badge"><Sparkles /> AI LIVE</div></div><label>Battery charge <strong>{battery}%</strong><input type="range" min="0" max="100" value={battery} onChange={(e) => setBattery(Number(e.target.value))} /></label><label>Passenger load <strong>{load} kg</strong><input type="range" min="50" max="300" value={load} onChange={(e) => setLoad(Number(e.target.value))} /></label><div className="mode-field"><span>Ride mode</span><div className="mode-toggle">{['Eco', 'Normal', 'Sport'].map((item) => <button key={item} className={mode === item ? 'active' : ''} onClick={() => setMode(item)}>{item}</button>)}</div></div></div></Reveal><Reveal delay={0.2}><div className="range-result"><div className="range-orbit"><motion.div animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} /><Battery /></div><div className="range-copy"><span className="eyebrow">PREDICTED REAL RANGE</span><motion.div className="range-number" key={range} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>{range}<small>KM</small></motion.div><p>Based on <b>{mode.toLowerCase()} mode</b>, {load} kg load and current charge.</p><button className="outline-button" onClick={() => document.querySelector('#stations')?.scrollIntoView()}>Plan a swap <ChevronRight /></button></div></div></Reveal></div></section>

    {view === 'fleet' && <section className="section-pad light-section" id="analytics"><Reveal><div className="section-heading"><div><div className="eyebrow dark"><BatteryCharging /> FLEET COMMAND <span className="sync-tag"><span /> Mock API Connected</span><span className="sync-tag live-sync"><span /> Live Sync</span></div><h2>See the <em>big picture.</em></h2></div><p>One clean view for every vehicle, battery and swap in your operation.</p></div></Reveal><div className="metric-grid"><Reveal delay={0.05}><div className="metric-card"><span>ACTIVE VEHICLES</span><strong>128</strong><small className="positive">↑ 12.4% this week</small></div></Reveal><Reveal delay={0.1}><div className="metric-card"><span>SWAPS TODAY</span><strong>342</strong><small className="positive">↑ 8.2% vs yesterday</small></div></Reveal><Reveal delay={0.15}><div className="metric-card accent"><span>DAILY REVENUE</span><strong>₹24.8k</strong><small>Target: ₹30k</small></div></Reveal></div><div className="charts-grid"><Reveal><div className="chart-card"><div className="chart-heading"><div><span>WEEKLY REVENUE</span><strong>₹42,700</strong></div><span className="positive">+18.6%</span></div><ResponsiveContainer width="100%" height={220}><AreaChart data={revenue}><defs><linearGradient id="limeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={lime} stopOpacity={0.35} /><stop offset="100%" stopColor={lime} stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#e5e5e5" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#7b7b7b', fontSize: 11 }} /><YAxis hide /><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #ddd' }} /><Area type="monotone" dataKey="value" stroke="#7dad00" strokeWidth={3} fill="url(#limeFill)" /></AreaChart></ResponsiveContainer></div></Reveal><Reveal delay={0.1}><div className="chart-card"><div className="chart-heading"><div><span>BATTERY HEALTH / SOH</span><strong>90.2% <small>avg.</small></strong></div><span className="battery-chip">● Healthy</span></div><ResponsiveContainer width="100%" height={220}><BarChart data={health} barSize={28}><CartesianGrid stroke="#e5e5e5" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#7b7b7b', fontSize: 11 }} /><YAxis domain={[70, 100]} hide /><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #ddd' }} /><Bar dataKey="value" fill="#1b1d1b" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Reveal></div></section>}

    <footer><div className="brand"><span className="brand-mark">E</span><span>PATH</span><small>ई-पथ</small></div><p>Built for the roads of Varanasi. Powered by intelligence.</p><span>© 2025 E-Path Mobility</span></footer>

    <AnimatePresence>{bookingStation && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setBookingStation(null)}><motion.div className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title" initial={{ opacity: 0, y: 25, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 25, scale: 0.96 }} onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setBookingStation(null)} aria-label="Close booking"><X /></button>{bookingConfirmed ? <div className="booking-success"><div className="success-icon"><CheckCircle2 /></div><div className="eyebrow dark">RESERVATION SECURED</div><h2 id="booking-modal-title">Booking<br /><em>Confirmed!</em></h2><p>Your swap slot at <strong>{bookingStation.name}</strong> is reserved.</p><div className="success-token"><small>TOKEN NUMBER</small><strong>#{bookingToken.replace('EP-', 'EP-')}</strong></div><div className="countdown"><span>ARRIVE WITHIN</span><strong>{String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}</strong><small>minutes</small></div><button className="lime-button full" onClick={() => window.print()}><Download /> Download Token</button></div> : <div className="booking-form"><div className="eyebrow dark"><CalendarCheck /> BOOKING CONFIRMATION</div><h2 id="booking-modal-title">Confirm your<br /><em>power stop.</em></h2><div className="booking-content"><div className="qr-wrap"><QRCodeSVG value={`E-PATH|${bookingStation.name}|${bookingToken}`} size={142} bgColor="#ffffff" fgColor="#101210" level="M" /><span>Scan at station</span></div><div className="booking-details"><h3>Station Details</h3><p><small>STATION</small><strong>{bookingStation.name}</strong></p><p><small>LOCATION</small><strong>{bookingStation.area}</strong></p><p><small>BOOKING TOKEN ID</small><strong>{bookingToken}</strong></p><p><small>EST. TARIFF</small><strong>₹{bookingStation.tariff} / swap</strong></p></div></div><button className="lime-button full" onClick={() => { setBookingConfirmed(true); setSecondsLeft(900) }}>Confirm Reservation <ChevronRight /></button></div>}</motion.div></motion.div>}</AnimatePresence>
  </main>
}
