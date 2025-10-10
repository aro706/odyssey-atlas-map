import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx'; // Corrected import path
import axios from 'axios';

const Achievements = () => {
    const { user, loading: authLoading } = useAuth();
    const [allAchievements, setAllAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const userAchievementIds = new Set(user?.achievements.map(a => a._id));

    useEffect(() => {
        const fetchAchievements = async () => {
            try {
                const res = await axios.get('http://localhost:3001/api/achievements');
                setAllAchievements(res.data);
            } catch (err) {
                console.error("Error fetching achievements:", err);
                setError("Failed to load achievements catalog.");
            } finally {
                setLoading(false);
            }
        };

        fetchAchievements();
    }, []);

    if (authLoading || loading) {
        return <div className="p-10 text-xl animate-pulse">Loading Accolades...</div>;
    }

    if (error) {
        return <div className="p-10 text-xl text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto p-6 md:p-10">
            <h1 className="text-4xl font-bold font-serif mb-8 text-center text-gray-800">Pathfinder Accolades</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {allAchievements.map((achievement) => {
                    const hasAchievement = userAchievementIds.has(achievement._id);
                    return (
                        <div
                            key={achievement._id}
                            className={`bg-white rounded-lg shadow-lg p-6 flex flex-col items-center text-center transform transition-all duration-300 ${
                                hasAchievement
                                    ? 'border-2 border-yellow-400 scale-100'
                                    : 'opacity-50 grayscale'
                            }`}
                        >
                            <div className={`relative mb-4`}>
                                <i className={`fas fa-${achievement.icon} text-6xl ${hasAchievement ? 'text-yellow-500' : 'text-gray-400'}`}></i>
                                {hasAchievement && (
                                     <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full h-6 w-6 flex items-center justify-center">
                                        <i className="fas fa-check text-white"></i>
                                    </div>
                                )}
                            </div>
                            <h2 className="text-xl font-semibold mb-2 text-gray-800">{achievement.name}</h2>
                            <p className="text-gray-600 text-sm">{achievement.description}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Achievements;
