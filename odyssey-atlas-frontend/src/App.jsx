import React, { useState } from 'react';

// Import the components from their new files
import SidebarNav from './components/SidebarNav';
import ScoutsPortalView from './components/ScoutsPortalView';
import PlaceholderView from './components/PlaceholderView';

// --- Main App Component ---
export default function App() {
    // State to manage which view is currently active
    const [activeView, setActiveView] = useState('scouts-portal');

    // Function to render the correct view based on state
    const renderActiveView = () => {
        switch (activeView) {
            case 'scouts-portal':
                return <ScoutsPortalView />;
            case 'tour-maps':
                return <PlaceholderView title="Tour Maps & History" />;
            case 'ringmasters-drills':
                return <PlaceholderView title="Ringmaster's Drills" />;
            case 'top-scout-board':
                return <PlaceholderView title="Top Scout Board" />;
            case 'logbook':
                return <PlaceholderView title="Performer's Logbook" />;
            default:
                return <ScoutsPortalView />;
        }
    };

    return (
        <div className="bg-gray-100 text-gray-800 font-sans">
            <div className="min-h-screen flex flex-col md:flex-row">
                <SidebarNav activeView={activeView} setActiveView={setActiveView} />
                <main className="flex-1">
                    {renderActiveView()}
                </main>
            </div>
        </div>
    );
}
