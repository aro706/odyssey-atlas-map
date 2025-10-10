import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';

// --- HELPER FUNCTIONS ---

const calculateBearing = (start, end) => {
    const [lon1, lat1] = start;
    const [lon2, lat2] = end;
    const toRadians = (deg) => deg * Math.PI / 180;
    const toDegrees = (rad) => rad * 180 / Math.PI;
    const y = Math.sin(toRadians(lon2 - lon1)) * Math.cos(toRadians(lat2));
    const x = Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) - Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(toRadians(lon2 - lon1));
    const bearing = toDegrees(Math.atan2(y, x));
    return (bearing + 360) % 360;
};

function encodePolyline(coordinates) {
    let plat = 0;
    let plng = 0;
    let encoded = '';
    for (let i = 0; i < coordinates.length; i++) {
        const [lng, lat] = coordinates[i];
        const late5 = Math.round(lat * 1e5);
        const lnge5 = Math.round(lng * 1e5);
        const dlat = late5 - plat;
        const dlng = lnge5 - plng;
        plat = late5;
        plng = lnge5;
        encoded += encodeSignedNumber(dlat) + encodeSignedNumber(dlng);
    }
    return encoded;
}
function encodeSignedNumber(num) {
    let sgn_num = num << 1;
    if (num < 0) sgn_num = ~sgn_num;
    return encodeNumber(sgn_num);
}
function encodeNumber(num) {
    let encodeString = '';
    while (num >= 0x20) {
        encodeString += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
        num >>= 5;
    }
    encodeString += String.fromCharCode(num + 63);
    return encodeString;
}


