import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const TourMapView = () => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [cityData, setCityData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [audioSrc, setAudioSrc] = useState(null);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [currentLandmark, setCurrentLandmark] = useState(null);

    // Fetch city data
    useEffect(() => {
        fetch('/api/cities/paris')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                setCityData(data);
                setLoading(false);
            })
            .catch(error => {
                setError(`Failed to fetch map data: ${error.message}`);
                setLoading(false);
            });
    }, []);

    // Function to generate and play AI story
    const playStory = async (landmark) => {
        if (!landmark.story || currentLandmark === landmark.name) {
            return;
        }
        
        setIsLoadingAudio(true);
        setCurrentLandmark(landmark.name);
        setAudioSrc(null);

        try {
            const response = await fetch('/api/generate-speech', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: landmark.story })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch audio from server.');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            setAudioSrc(audioUrl);

        } catch (err) {
            console.error("Error playing story:", err);
            setError("Could not load audio for the story.");
        } finally {
            setIsLoadingAudio(false);
        }
    };

    // Initialize map and add markers
    useEffect(() => {
        if (map.current || !cityData) return;

        const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
        if (!accessToken) {
            setError("Mapbox Access Token is missing.");
            return;
        }

        mapboxgl.accessToken = accessToken;
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: cityData.coordinates,
            zoom: 12
        });
        
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        cityData.landmarks.forEach(landmark => {
            if (landmark?.coordinates?.length !== 2) return;

            const randomFact = landmark.facts && landmark.facts.length > 0 
                ? landmark.facts[Math.floor(Math.random() * landmark.facts.length)]
                : 'No facts available.';

            const popupContent = `
                <div class="p-2 max-w-xs font-sans">
                    <h3 class="font-bold text-lg text-red-800">${landmark.name}</h3>
                    <p class="text-sm text-gray-600">${landmark.info}</p>
                    <div class="mt-2 p-2 bg-yellow-100 rounded-md border border-yellow-200">
                        <p class="text-xs font-bold text-yellow-800">Fun Fact</p>
                        <p class="text-xs text-yellow-700">${randomFact}</p>
                    </div>
                    ${landmark.story ? `<button class="play-story-btn mt-3 w-full bg-red-700 text-white text-sm font-bold py-1 px-3 rounded hover:bg-red-800 transition-colors">
                        Listen to the Story
                    </button>` : ''}
                </div>
            `;

            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);
            
            popup.on('open', () => {
                const button = popup.getElement().querySelector('.play-story-btn');
                if (button) {
                    button.addEventListener('click', () => playStory(landmark));
                }
            });

            new mapboxgl.Marker({ color: "#B91C1C" })
                .setLngLat(landmark.coordinates)
                .setPopup(popup)
                .addTo(map.current);
        });

    }, [cityData]);

    if (loading) return <div className="p-10 text-xl">Loading map data...</div>;
    if (error) return <div className="p-10 text-xl text-red-500 bg-red-50 rounded-lg">Error: {error}</div>;

    return (
        <div className="w-full h-screen relative">
            <div ref={mapContainer} className="absolute top-0 bottom-0 w-full" />
            
            {(isLoadingAudio || audioSrc) && (
                 <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg w-11/12 md:w-1/3 z-10">
                    <h4 className="font-bold text-lg text-gray-800">{currentLandmark}</h4>
                    {isLoadingAudio && <p className="text-gray-600">Generating audio story...</p>}
                    {audioSrc && (
                        <audio controls autoPlay src={audioSrc} className="w-full mt-2">
                            Your browser does not support the audio element.
                        </audio>
                    )}
                 </div>
            )}
        </div>
    );
};

export default TourMapView;