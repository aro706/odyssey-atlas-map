import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { useAuth } from '../context/AuthContext.jsx'; // Corrected import
import axios from 'axios'; // Import axios

// --- HELPER FUNCTIONS (These do not need to be inside the component) ---
const calculateBearing=(a,b)=>{const [c,d]=a,[e,f]=b,g=a=>a*Math.PI/180,h=a=>a*180/Math.PI,i=Math.sin(g(e-c))*Math.cos(g(f)),j=Math.cos(g(d))*Math.sin(g(f))-Math.sin(g(d))*Math.cos(g(f))*Math.cos(g(e-c));return(h(Math.atan2(i,j))+360)%360};function encodePolyline(a){let b=0,c=0,d="";for(let e=0;e<a.length;e++){const[f,g]=a[e],h=Math.round(g*1e5),i=Math.round(f*1e5),j=h-b,k=i-c;b=h,c=i,d+=encodeSignedNumber(j)+encodeSignedNumber(k)}return d}function encodeSignedNumber(a){let b=a<<1;if(a<0)b=~b;return encodeNumber(b)}function encodeNumber(a){let b="";while(a>=32)b+=String.fromCharCode((32|a&31)+63),a>>=5;b+=String.fromCharCode(a+63);return b}

const TourMapView = () => {
    // Refs
    const mapContainer = useRef(null);
    const map = useRef(null);
    const personMarker = useRef(null);
    const activePopups = useRef([]);
    const audioPlayerRef = useRef(null);
    const ambientAudioRef = useRef(null);

    // State
    const [cityData, setCityData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [walkStartPoint, setWalkStartPoint] = useState(null);
    const [routeGeoJSON, setRouteGeoJSON] = useState(null);
    const [isWalking, setIsWalking] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [streetViewImage, setStreetViewImage] = useState('');
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [audioSrc, setAudioSrc] = useState(null);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [currentLandmark, setCurrentLandmark] = useState(null);
    const [isCityAudioPlaying, setIsCityAudioPlaying] = useState(false);
    const [achievementUnlocked, setAchievementUnlocked] = useState('');
    const [allAchievements, setAllAchievements] = useState([]);

    const { isAuthenticated } = useAuth();
    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

    const awardAchievement = async (achievementId, achievementName) => {
        if (!isAuthenticated || !achievementId) return;

        try {
            await axios.post('http://localhost:3001/api/users/achievements', { achievementId });
            console.log(`Achievement '${achievementName}' awarded!`);
            setAchievementUnlocked(achievementName);
            setTimeout(() => setAchievementUnlocked(''), 5000);
        } catch (err) {
            if (err.response && err.response.status !== 400) {
                console.error('Failed to award achievement', err);
            } else {
                console.log("User may already have this achievement.");
            }
        }
    };

    useEffect(() => {
        const fetchAllAchievements = async () => {
            try {
                const res = await axios.get('http://localhost:3001/api/achievements');
                setAllAchievements(res.data);
            } catch (err) {
                console.error("Could not fetch the list of achievements", err);
            }
        };
        fetchAllAchievements();
    }, []);


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
            const walkPopupAction = walkStartPoint ? (isStartPoint ? 'none' : 'end') : 'start';
            const walkButtonText = walkStartPoint ? (isStartPoint ? '✓ Start Point' : 'Walk to Here') : 'Start Walk Here';

            let storyButton = '';
            if (landmark.story) {
                storyButton = `<button data-landmark-name="${landmark.name}" data-action="play-story" class="mt-2 w-full flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-bold py-1 px-3 rounded hover:bg-blue-700 transition-colors">▶ Listen to Story</button>`;
            }

            const popupContent = `
                <div class="p-2 max-w-xs font-sans">
                    <h3 class="font-bold text-lg text-red-800">${landmark.name}</h3>
                    <p class="text-sm text-gray-600">${landmark.info}</p>
                    <button data-landmark-name="${landmark.name}" data-action="${walkPopupAction}" class="mt-3 w-full bg-red-700 text-white text-sm font-bold py-1 px-3 rounded hover:bg-red-800 transition-colors disabled:bg-gray-400" ${isStartPoint ? 'disabled' : ''}>
                        ${walkButtonText}
                    </button>
                    ${storyButton}
                </div>`;
            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);
            activePopups.current.push(popup);

            new mapboxgl.Marker({ color: isStartPoint ? "#10B981" : "#B91C1C" })
                .setLngLat(landmark.coordinates)
                .setPopup(popup)
                .addTo(map.current);
        });
    }, [cityData, walkStartPoint]);

    const handleCloseAudio = useCallback(() => {
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
        }
        setAudioSrc(null);
        setCurrentLandmark(null);
        setIsLoadingAudio(false);
        setIsCityAudioPlaying(false);
    }, []);

    const playLandmarkStory = useCallback(async (landmark) => {
        handleCloseAudio();
        
        const storyText = landmark.story;
        if (!storyText) return;

        setIsLoadingAudio(true);
        setCurrentLandmark(landmark.name);

        try {
            const response = await fetch(`${API_BASE_URL}/api/generate-speech`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: storyText }) });
            if (!response.ok) throw new Error('Failed to fetch audio from server.');
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            setAudioSrc(audioUrl);

            if (landmark.name === 'Eiffel Tower') {
                const eiffelAchievement = allAchievements.find(a => a.name === 'Parisian Historian');
                if (eiffelAchievement) {
                    awardAchievement(eiffelAchievement._id, eiffelAchievement.name);
                }
            }

        } catch (err) {
            setError(`Audio Error: ${err.message}`);
            handleCloseAudio();
        } finally {
            setIsLoadingAudio(false);
        }
    }, [API_BASE_URL, handleCloseAudio, allAchievements, awardAchievement]);

    const handlePlayCityStory = useCallback(async () => {
        if (isCityAudioPlaying) {
            handleCloseAudio();
            return;
        }

        if (!cityData?.description) return;
        
        handleCloseAudio();
        setIsLoadingAudio(true);
        setIsCityAudioPlaying(true);
        setCurrentLandmark("About the City");

        try {
            const response = await fetch(`${API_BASE_URL}/api/generate-speech`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: cityData.description })
            });
            if (!response.ok) throw new Error('Failed to generate city audio.');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setAudioSrc(url);
        } catch (err) {
            setError(`Audio Error: ${err.message}`);
            handleCloseAudio();
        } finally {
            setIsLoadingAudio(false);
        }
    }, [cityData, isCityAudioPlaying, API_BASE_URL, handleCloseAudio]);

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
            setError("Could not calculate the walking route.",err.message);
        }
    }, [accessToken]);
    
    const handlePopupClick = useCallback((e) => {
        const button = e.target.closest('button[data-landmark-name]');
        if (!button) return;
        const { landmarkName, action } = button.dataset;
        const landmark = cityData.landmarks.find(l => l.name === landmarkName);
        if (!landmark) return;

        if (action === 'start') { setWalkStartPoint(landmark); setRouteGeoJSON(null); } 
        else if (action === 'end' && walkStartPoint) { fetchRoute(walkStartPoint.coordinates, landmark.coordinates); } 
        else if (action === 'play-story') { playLandmarkStory(landmark); }
    }, [cityData, walkStartPoint, fetchRoute, playLandmarkStory]);
    
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
        
        mapInstance.on('load', () => {
            addOrUpdateMarkers();
            mapInstance.addSource('route', { type: 'geojson', data: null });
            mapInstance.addLayer({ id: 'route', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#3887be', 'line-width': 5, 'line-opacity': 0.75 } });
        });
        
        return () => { mapInstance.remove(); map.current = null; };
    }, [cityData, accessToken, addOrUpdateMarkers]);

    useEffect(() => {
        const currentMapContainer = mapContainer.current;
        if (!currentMapContainer) return;
        currentMapContainer.addEventListener('click', handlePopupClick);
        return () => currentMapContainer.removeEventListener('click', handlePopupClick);
    }, [handlePopupClick]);

    useEffect(() => {
        if (!map.current || !map.current.isStyleLoaded()) return;
        addOrUpdateMarkers();
    }, [walkStartPoint, addOrUpdateMarkers]);

    useEffect(() => {
        if (!map.current || !map.current.isStyleLoaded()) return;
        const source = map.current.getSource('route');
        if (source) source.setData(routeGeoJSON || { type: 'Feature', geometry: null });
    }, [routeGeoJSON]);

    const updateStreetViewImage = useCallback(() => {
        if (!routeGeoJSON || !isWalking) return;
        setIsImageLoading(true);
        const routeCoords = routeGeoJSON.geometry.coordinates;
        const currentCoord = routeCoords[currentStep];
        const nextCoord = routeCoords[currentStep + 1] || routeCoords[currentStep - 1];
        if (!nextCoord) { setIsImageLoading(false); return; }
        const bearing = calculateBearing(currentCoord, nextCoord);
        const encoded = encodePolyline(routeCoords);
        const pathOverlay = `path-5+3887be-0.8(${encodeURIComponent(encoded)})`;
        const imageUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${pathOverlay}/${currentCoord.join(',')},15,${bearing},60/800x400?access_token=${accessToken}`;
        setStreetViewImage(imageUrl);
        if (personMarker.current) personMarker.current.setLngLat(currentCoord);
    }, [routeGeoJSON, isWalking, currentStep, accessToken]);

    useEffect(() => { if (isWalking && routeGeoJSON) updateStreetViewImage() }, [currentStep, isWalking, routeGeoJSON, updateStreetViewImage]);
    
    useEffect(() => {
        if (isWalking && map.current && routeGeoJSON) {
            if (personMarker.current) personMarker.current.remove();
            const el = document.createElement('div');
            el.style.cssText = 'background-image: url(https://placehold.co/24x24/3b82f6/ffffff?text=ME); width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);';
            personMarker.current = new mapboxgl.Marker(el).setLngLat(routeGeoJSON.geometry.coordinates[0]).addTo(map.current);
        }
        return () => personMarker.current?.remove();
    }, [isWalking, routeGeoJSON]);

    const handleStartWalk=()=>{
        if (ambientAudioRef.current) {
            ambientAudioRef.current.volume = 0.3;
            ambientAudioRef.current.play();
        }
        setCurrentStep(0);
        setIsWalking(true)
    };
    
    const handleNextStep=()=>{
        if(routeGeoJSON && currentStep < routeGeoJSON.geometry.coordinates.length - 1) {
            setCurrentStep(a=>a+1)
        } else if (routeGeoJSON && currentStep >= routeGeoJSON.geometry.coordinates.length - 1) {
            const walkAchievement = allAchievements.find(a => a.name === "Walk a Mile");
            if (walkAchievement) {
                awardAchievement(walkAchievement._id, walkAchievement.name);
            }
        }
    };
    
    const handlePrevStep=()=>{if(currentStep>0)setCurrentStep(a=>a-1)};
    
    const handleExitWalk=()=>{
        if (ambientAudioRef.current) {
            ambientAudioRef.current.pause();
            ambientAudioRef.current.currentTime = 0;
        }
        setIsWalking(false);
    };

    const clearWalk=()=>{
        if (ambientAudioRef.current) {
            ambientAudioRef.current.pause();
            ambientAudioRef.current.currentTime = 0;
        }
        setWalkStartPoint(null);
        setRouteGeoJSON(null);
        setIsWalking(false);
    };

    if (loading) return <div className="p-10 text-xl">Loading map data...</div>;
    if (error && !cityData) return <div className="p-10 text-xl text-red-500 bg-red-50 rounded-lg">{error}</div>;

    return (
        <div className="w-full h-full relative">
            <audio ref={ambientAudioRef} src="/sounds/city-traffic.mp3" loop />
            <div ref={mapContainer} className="absolute top-0 bottom-0 w-full" />
            
            {achievementUnlocked && (
                <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 font-bold p-4 rounded-lg shadow-2xl z-30 flex items-center gap-4 animate-bounce">
                    <i className="fas fa-trophy text-2xl"></i>
                    <div>
                        <p className="text-sm">Achievement Unlocked!</p>
                        <p>{achievementUnlocked}</p>
                    </div>
                </div>
            )}

            {cityData?.description && (
                <div className="absolute top-4 left-4 z-10">
                    <button 
                        onClick={handlePlayCityStory} 
                        className="bg-white p-2 rounded-full shadow-lg text-gray-700 hover:bg-gray-100 transition-colors"
                        aria-label="Play audio about the city"
                    >
                        {isLoadingAudio && currentLandmark === 'About the City' ? (
                            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.858 8.464a5 5 0 000 7.072m2.828 9.9a9 9 0 000-12.728" /></svg>
                        )}
                    </button>
                </div>
            )}

            {walkStartPoint && !isWalking && ( <div className="absolute top-20 left-4 bg-white p-4 rounded-lg shadow-lg z-10"><p className="font-bold text-red-800">Walk Mode Active</p><p>Start: <span className="font-semibold">{walkStartPoint.name}</span></p><button onClick={clearWalk} className="mt-2 text-xs text-blue-600 hover:underline">Clear Walk</button></div> )}
            {routeGeoJSON && !isWalking && ( <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg z-10 flex items-center gap-4"><p className="font-bold text-green-700">Route Calculated!</p><button onClick={handleStartWalk} className="bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition-colors">Start Virtual Walk</button></div> )}
            {isWalking && ( <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-3xl bg-white p-4 rounded-lg shadow-2xl z-20"><div className="relative h-48 md:h-64 bg-gray-200 rounded flex items-center justify-center">{isImageLoading&&<div className="text-gray-500">Loading step...</div>}<img src={streetViewImage} alt="Street level view with route overlay" className="w-full h-full object-cover rounded" onLoad={()=>setIsImageLoading(false)}/></div><div className="flex justify-between items-center mt-4"><button onClick={handlePrevStep} disabled={currentStep===0} className="bg-gray-700 text-white font-bold py-2 px-6 rounded hover:bg-gray-800 transition-colors disabled:bg-gray-300">Back</button><p className="text-sm font-semibold">Step {currentStep+1} of {routeGeoJSON?.geometry.coordinates.length || 0}</p><button onClick={handleNextStep} disabled={!routeGeoJSON} className="bg-gray-700 text-white font-bold py-2 px-6 rounded hover:bg-gray-800 transition-colors disabled:bg-gray-300">{currentStep >= routeGeoJSON.geometry.coordinates.length - 1 ? 'Finish' : 'Next'}</button></div><button onClick={handleExitWalk} className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-extrabold text-lg hover:bg-red-700">&times;</button></div> )}
            
            {(isLoadingAudio || audioSrc) && (
                 <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg w-11/12 md:w-1/3 z-10">
                    <button onClick={handleCloseAudio} className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md text-gray-600 hover:text-red-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <h4 className="font-bold text-lg text-gray-800 pr-6">{currentLandmark}</h4>
                    {isLoadingAudio && <p className="text-gray-600">Generating audio story...</p>}
                    {audioSrc && ( <audio ref={audioPlayerRef} controls autoPlay src={audioSrc} className="w-full mt-2" onEnded={handleCloseAudio} /> )}
                </div>
            )}

            {error && !isLoadingAudio && cityData && (
                <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-red-100 text-red-700 p-4 rounded-lg shadow-lg z-10">
                    <p>{error}</p>
                </div>
            )}
        </div>
    );
};

export default TourMapView;

