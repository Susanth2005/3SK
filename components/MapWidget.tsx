'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import RespondButton from './RespondButton';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const FireIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface AlertData {
  id: string;
  lat: number;
  lng: number;
  message: string;
  timestamp: number;
  type?: string;
  contact?: string;
  source?: string;
  reporter?: string;
  responders?: Record<string, boolean>;
  deviceId?: string;
  locationName?: string;
}

interface MapWidgetProps {
  alerts: AlertData[];
  focusLocation?: { lat: number; lng: number } | null;
}

// Resets map smoothly if an unprompted new alert drops
function RecenterAutomatically({ lat, lng }: { lat: number, lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 13, { duration: 1.5 });
  }, [lat, lng, map]);
  return null;
}

// Drives map interactions requested via Sidebar Clicks
function MapFocusHandler({ location }: { location?: { lat: number, lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], 17, { duration: 1.5 });
    }
  }, [location, map]);
  return null;
}

export default function MapWidget({ alerts, focusLocation }: MapWidgetProps) {
  const defaultCenter = [10.8505, 76.2711] as [number, number];
  const center = alerts.length > 0 ? [alerts[0].lat, alerts[0].lng] : defaultCenter;
  
  const [routePolyline, setRoutePolyline] = useState<[number, number][] | null>(null);
  const [routingLoading, setRoutingLoading] = useState(false);

  const fetchRoute = async (destLat: number, destLng: number) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setRoutingLoading(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${destLng},${destLat}?overview=full&geometries=geojson`);
        const data = await res.json();
        
        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          setRoutePolyline(coords);
        } else {
          alert("No valid driving route found from your current location.");
        }
      } catch (e) {
        console.error(e);
        alert("Failed to calculate route.");
      } finally {
        setRoutingLoading(false);
      }
    }, (error) => {
      console.error(error);
      alert("Could not get your location. Please ensure GPS/Location permissions are granted in your browser.");
      setRoutingLoading(false);
    });
  };

  return (
    <MapContainer 
      center={center as [number, number]} 
      zoom={alerts.length > 0 ? 13 : 7} 
      style={{ height: '100%', width: '100%' }}
      className="z-0 outline-none"
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Clean Street View">
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Google Satellite">
          <TileLayer
            attribution="&copy; Google"
            url="http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}"
            maxZoom={20}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Google Hybrid (Sat + Roads)">
          <TileLayer
            attribution="&copy; Google"
            url="http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}"
            maxZoom={20}
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      
      <MapFocusHandler location={focusLocation} />
      {alerts.length > 0 && !focusLocation && !routePolyline && <RecenterAutomatically lat={alerts[0].lat} lng={alerts[0].lng} />}

      {routePolyline && <Polyline positions={routePolyline} color="#3b82f6" weight={5} opacity={0.9} dashArray="10, 10" />}

      {alerts.map((alert) => (
        <Marker key={alert.id} position={[alert.lat, alert.lng]} icon={FireIcon}>
          <Popup>
            <div className="font-sans min-w-[220px]">
              <h3 className="font-bold text-red-600 mb-1">
                {alert.type ? alert.type.toUpperCase() : 'INCIDENT DETECTED'}
              </h3>
              
              {alert.locationName && (
                <div className="font-bold text-xs text-zinc-900 mb-1">
                  📍 {alert.locationName}
                </div>
              )}

              <p className="text-sm text-zinc-800 mb-2">{alert.message}</p>
              
              {alert.contact && (
                <div className="px-2 py-1 bg-red-50 border border-red-100 rounded text-sm text-red-900 font-medium mb-2">
                  📞 {alert.contact}
                </div>
              )}

              <p className="text-xs text-zinc-500 mt-2 border-t border-zinc-200 pt-1 flex justify-between items-center">
                <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {alert.source === 'manual' ? (
                  <span className="bg-amber-100 text-amber-800 px-1 rounded font-medium ml-2">Manual</span>
                ) : (
                  <span className="bg-blue-100 text-blue-800 px-1 rounded font-medium ml-2">
                    {alert.deviceId ? alert.deviceId : 'Sensor'}
                  </span>
                )}
              </p>
              
              <div className="flex gap-2 mt-3 w-full">
                <div className="flex-[1.2]">
                  <RespondButton alertId={alert.id} responders={alert.responders} />
                </div>
                <button 
                  onClick={() => fetchRoute(alert.lat, alert.lng)}
                  disabled={routingLoading}
                  className="flex-1 mt-3 flex items-center justify-center bg-zinc-100 border border-zinc-300 text-zinc-800 px-2 py-1.5 rounded-md text-[11px] font-bold tracking-wide hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  title="Get Driving Directions"
                >
                  {routingLoading ? '📍...' : '📍 ROUTE'}
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
