import React, { useState, useEffect } from 'react';

// Use the environment variable for the base URL. For local dev, this will be undefined, 
// so we default to a relative path ('') which will use the Vite proxy.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const ScoutsPortalView = () => {
    const [cityData, setCityData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Use the API_BASE_URL constant to construct the full fetch URL.
        fetch(`${API_BASE_URL}/api/cities/paris`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok (${response.status})`);
                }
                return response.json();
            })
            .then(data => {
                setCityData(data);
                setLoading(false);
            })
            .catch(error => {
                setError(error.message);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="p-10 text-xl animate-pulse">Loading city data...</div>;
    }

    if (error) {
        return (
            <div className="p-10 text-center">
                <p className="text-2xl font-bold text-red-600">Failed to Load City Data</p>
                <p className="mt-2 text-gray-600">Please ensure the backend server is running and the VITE_API_BASE_URL is correctly set if this is a live deployment.</p>
                <p className="mt-4 text-sm text-gray-500 bg-red-50 p-3 rounded-lg">Error details: {error}</p>
            </div>
        );
    }
    
    if (!cityData) {
        return <div className="p-10 text-xl">No city data was found.</div>;
    }

    return (
        <div className="p-6 md:p-10">
            <h2 className="text-4xl font-bold font-serif text-gray-800 mb-4">{cityData.name}</h2>
            <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-lg mb-8">
                <img src={cityData.image} alt={`A view of ${cityData.name}`} className="w-full h-full object-cover" />
            </div>
            <p className="text-lg text-gray-600 leading-relaxed mb-10">{cityData.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-2xl font-bold font-serif mb-4 text-red-800">Key Landmarks</h3>
                    <ul>
                        {cityData.landmarks?.map(item => (
                            <li key={item.name} className="border-b last:border-b-0 py-3">
                                <p className="font-bold text-gray-700">{item.name}</p>
                                <p className="text-sm text-gray-500">{item.info}</p>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-2xl font-bold font-serif mb-4 text-red-800">Culture & Vibe</h3>
                     <ul>
                        {cityData.culture?.map(item => (
                            <li key={item.name} className="border-b last:border-b-0 py-3">
                                <p className="font-bold text-gray-700">{item.name}</p>
                                <p className="text-sm text-gray-500">{item.info}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ScoutsPortalView;

