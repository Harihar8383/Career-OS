// src/pages/JobHunterPage.jsx
import { AppLayout } from '../components/Layout/AppLayout';

export default function JobHunterPage() {
  return (
    <AppLayout>
      <h1 className="text-3xl font-clash-display text-white">Job Hunter Agent</h1>
      <p className="mt-4 text-text-body text-lg font-dm-sans">
        Click "Start" to have your AI agent find jobs for you.
      </p>
      {/* TODO: Build Job Hunter UI */}
    </AppLayout>
  );
}