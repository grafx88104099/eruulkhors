import { useCallback, useMemo, useRef, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

export interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  value: LatLng | null;
  onChange: (loc: LatLng) => void;
  defaultCenter?: LatLng;
  height?: number;
}

const UB_CENTER: LatLng = { lat: 47.918, lng: 106.917 };
const API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export default function LocationPicker({
  value,
  onChange,
  defaultCenter = UB_CENTER,
  height = 240,
}: Props) {
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: API_KEY ?? "",
    id: "google-map-script",
  });

  const center = useMemo(() => value ?? defaultCenter, [value, defaultCenter]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  }, [onChange]);

  const handleMarkerDrag = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  }, [onChange]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoError("Браузер geolocation дэмжихгүй байна");
      return;
    }
    setGeoBusy(true); setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onChange(loc);
        mapRef.current?.panTo(loc);
        mapRef.current?.setZoom(15);
        setGeoBusy(false);
      },
      (err) => {
        setGeoError(err.code === 1 ? "Зөвшөөрөл өгөгдөөгүй" : "Байршил тогтоох амжилтгүй");
        setGeoBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  if (!API_KEY) {
    return (
      <div className="border border-ink/10 rounded-md p-4 bg-ink/5 text-sm">
        <div className="font-medium mb-1">⚠ Google Maps API key тохируулагдаагүй</div>
        <p className="text-xs text-ink/60">
          <code className="mono">VITE_GOOGLE_MAPS_API_KEY</code>-г <code className="mono">.env.local</code> файлд тавиад rebuild хийнэ үү.
          Гар утсаар координат шууд оруулах боломжтой:
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <CoordInput
            label="Lat"
            value={value?.lat}
            onChange={(v) => onChange({ lat: v, lng: value?.lng ?? UB_CENTER.lng })}
          />
          <CoordInput
            label="Lng"
            value={value?.lng}
            onChange={(v) => onChange({ lat: value?.lat ?? UB_CENTER.lat, lng: v })}
          />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="border border-red-200 bg-red-50 rounded-md p-4 text-sm text-red-700">
        Газрын зураг ачаалахад алдаа: {loadError.message}
        <div className="text-xs mt-1 text-red-600/80">
          API key буруу эсвэл "Maps JavaScript API" GCP-д идэвхжээгүй байж магадгүй.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center gap-2">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={geoBusy || !isLoaded}
          className="text-xs px-3 py-1.5 rounded-md border border-ink/15 hover:bg-ink/5 disabled:opacity-50"
        >
          {geoBusy ? "Олж байна…" : "📍 Миний байршил"}
        </button>
        {value && (
          <div className="text-[11px] mono text-ink/60 truncate">
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </div>
        )}
      </div>

      <div
        className="rounded-md overflow-hidden border border-ink/10 bg-ink/5"
        style={{ height }}
      >
        {!isLoaded ? (
          <div className="h-full flex items-center justify-center text-sm text-ink/50">
            Газрын зураг ачаалж байна…
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={center}
            zoom={value ? 15 : 12}
            onLoad={(m) => { mapRef.current = m; }}
            onClick={handleMapClick}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              clickableIcons: false,
            }}
          >
            {value && (
              <Marker
                position={value}
                draggable
                onDragEnd={handleMarkerDrag}
              />
            )}
          </GoogleMap>
        )}
      </div>

      {!value && (
        <p className="text-[11px] text-ink/50">
          💡 Газрын зураг дээр товшоод цэг хатгана уу. Дараа нь чирж нарийвчилж болно.
        </p>
      )}

      {geoError && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {geoError}
        </div>
      )}
    </div>
  );
}

function CoordInput({
  label, value, onChange,
}: {
  label: string;
  value?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider text-ink/40">{label}</div>
      <input
        type="number"
        step="0.00001"
        value={value ?? ""}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
        className="input mono"
        placeholder={label === "Lat" ? "47.918" : "106.917"}
      />
    </label>
  );
}
