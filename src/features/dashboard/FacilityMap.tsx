import { useNavigate } from 'react-router-dom';
import type { Facility, LocationEntity, Permit } from '@/entities/types';

const RISK_COLOR: Record<string, string> = {
  Critical: '#C8102E',
  High: '#C8102E',
  Medium: '#D97706',
  Low: '#00843D',
};

/** Blueprint-style background per facility */
function Blueprint({ facilityId }: { facilityId: string }) {
  const wall = { fill: '#eef2ee', stroke: '#9db4a4', strokeWidth: 0.4 };
  const road = { fill: 'none', stroke: '#c3cfc6', strokeWidth: 1.6, strokeLinecap: 'round' as const };
  const label = { fontSize: 3, fill: '#6b7f70', fontFamily: 'inherit' };

  if (facilityId === 'fac-twr') {
    return (
      <g>
        {/* roads */}
        <path d="M50 96 L50 62 M20 55 L80 55 M50 42 L50 8" {...road} strokeDasharray="0.1 3" />
        {/* four tower blocks */}
        {[{ x: 20, y: 14, n: 'BLOCK A' }, { x: 60, y: 14, n: 'BLOCK B' }, { x: 20, y: 62, n: 'BLOCK C' }, { x: 60, y: 62, n: 'BLOCK D' }].map((b) => (
          <g key={b.n}>
            <rect x={b.x} y={b.y} width={20} height={20} rx={1} {...wall} />
            {/* floor lines */}
            {[4, 8, 12, 16].map((o) => (
              <line key={o} x1={b.x + 1.5} y1={b.y + o} x2={b.x + 18.5} y2={b.y + o} stroke="#c9d6cc" strokeWidth={0.3} />
            ))}
            <text x={b.x + 10} y={b.y + 24.5} textAnchor="middle" {...label}>{b.n}</text>
          </g>
        ))}
        {/* central quadrangle & fountain */}
        <rect x={42} y={40} width={16} height={16} rx={2} fill="#e3efe4" stroke="#9db4a4" strokeWidth={0.4} />
        <circle cx={50} cy={48} r={3.4} fill="#d3e6f5" stroke="#8aa9c0" strokeWidth={0.4} />
        <text x={50} y={60} textAnchor="middle" {...label}>QUADRANGLE</text>
        {/* generator house */}
        <rect x={82} y={82} width={12} height={9} rx={1} {...wall} />
        <text x={88} y={95} textAnchor="middle" {...label}>GEN HOUSE</text>
        {/* fire pump house */}
        <rect x={6} y={82} width={12} height={9} rx={1} {...wall} />
        <text x={12} y={95} textAnchor="middle" {...label}>FIRE PUMP</text>
        {/* basements note */}
        <text x={50} y={5} textAnchor="middle" {...label}>NNPC TOWERS — 4 BLOCKS · 11 FLOORS · B1–B3</text>
      </g>
    );
  }

  if (facilityId === 'fac-oml') {
    return (
      <g>
        {/* flowlines */}
        <path d="M18 22 L31 42 L46 40 M18 68 L31 46 M52 40 L72 28 M52 42 L64 56 M70 60 L80 46 M82 48 L88 78" {...road} strokeDasharray="2 1.4" />
        {/* wellhead clusters */}
        {[{ x: 10, y: 16, n: 'WELL CLUSTER 1' }, { x: 10, y: 62, n: 'WELL CLUSTER 2' }].map((c) => (
          <g key={c.n}>
            <rect x={c.x} y={c.y} width={9} height={9} rx={1} {...wall} />
            <circle cx={c.x + 3} cy={c.y + 3} r={1} fill="#9db4a4" />
            <circle cx={c.x + 6} cy={c.y + 3} r={1} fill="#9db4a4" />
            <circle cx={c.x + 4.5} cy={c.y + 6} r={1} fill="#9db4a4" />
            <text x={c.x + 4.5} y={c.y + 12.5} textAnchor="middle" {...label}>{c.n}</text>
          </g>
        ))}
        {/* manifold */}
        <rect x={27} y={39} width={8} height={6} rx={0.8} {...wall} />
        <text x={31} y={49} textAnchor="middle" {...label}>MANIFOLD</text>
        {/* flow station */}
        <rect x={38} y={32} width={16} height={13} rx={1} {...wall} />
        <rect x={40} y={34} width={5} height={4} fill="#dbe7dd" stroke="#9db4a4" strokeWidth={0.3} />
        <rect x={47} y={34} width={5} height={4} fill="#dbe7dd" stroke="#9db4a4" strokeWidth={0.3} />
        <text x={46} y={49.5} textAnchor="middle" {...label}>OREDO FLOW STATION</text>
        {/* tank farm */}
        <circle cx={73} cy={24} r={4.4} {...wall} />
        <circle cx={82} cy={28} r={4.4} {...wall} />
        <rect x={66} y={17} width={22} height={16} fill="none" stroke="#9db4a4" strokeWidth={0.35} strokeDasharray="1 1" rx={1} />
        <text x={77} y={38} textAnchor="middle" {...label}>TANK FARM (TK-01/02)</text>
        {/* gas handling */}
        <rect x={60} y={54} width={13} height={9} rx={1} {...wall} />
        <text x={66.5} y={67} textAnchor="middle" {...label}>GAS HANDLING</text>
        {/* LACT */}
        <rect x={78} y={41} width={9} height={6} rx={0.8} {...wall} />
        <text x={82.5} y={51} textAnchor="middle" {...label}>LACT</text>
        {/* flare */}
        <circle cx={90} cy={82} r={4.6} fill="none" stroke="#d9a19b" strokeWidth={0.4} strokeDasharray="1 1" />
        <path d="M90 84 L90 78 M88.5 79.5 L90 77 L91.5 79.5" stroke="#c8746a" strokeWidth={0.6} fill="none" />
        <text x={90} y={91} textAnchor="middle" {...label}>FLARE</text>
        {/* camp */}
        <rect x={19} y={84} width={11} height={7} rx={1} {...wall} />
        <text x={24.5} y={95} textAnchor="middle" {...label}>CAMP / ADMIN</text>
        <text x={50} y={5} textAnchor="middle" {...label}>NEPL OML 111 — OREDO FIELD LAYOUT</text>
      </g>
    );
  }

  // Generic refinery blueprint
  return (
    <g>
      <path d="M20 50 L80 50 M50 20 L50 80" {...road} strokeDasharray="0.1 3" />
      <rect x={30} y={22} width={20} height={16} rx={1} {...wall} />
      <text x={40} y={42} textAnchor="middle" {...label}>PROCESS UNIT</text>
      <circle cx={72} cy={60} r={5} {...wall} />
      <circle cx={82} cy={66} r={5} {...wall} />
      <text x={76} y={76} textAnchor="middle" {...label}>TANK FARM</text>
      <rect x={18} y={64} width={14} height={10} rx={1} {...wall} />
      <text x={25} y={78} textAnchor="middle" {...label}>UTILITIES</text>
      <text x={50} y={5} textAnchor="middle" {...label}>PLANT LAYOUT</text>
    </g>
  );
}

