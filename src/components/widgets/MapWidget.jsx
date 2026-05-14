import React, { useEffect, useState } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import WidgetCard from './WidgetCard';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons in React
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function MapWidget({ location, label = "Map", onDismiss }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function geocode() {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
          { headers: { 'User-Agent': 'LookoSearch/1.0 (contact@looko.com)' } }
        );
        if (!res.ok) throw new Error('Network error');
        const geoData = await res.json();
        if (cancelled) return;
        
        if (!geoData || geoData.length === 0) {
          setError(`Location "${location}" not found`);
          return;
        }
        
        const { lat, lon, display_name } = geoData[0];
        setData({ lat: parseFloat(lat), lon: parseFloat(lon), name: display_name });
      } catch (err) {
        if (!cancelled) setError("Could not load map data.");
      }
    }
    geocode();
    return () => { cancelled = true; };
  }, [location]);

  return (
    <WidgetCard label={label} onDismiss={onDismiss}>
      {error ? (
        <div className="wc-error">{error}</div>
      ) : data ? (
        <div className="map-widget">
          <div className="map-widget-location">
            <MapPin size={14} />
            <span>{data.name}</span>
          </div>
          <div className="map-widget-container">
            <MapContainer center={[data.lat, data.lon]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[data.lat, data.lon]}>
                <Popup>{data.name}</Popup>
              </Marker>
            </MapContainer>
          </div>
          <a
            href={`https://www.openstreetmap.org/?mlat=${data.lat}&mlon=${data.lon}#map=13/${data.lat}/${data.lon}`}
            target="_blank"
            rel="noopener noreferrer"
            className="map-widget-link"
          >
            <ExternalLink size={13} />
            <span>Open in OpenStreetMap</span>
          </a>
        </div>
      ) : (
        <div className="wc-loading">
          <div className="wc-loading-bar" />
          <div className="wc-loading-bar wc-loading-bar-short" />
        </div>
      )}
    </WidgetCard>
  );
}
