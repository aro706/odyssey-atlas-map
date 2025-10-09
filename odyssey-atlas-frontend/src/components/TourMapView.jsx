import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';

const TourMapView = () => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [cityData, setCityData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Step 1: Fetch city data from our backend
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

    // Step 2: Initialize the map once data is available
    useEffect(() => {
        if (map.current || !cityData || !Array.isArray(cityData.coordinates) || cityData.coordinates.length !== 2) {
            return;
        }

        const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
        if (!accessToken) {
            setError("Mapbox Access Token is missing. Please check your .env.local file and restart the dev server.");
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
            if (landmark && Array.isArray(landmark.coordinates) && landmark.coordinates.length === 2) {
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
                        <div class="mt-2">
                            <p class="text-xs font-bold text-gray-700 mb-1">Sounds of the City:</p>
                            <audio controls class="w-full h-8" src="${landmark.sound}" preload="none">
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                         <button class="mt-3 w-full bg-red-700 text-white text-sm font-bold py-1 px-3 rounded hover:bg-red-800 transition-colors">
                            Start Walk Here
                        </button>
                    </div>
                `;

                const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);

                new mapboxgl.Marker({ color: "#B91C1C" })
                    .setLngLat(landmark.coordinates)
                    .setPopup(popup)
                    .addTo(map.current);
            }
        });

    }, [cityData]);

    if (loading) return <div className="p-10 text-xl">Loading map data...</div>;
    if (error) return <div className="p-10 text-xl text-red-500 bg-red-50 rounded-lg">Error: {error}</div>;

    return (
        <div className="w-full h-full relative">
            <div ref={mapContainer} className="absolute top-0 bottom-0 w-full" />
        </div>
    );
};

export default TourMapView;

