import { useMemo, useState } from 'react'
import './Homepage.css'

type DurationMinutes = 30 | 60 | 90 | 120

function formatTimeLabel(totalMinutes: number) {
  const hours24 = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const suffix = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = ((hours24 + 11) % 12) + 1
  const minutesStr = minutes.toString().padStart(2, '0')
  return `${hours12}:${minutesStr} ${suffix}`
}

function VendorPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  )
  const sports = ['Pickleball', 'Padel', 'Tennis', 'Badminton']
  const [selectedSport, setSelectedSport] = useState<string>(sports[0])
  const [selectedDuration, setSelectedDuration] = useState<DurationMinutes>(60)
  const [activeCourt, setActiveCourt] = useState<number>(1)
  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(null)

  const courts = useMemo(() => [
    { id: 1, name: 'Court 1', surface: 'Synthetic Turf', indoor: true },
    { id: 2, name: 'Court 2', surface: 'Synthetic Turf', indoor: false },
    { id: 3, name: 'Court 3', surface: 'Acrylic', indoor: true }
  ], [])

  const slots = useMemo(() => {
    const step = 60 // show a slot row each hour like the screenshot
    const openMinutes = 0
    const closeMinutes = 24 * 60
    const result: Array<{ start: number; end: number }> = []
    for (let start = openMinutes; start + selectedDuration <= closeMinutes; start += step) {
      result.push({ start, end: start + selectedDuration })
    }
    return result
  }, [selectedDuration])

  return (
    <div className="homepage" style={{ background: '#0f172a' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#0f172a' }}>
        <header className="header" style={{ background: 'transparent', boxShadow: 'none', padding: '20px 16px 8px' }}>
          <div className="header-content" style={{ gap: 16 }}>
            <div className="location">
              <h3 style={{ margin: 0, color: 'white', fontSize: 22 }}>Padel Star</h3>
              <p style={{ color: '#a3b1c6' }}>Phase 6 DHA, Karachi</p>
            </div>
            <div className="header-actions" style={{ gap: 12 }} />
          </div>
        </header>

        <div style={{ padding: '0 16px 8px' }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
            {sports.map((s) => {
              const active = s === selectedSport
              return (
                <button
                  key={s}
                  onClick={() => setSelectedSport(s)}
                  style={{
                    background: active ? '#1e293b' : '#111b33',
                    color: 'white',
                    border: '1px solid ' + (active ? '#334155' : '#1f2b4a'),
                    borderRadius: 999,
                    padding: '8px 14px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap'
                  }}
                >{s}</button>
              )
            })}
          </div>
        </div>

        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
            {Array.from({ length: 14 }).map((_, idx) => {
              const d = new Date()
              d.setDate(d.getDate() + idx)
              const iso = d.toISOString().slice(0, 10)
              const isActive = iso === selectedDate
              const day = d.toLocaleDateString(undefined, { weekday: 'short' })
              const date = d.getDate()
              return (
                <button
                  key={iso}
                  onClick={() => setSelectedDate(iso)}
                  style={{
                    background: isActive ? '#1e293b' : '#111b33',
                    color: 'white',
                    border: '1px solid ' + (isActive ? '#334155' : '#1f2b4a'),
                    borderRadius: 12,
                    padding: '10px 12px',
                    width: 82,
                    flex: '0 0 auto',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ opacity: 0.8, fontSize: 12 }}>{day}</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{date}</div>
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
            {courts.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCourt(c.id)}
                style={{
                  background: activeCourt === c.id ? '#1e293b' : '#111b33',
                  color: 'white',
                  border: '1px solid ' + (activeCourt === c.id ? '#334155' : '#1f2b4a'),
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap'
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="main-content" style={{ maxWidth: 1400 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: 16,
          paddingBottom: 80
        }}>
          <aside style={{
            position: 'sticky',
            top: 92,
            alignSelf: 'start',
            background: '#111827',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #1f2937',
            height: 'fit-content'
          }}>
            <div style={{ fontWeight: 700, color: 'white', marginBottom: 12 }}>Duration</div>
            {([30, 60, 90, 120] as DurationMinutes[]).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDuration(d)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  marginBottom: 10,
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid ' + (selectedDuration === d ? '#22c55e55' : '#374151'),
                  background: selectedDuration === d ? '#052e1f' : '#0b1220',
                  color: 'white',
                  fontWeight: 600
                }}
              >
                {d} Minutes
              </button>
            ))}

            <div style={{ fontWeight: 700, color: 'white', margin: '16px 0 10px' }}>Filters</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Morning', 'Afternoon', 'Evening'].map((t) => (
                <span key={t} style={{
                  background: '#0b1220',
                  color: '#cbd5e1',
                  border: '1px solid #1f2937',
                  padding: '6px 10px',
                  borderRadius: 999
                }}>{t}</span>
              ))}
            </div>
          </aside>

          <section style={{
            background: '#0b1220',
            borderRadius: 16,
            border: '1px solid #1f2937',
            padding: 20,
            minHeight: 'calc(100vh - 200px)',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 14
            }}>
              {slots.map((s) => {
                const key = `${s.start}-${s.end}`
                const selected = selectedSlotKey === key
                const startLabel = formatTimeLabel(s.start)
                const endLabel = formatTimeLabel(s.end % (24 * 60))
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedSlotKey(selected ? null : key)}
                    style={{
                      background: selected ? '#10b981' : '#052e1f',
                      color: selected ? '#052e1f' : '#34d399',
                      border: '1px solid ' + (selected ? '#10b981' : '#065f46'),
                      borderRadius: 12,
                      padding: '14px 16px',
                      textAlign: 'center',
                      fontWeight: 800,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {startLabel} – {endLabel}
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      </main>

      {selectedSlotKey && (
        <div style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          background: '#0b1220cc',
          borderTop: '1px solid #1f2937',
          backdropFilter: 'saturate(180%) blur(8px)',
          padding: 12,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 30
        }}>
          <div style={{
            width: '100%',
            maxWidth: 1200,
            display: 'flex',
            gap: 12
          }}>
            <div style={{
              flex: 1,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{ opacity: 0.8 }}>Selected:</span>
              <strong>
                {(() => {
                  const [s, e] = selectedSlotKey.split('-').map(Number)
                  return `${formatTimeLabel(s)} – ${formatTimeLabel(e % (24 * 60))}`
                })()}
              </strong>
              <span style={{ opacity: 0.6 }}>| {selectedDuration} mins | {selectedSport} | {courts.find(c => c.id === activeCourt)?.name}</span>
            </div>
            <button
              style={{
                background: '#22c55e',
                color: '#052e1f',
                fontWeight: 800,
                border: 'none',
                borderRadius: 10,
                padding: '12px 18px'
              }}
              onClick={() => alert('Proceed to booking flow')}
            >
              Continue
            </button>
            <button
              style={{
                background: 'transparent',
                color: '#cbd5e1',
                border: '1px solid #334155',
                borderRadius: 10,
                padding: '12px 16px'
              }}
              onClick={() => setSelectedSlotKey(null)}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorPage


