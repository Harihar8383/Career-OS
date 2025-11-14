// src/pages/JDMatcherPage.jsx
import { AppLayout } from '../components/Layout/AppLayout';

export default function JDMatcherPage() {
  return (
    <AppLayout>
      <h1 className="text-3xl font-clash-display text-white">JD Matcher</h1>
      <p className="mt-4 text-text-body text-lg font-dm-sans">
        Paste a job description here to analyze it against your profile.
      </p>
      {/* TODO: Build JD Matcher UI */}
    </AppLayout>
  );
}