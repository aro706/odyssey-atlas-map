import React from 'react';

// --- SVG Icons ---
// It's good practice to keep related, small components like icons in the same file as where they are primarily used.
const CompassIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7m-6 10h6" />
    </svg>
);
const MapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const QuizIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const LeaderboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0h6m-6 0H9m0 0h.01M17 19v-2a2 2 0 00-2-2h-2a2 2 0 00-2 2v2m4 0h-4m0 0h.01M13 12a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);
const LogbookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

// Sidebar Navigation Component
const SidebarNav = ({ activeView, setActiveView }) => {
    const navItems = [
        { id: 'scouts-portal', text: "Scout's Portal", icon: <CompassIcon /> },
        { id: 'tour-maps', text: "Tour Maps & History", icon: <MapIcon /> },
        { id: 'ringmasters-drills', text: "Ringmaster's Drills", icon: <QuizIcon /> },
        { id: 'top-scout-board', text: "Top Scout Board", icon: <LeaderboardIcon /> },
        { id: 'logbook', text: "Performer's Logbook", icon: <LogbookIcon /> },
    ];

    return (
        <nav className="bg-red-800 text-white w-full md:w-64 flex-shrink-0 md:h-screen md:sticky md:top-0">
            <div className="p-6 text-center border-b border-red-700">
                <h1 className="text-3xl font-serif">The Odyssey Atlas</h1>
                <p className="text-sm text-red-200 mt-1">Guiding the circus to every new city.</p>
            </div>
            <ul className="p-4">
                {navItems.map(item => (
                    <li key={item.id}>
                        <a
                            href={`#${item.id}`}
                            onClick={() => setActiveView(item.id)}
                            className={`flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${activeView === item.id ? 'bg-red-900 font-bold' : 'hover:bg-red-700'}`}
                        >
                            {item.icon}
                            <span>{item.text}</span>
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default SidebarNav;
