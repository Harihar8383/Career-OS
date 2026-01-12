import React from 'react';

const ScoreGauge = ({ score = 0 }) => {
    const safeScore = Math.min(Math.max(score, 0), 100);

    // --- INCREASED SIZE ---
    const width = 300;
    const height = 160; // Slightly more than half of width for the text
    const strokeWidth = 28;
    const radius = 120; // 120 * 2 = 240, fits well within 300 width

    // Semi-circle logic:
    // Circumference of full circle = 2 * PI * r
    // Length of semi-circle arc = PI * r
    const arcLength = Math.PI * radius;

    // Dash Offset calculation for "CSS Gauge":
    // We want the stroke to cover 'score' percent of the semi-circle.
    // strokeDasharray = "arcLength" (this sets the dash length to full curve)
    // strokeDashoffset = arcLength - (arcLength * (score / 100))
    // If score is 100, offset = 0 (full show).
    // If score is 0, offset = arcLength (hidden).
    const dashOffset = arcLength - (arcLength * (safeScore / 100));

    return (
        <div className="flex flex-col items-center justify-center p-6">
            <div className="relative flex flex-col items-center">

                {/* SVG Container */}
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                    <defs>
                        <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="50%" stopColor="#eab308" />
                            <stop offset="100%" stopColor="#22c55e" />
                        </linearGradient>
                        <linearGradient id="track-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#334155" />
                            <stop offset="100%" stopColor="#334155" />
                        </linearGradient>
                    </defs>

                    {/* Background Track (Full Semi-Circle) */}
                    <path
                        d={`M ${width / 2 - radius} ${height - 10} A ${radius} ${radius} 0 0 1 ${width / 2 + radius} ${height - 10}`}
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />

                    {/* Progress Arc */}
                    <path
                        d={`M ${width / 2 - radius} ${height - 10} A ${radius} ${radius} 0 0 1 ${width / 2 + radius} ${height - 10}`}
                        fill="none"
                        stroke="url(#score-gradient)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={arcLength}
                        strokeDashoffset={dashOffset}
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>

                {/* Score Text Overlay (Positioned absolutely to center in the bottom) */}
                <div className="absolute bottom-0 text-center transform translate-y-2">
                    <p className="text-text-secondary text-sm font-bold uppercase tracking-widest mb-1">Match Score</p>
                    <p className="text-7xl font-clash-display font-bold text-white drop-shadow-2xl">
                        {Math.round(safeScore)}%
                    </p>
                </div>

            </div>
        </div>
    );
};

export default ScoreGauge;
