import React, { useState, useEffect } from 'react';

// For simplicity, we'll hardcode a user ID. In a real app, this would come from an authentication system.
const FAKE_USER_ID = 'user123';

const LogbookView = () => {
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`/api/user/${FAKE_USER_ID}`)
            .then(res => {
                if (!res.ok) throw new Error('Could not fetch user profile.');
                return res.json();
            })
            .then(data => {
                setUserProfile(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-10 text-xl">Loading Logbook...</div>;
    if (error) return <div className="p-10 text-xl text-red-500">{error}</div>;

    return (
        <div className="p-10">
            <h2 className="text-4xl font-bold font-serif text-gray-800">Performer's Logbook</h2>
            <p className="mt-2 text-lg text-gray-600">Your journey and accolades so far.</p>

            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-2xl font-bold font-serif mb-4 text-red-800">Achievements Unlocked</h3>
                {userProfile && userProfile.achievements.length > 0 ? (
                    <ul className="mt-4 space-y-3">
                        {userProfile.achievements.map(ach => (
                            <li key={ach} className="flex items-center text-gray-700 p-2 bg-yellow-50 rounded">
                                <span className="text-xl mr-4">🏆</span> {ach}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-4 text-gray-500">No achievements yet. Go explore the map and listen to some stories!</p>
                )}
            </div>
        </div>
    );
};

export default LogbookView;