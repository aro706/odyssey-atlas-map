import React, { useState } from 'react';

import SidebarNav from './components/SidebarNav';
import ScoutsPortalView from './components/ScoutsPortalView';
import PlaceholderView from './components/PlaceholderView';
import TourMapView from './components/TourMapView';

export default function App() {
    const [activeView, setActiveView] = useState('scouts-portal');

    const renderActiveView = () => {
        switch (activeView) {
            case 'scouts-portal':
                return <ScoutsPortalView />;
            case 'tour-maps':
                return <TourMapView />;
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

