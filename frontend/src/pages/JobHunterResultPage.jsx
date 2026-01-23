// src/pages/JobHunterResultPage.jsx
import { AppLayout } from '../components/Layout/AppLayout';
import { JobHunterLogs } from '../components/JobHunter/JobHunterLogs';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function JobHunterResultPage() {
    const { runId } = useParams();
    const navigate = useNavigate();

    // In a real app, you'd fetch the config based on runId
    // For now, using mock data from sessionStorage or providing defaults
    const config = sessionStorage.getItem('jobHunterConfig')
        ? JSON.parse(sessionStorage.getItem('jobHunterConfig'))
        : {
            jobTitles: ['Software Engineer'],
            locationTypes: ['remote'],
            locations: [],
            salaryRange: [500000, 1500000],
            employmentTypes: ['full-time']
        };

    return (
        <div className="max-w-7xl mx-auto space-y-4 pb-20">
            <button
                onClick={() => navigate('/dashboard/hunter')}
                className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors group"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Back to Configuration
            </button>
            <JobHunterLogs config={config} />
        </div>
    );
}