const TourMapView = () => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const personMarker = useRef(null);
    const activePopups = useRef([]);

    const [cityData, setCityData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [walkStartPoint, setWalkStartPoint] = useState(null);
    const [routeGeoJSON, setRouteGeoJSON] = useState(null);
    const [isWalking, setIsWalking] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [streetViewImage, setStreetViewImage] = useState('');
    const [isImageLoading, setIsImageLoading] = useState(false);

    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/cities/paris`)
            .then(res => res.ok ? res.json() : Promise.reject(new Error(`HTTP error! status: ${res.status}`)))
            .then(data => setCityData(data))
            .catch(err => setError(`Failed to fetch map data: ${err.message}`))
            .finally(() => setLoading(false));
    }, [API_BASE_URL]);

    const addOrUpdateMarkers = useCallback(() => {
        if (!map.current || !cityData) return;
        activePopups.current.forEach(p => p.remove());
        activePopups.current = [];
        document.querySelectorAll('.mapboxgl-marker').forEach(marker => marker.remove());

        cityData.landmarks.forEach(landmark => {
            if (!landmark?.coordinates?.length) return;
            const isStartPoint = walkStartPoint?.name === landmark.name;
            const popupAction = walkStartPoint ? (isStartPoint ? 'none' : 'end') : 'start';
            const buttonText = walkStartPoint ? (isStartPoint ? '✓ Start Point' : 'Walk to Here') : 'Start Walk Here';

            const popupContent = `
                <div class="p-2 max-w-xs font-sans">
                    <h3 class="font-bold text-lg text-red-800">${landmark.name}</h3>
                    <p class="text-sm text-gray-600">${landmark.info}</p>
                    <button data-landmark-name="${landmark.name}" data-action="${popupAction}" class="mt-3 w-full bg-red-700 text-white text-sm font-bold py-1 px-3 rounded hover:bg-red-800 transition-colors disabled:bg-gray-400" ${isStartPoint ? 'disabled' : ''}>
                        ${buttonText}
                    </button>
                </div>`;
            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);
            activePopups.current.push(popup);

            new mapboxgl.Marker({ color: isStartPoint ? "#10B981" : "#B91C1C" })
                .setLngLat(landmark.coordinates)
                .setPopup(popup)
                .addTo(map.current);
        });
    }, [cityData, walkStartPoint]);

    const fetchRoute = useCallback(async (start, end) => {
        const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start.join(',')};${end.join(',')}` + `?geometries=geojson&access_token=${accessToken}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Mapbox Directions API request failed.');
            const data = await response.json();
            if (data.routes?.length) {
                setRouteGeoJSON({ type: 'Feature', geometry: data.routes[0].geometry });
            }
        } catch (err) {
            setError("Could not calculate the walking route.");
        }
    }, [accessToken]);
    
    const handlePopupClick = useCallback((e) => {
        const button = e.target.closest('button[data-landmark-name]');
        if (!button) return;
        const { landmarkName, action } = button.dataset;
        const landmark = cityData.landmarks.find(l => l.name === landmarkName);
        if (!landmark) return;

        if (action === 'start') {
            setWalkStartPoint(landmark);
            setRouteGeoJSON(null);
        } else if (action === 'end' && walkStartPoint) {
            fetchRoute(walkStartPoint.coordinates, landmark.coordinates);
        }
    }, [cityData, walkStartPoint, fetchRoute]);

    useEffect(() => {
        if (map.current || !cityData || !mapContainer.current || !accessToken) return;

        mapboxgl.accessToken = accessToken;
        const mapInstance = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: cityData.coordinates,
            zoom: 12
        });
        map.current = mapInstance;
        mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        const currentMapContainer = mapContainer.current;
        currentMapContainer.addEventListener('click', handlePopupClick);

        mapInstance.on('load', () => {
            addOrUpdateMarkers();
            mapInstance.addSource('route', { type: 'geojson', data: null });
            mapInstance.addLayer({
                id: 'route', type: 'line', source: 'route',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#3887be', 'line-width': 5, 'line-opacity': 0.75 }
            });
        });

        return () => {
            currentMapContainer.removeEventListener('click', handlePopupClick);
            mapInstance.remove();
            map.current = null;
        };
    }, [cityData, accessToken, handlePopupClick, addOrUpdateMarkers]);

    useEffect(() => {
        if (!map.current || !map.current.isStyleLoaded()) return;
        addOrUpdateMarkers();
    }, [walkStartPoint, addOrUpdateMarkers]);

    useEffect(() => {
        if (!map.current || !map.current.isStyleLoaded()) return;
        const source = map.current.getSource('route');
        if (source) {
            source.setData(routeGeoJSON || { type: 'Feature', geometry: null });
        }
    }, [routeGeoJSON]);

    const updateStreetViewImage = useCallback(() => {
        if (!routeGeoJSON || !isWalking) return;
        setIsImageLoading(true);
        const routeCoords = routeGeoJSON.geometry.coordinates;
        const currentCoord = routeCoords[currentStep];
        const nextCoord = routeCoords[currentStep + 1] || routeCoords[currentStep - 1];
        if (!nextCoord) {
            setIsImageLoading(false);
            return;
        }
        const bearing = calculateBearing(currentCoord, nextCoord);
        const encoded = encodePolyline(routeCoords);
        const pathOverlay = `path-5+3887be-0.8(${encodeURIComponent(encoded)})`;
        const imageUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${pathOverlay}/${currentCoord.join(',')},15,${bearing},60/800x400?access_token=${accessToken}`;
        setStreetViewImage(imageUrl);
        if (personMarker.current) personMarker.current.setLngLat(currentCoord);
    }, [routeGeoJSON, isWalking, currentStep, accessToken]);

    useEffect(() => {
        if (isWalking && routeGeoJSON) {
            updateStreetViewImage();
        }
    }, [currentStep, isWalking, routeGeoJSON, updateStreetViewImage]);
    
    useEffect(() => {
        if (isWalking && map.current && routeGeoJSON) {
            if (personMarker.current) personMarker.current.remove();
            const el = document.createElement('div');
            el.style.cssText = 'background-image: url(https://placehold.co/24x24/3b82f6/ffffff?text=ME); width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);';
            personMarker.current = new mapboxgl.Marker(el).setLngLat(routeGeoJSON.geometry.coordinates[0]).addTo(map.current);
        }
        return () => personMarker.current?.remove();
    }, [isWalking, routeGeoJSON]);

    const handleStartWalk = () => { setCurrentStep(0); setIsWalking(true); };
    const handleNextStep = () => { if (routeGeoJSON && currentStep < routeGeoJSON.geometry.coordinates.length - 1) setCurrentStep(prev => prev + 1); };
    const handlePrevStep = () => { if (currentStep > 0) setCurrentStep(prev => prev - 1); };
    const handleExitWalk = () => setIsWalking(false);
    const clearWalk = () => { setWalkStartPoint(null); setRouteGeoJSON(null); setIsWalking(false); };

    if (loading) return <div className="p-10 text-xl">Loading map data...</div>;
    if (error) return <div className="p-10 text-xl text-red-500 bg-red-50 rounded-lg">Error: {error}</div>;

    return (
        <div className="w-full h-full relative">
            <div ref={mapContainer} className="absolute top-0 bottom-0 w-full" />
            
            {walkStartPoint && !isWalking && (
                 <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg z-10">
                    <p className="font-bold text-red-800">Walk Mode Active</p>
                    <p>Start: <span className="font-semibold">{walkStartPoint.name}</span></p>
                    <button onClick={clearWalk} className="mt-2 text-xs text-blue-600 hover:underline">Clear Walk</button>
                </div>
            )}

            {routeGeoJSON && !isWalking && (
                 <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg z-10 flex items-center gap-4">
                    <p className="font-bold text-green-700">Route Calculated!</p>
                    <button onClick={handleStartWalk} className="bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition-colors">Start Virtual Walk</button>
                </div>
            )}
            
            {isWalking && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-3xl bg-white p-4 rounded-lg shadow-2xl z-20">
                    <div className="relative h-48 md:h-64 bg-gray-200 rounded flex items-center justify-center">
                        {isImageLoading && <div className="text-gray-500">Loading step...</div>}
                        <img src={streetViewImage} alt="Street level view with route overlay" className="w-full h-full object-cover rounded" onLoad={() => setIsImageLoading(false)} />
                    </div>
                    <div className="flex justify-between items-center mt-4">
                        <button onClick={handlePrevStep} disabled={currentStep === 0} className="bg-gray-700 text-white font-bold py-2 px-6 rounded hover:bg-gray-800 transition-colors disabled:bg-gray-300">Back</button>
                        <p className="text-sm font-semibold">Step {currentStep + 1} of {routeGeoJSON.geometry.coordinates.length}</p>
                        <button onClick={handleNextStep} disabled={!routeGeoJSON || currentStep >= routeGeoJSON.geometry.coordinates.length - 1} className="bg-gray-700 text-white font-bold py-2 px-6 rounded hover:bg-gray-800 transition-colors disabled:bg-gray-300">Next</button>
                    </div>
                    <button onClick={handleExitWalk} className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-extrabold text-lg hover:bg-red-700">&times;</button>
                </div>
            )}
        </div>
    );
};

export default TourMapView;

