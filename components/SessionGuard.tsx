'use client';

import { useEffect, useState } from 'react';
import SessionExpiredModal from './ui/SessionExpiredModal';

export default function SessionGuard() {
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const handleExpiry = () => setIsExpired(true);

        // Listen for the custom event dispatched by api.ts
        window.addEventListener('session-expired', handleExpiry);

        return () => window.removeEventListener('session-expired', handleExpiry);
    }, []);

    if (!isExpired) return null;

    return <SessionExpiredModal />;
}
