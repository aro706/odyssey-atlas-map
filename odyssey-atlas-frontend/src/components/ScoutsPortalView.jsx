import React, { useState, useEffect } from 'react';

// Scout's Portal View Component
const ScoutsPortalView = () => {
    // State to hold city data, loading status, and any errors
    const [cityData, setCityData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // useEffect hook to fetch data when the component mounts
    useEffect(() => {
        // Fetch data from our new backend API.
        // The '/api' prefix will be handled by the Vite proxy.
        fetch('/api/cities/paris')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
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
    }, []); // The empty array means this effect runs only once after the initial render

    // Conditional rendering based on the state
    if (loading) {
        return <div className="p-10 text-xl">Loading city data...</div>;
    }

    if (error) {
        return <div className="p-10 text-xl text-red-500">Error: {error}</div>;
    }

    return (
        <div className="p-6 md:p-10">
            <h2 className="text-4xl font-bold font-serif text-gray-800 mb-4">{cityData.name}</h2>
            <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-lg mb-8">
                <img src={cityData.image} alt={`A view of ${cityData.name}`} className="w-full h-full object-cover" />
            </div>
            <p className="text-lg text-gray-600 leading-relaxed mb-10">{cityData.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Landmarks Section */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-2xl font-bold font-serif mb-4 text-red-800">Key Landmarks</h3>
                    <ul>
                        {cityData.landmarks.map(item => (
                            <li key={item.name} className="border-b last:border-b-0 py-3">
                                <p className="font-bold text-gray-700">{item.name}</p>
                                <p className="text-sm text-gray-500">{item.info}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Culture Section */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-2xl font-bold font-serif mb-4 text-red-800">Culture & Vibe</h3>
                     <ul>
                        {cityData.culture.map(item => (
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
