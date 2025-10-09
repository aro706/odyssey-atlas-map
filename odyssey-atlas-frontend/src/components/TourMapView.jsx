import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// --- TEMPORARY DATA (for testing without a database) ---
const temporaryStories = {
    "Eiffel Tower": "I am the Iron Lady of Paris. For over a century, I have watched the city awaken and dream. From my heights, lovers have whispered promises and artists have found their muse.",
    "Louvre Museum": "Beneath my glass pyramid lies a world of treasures. Kings once walked these halls, now filled with the silent whispers of art from across the ages.",
    // You can add more temporary stories here by matching the landmark name
};
// ---------------------------------------------------------

const TourMapView = () => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [cityData, setCityData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [audioSrc, setAudioSrc] = useState(null);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [currentLandmark, setCurrentLandmark] = useState(null);

    // Fetch city data from the backend
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

    // Function to generate and play the AI-generated story
    const playStory = async (landmark) => {
        const storyText = landmark.story || temporaryStories[landmark.name];
        if (!storyText || isLoadingAudio) return;

        if (currentLandmark !== landmark.name) {
            setIsLoadingAudio(true);
            setCurrentLandmark(landmark.name);
            setAudioSrc(null);
            setError(null);

            try {
                const response = await fetch('/api/generate-speech', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: storyText })
                });

                if (!response.ok) {
                    const errorBody = await response.json();
                    throw new Error(errorBody.error || 'Failed to fetch audio from server.');
                }

                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                setAudioSrc(audioUrl);
            } catch (err) {
                console.error("Error playing story:", err);
                setError(`Audio Error: ${err.message}`);
            } finally {
                setIsLoadingAudio(false);
            }
        }
    };

    // Initialize the map and add markers
    useEffect(() => {
        if (map.current || !cityData) return;

        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: cityData.coordinates,
            zoom: 12
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        cityData.landmarks.forEach(landmark => {
            if (!landmark?.coordinates || landmark.coordinates.length !== 2) return;

            const hasStory = landmark.story || temporaryStories[landmark.name];
            const popupContent = `
                <div class="p-2 max-w-xs font-sans">
                    <h3 class="font-bold text-lg text-red-800">${landmark.name}</h3>
                    <p class="text-sm text-gray-600">${landmark.info}</p>
                    ${hasStory ? `<button class="play-story-btn mt-3 w-full bg-red-700 text-white text-sm font-bold py-1 px-3 rounded hover:bg-red-800 transition-colors">Listen to the Story</button>` : ''}
                </div>`;

            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);
            popup.on('open', () => {
                const button = popup.getElement().querySelector('.play-story-btn');
                if (button) {
                    button.onclick = () => playStory(landmark);
                }
            });

            new mapboxgl.Marker({ color: "#B91C1C" })
                .setLngLat(landmark.coordinates)
                .setPopup(popup)
                .addTo(map.current);
        });

        // Cleanup function to remove the map instance when the component unmounts
        return () => {
            map.current.remove();
            map.current = null;
        };
    }, [cityData]);

    if (loading) return <div className="p-10 text-xl">Loading city data...</div>;
    if (error && !cityData) return <div className="p-10 text-xl text-red-500">{error}</div>;

    // --- FINAL JSX WITH ROBUST INLINE STYLING ---
    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
            <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />
            
            {(isLoadingAudio || audioSrc) && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg w-11/12 md:w-1/3 z-10">
                    <h4 className="font-bold text-lg text-gray-800">{currentLandmark}</h4>
                    {isLoadingAudio && <p className="text-gray-600">Generating audio story...</p>}
                    {audioSrc && (
                        <audio controls autoPlay src={audioSrc} className="w-full mt-2" />
                    )}
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