interface Props {
  facilities: Facility[];
  locations: LocationEntity[];
  permits: Permit[];
  selectedFacility: string;
  onSelectFacility: (id: string) => void;
}

/**
 * Geofenced facility blueprint. Every open permit is geo-tagged as a pin at its
 * work location — colour = risk level, ring/pulse = live status. Click a pin to
 * open the permit.
 */
export function FacilityMap({ facilities, locations, permits, selectedFacility, onSelectFacility }: Props) {
  const navigate = useNavigate();
  const facLocations = locations.filter((l) => l.facilityId === selectedFacility);
  const openPermits = permits.filter((p) => p.facilityId === selectedFacility && p.status !== 'closed');

  return (
    <div className="space-y-3">
      {/* facility selector */}
      <div className="flex flex-wrap gap-1.5">
        {facilities.map((f) => (
          <button
            key={f.id}
            onClick={() => onSelectFacility(f.id)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              selectedFacility === f.id
                ? 'bg-nnpc-green-dark text-white'
                : 'bg-muted text-muted-foreground hover:bg-nnpc-green-light'
            }`}
          >
            {f.shortCode}
          </button>
        ))}
      </div>

      <div className="relative rounded-lg border border-border bg-[#f6f9f6] overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-full" style={{ aspectRatio: '10/9' }}>
          {/* geofence boundary */}
          <rect x={2} y={1.5} width={96} height={97} rx={2.5} fill="none" stroke="#00843D" strokeWidth={0.5} strokeDasharray="2.4 1.6" opacity={0.55} />
          <Blueprint facilityId={selectedFacility} />

          {/* permit pins */}
          {openPermits.map((p) => {
            const loc = facLocations.find((l) => l.id === p.locationId);
            if (!loc) return null;
            const color = RISK_COLOR[p.riskCategory] ?? '#00843D';
            const isActive = p.status === 'active';
            const isSuspended = p.status === 'suspended';
            return (
              <g
                key={p.id}
                transform={`translate(${loc.mapX}, ${loc.mapY})`}
                className="cursor-pointer"
                onClick={() => navigate(`/permits/${p.id}`)}
              >
                {isActive && (
                  <circle r={4} fill={color} opacity={0.25}>
                    <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.35;0.05;0.35" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* teardrop pin */}
                <path
                  d="M0 1.2 C -2.6 -1.6 -2.6 -5.4 0 -5.4 C 2.6 -5.4 2.6 -1.6 0 1.2 Z"
                  transform="scale(1.15)"
                  fill={color}
                  stroke={isSuspended ? '#1f2937' : 'white'}
                  strokeWidth={isSuspended ? 0.7 : 0.5}
                  strokeDasharray={isSuspended ? '1 0.7' : undefined}
                />
                <circle cy={-4.4} r={1.5} fill="white" opacity={0.9} />
                <title>{`${p.permitNumber} — ${p.riskCategory} risk — ${p.status}\n${loc.name}`}</title>
              </g>
            );
          })}
        </svg>

        {openPermits.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground bg-white/40">
            No open permits at this facility
          </div>
        )}
      </div>

      {/* legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#C8102E' }} /> High / Critical</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#D97706' }} /> Medium</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#00843D' }} /> Low</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-nnpc-green animate-pulse" /> Pulsing = Active work</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-gray-700" /> Dashed = Suspended</span>
      </div>
    </div>
  );
}
