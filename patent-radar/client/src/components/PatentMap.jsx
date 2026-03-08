import { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { COUNTRY_COORDS } from '../utils/countryCoords';
import { pubTypeColor } from '../utils/formatters';

function MapUpdater({ patents }) {
  const map = useMap();
  useMemo(() => {
    if (patents?.length > 0) map.invalidateSize();
  }, [patents, map]);
  return null;
}

export default function PatentMap({ patents = [] }) {
  const countryData = useMemo(() => {
    const counts = {};
    patents.forEach(p => {
      if (!counts[p.jurisdiction]) {
        counts[p.jurisdiction] = { total: 0, granted: 0, application: 0, other: 0, topApplicants: {} };
      }
      counts[p.jurisdiction].total++;
      if (p.publicationType === 'GRANTED_PATENT') counts[p.jurisdiction].granted++;
      else if (p.publicationType === 'PATENT_APPLICATION') counts[p.jurisdiction].application++;
      else counts[p.jurisdiction].other++;
      (p.applicants || []).forEach(a => {
        counts[p.jurisdiction].topApplicants[a] = (counts[p.jurisdiction].topApplicants[a] || 0) + 1;
      });
    });
    return counts;
  }, [patents]);

  const maxCount = useMemo(() => {
    return Math.max(1, ...Object.values(countryData).map(d => d.total));
  }, [countryData]);

  return (
    <div className="h-full w-full rounded-md overflow-hidden border border-border">
      <MapContainer
        center={[25, 10]}
        zoom={2}
        className="h-full w-full"
        zoomControl={true}
        scrollWheelZoom={true}
        style={{ background: '#fbfbfa' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />
        <MapUpdater patents={patents} />

        {Object.entries(countryData).map(([code, data]) => {
          const coords = COUNTRY_COORDS[code];
          if (!coords) return null;

          const radius = 8 + (data.total / maxCount) * 25;
          const dominantType = data.granted >= data.application ? 'GRANTED_PATENT' : 'PATENT_APPLICATION';
          const color = pubTypeColor(dominantType);

          const topApps = Object.entries(data.topApplicants)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

          return (
            <CircleMarker
              key={code}
              center={[coords.lat, coords.lng]}
              radius={radius}
              pathOptions={{
                fillColor: color,
                fillOpacity: 0.35,
                color: color,
                weight: 1.5,
                opacity: 0.7
              }}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', minWidth: '160px', color: '#37352f' }}>
                  <div style={{ fontWeight: 600, marginBottom: '6px' }}>
                    {coords.name} ({code})
                  </div>
                  <div style={{ fontSize: '12px', color: '#9b9a97' }}>
                    <div><strong style={{ color: '#37352f' }}>{data.total}</strong> patents</div>
                    {data.granted > 0 && <div style={{ color: '#0f7b6c' }}>Granted: {data.granted}</div>}
                    {data.application > 0 && <div style={{ color: '#2eaadc' }}>Applications: {data.application}</div>}
                    {topApps.length > 0 && (
                      <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #e9e9e7' }}>
                        {topApps.map(([name, count], i) => (
                          <div key={i} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name} ({count})</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
