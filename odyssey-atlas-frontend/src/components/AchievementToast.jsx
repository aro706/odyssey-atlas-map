import React from 'react';

const AchievementToast = ({ achievement, onDismiss }) => (
    <div className="fixed top-5 right-5 bg-yellow-400 text-gray-900 p-4 rounded-lg shadow-lg z-50 animate-bounce">
        <div className="flex items-center">
            <span className="text-2xl mr-3">🏆</span>
            <div>
                <p className="font-bold">Achievement Unlocked!</p>
                <p>{achievement}</p>
            </div>
            <button onClick={onDismiss} className="ml-4 text-xl font-bold">&times;</button>
        </div>
    </div>
);

export default AchievementToast;