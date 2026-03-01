import React from 'react';

interface NeuronLogoProps {
    className?: string;
}

export const NeuronLogo: React.FC<NeuronLogoProps> = ({ className = "w-7 h-7" }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            className={className}
        >
            <defs>
                <linearGradient id="neuron-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                </linearGradient>
                <filter id="neuron-glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            <rect width="512" height="512" rx="128" fill="url(#neuron-grad)" />

            <g transform="translate(106, 106) scale(0.6)" filter="url(#neuron-glow)">
                <circle cx="250" cy="250" r="60" fill="white" />

                <path d="M250 190 L250 100" stroke="white" strokeWidth="24" strokeLinecap="round" />
                <path d="M250 310 L250 400" stroke="white" strokeWidth="24" strokeLinecap="round" />
                <path d="M196 220 L110 170" stroke="white" strokeWidth="24" strokeLinecap="round" />
                <path d="M304 220 L390 170" stroke="white" strokeWidth="24" strokeLinecap="round" />
                <path d="M196 280 L110 330" stroke="white" strokeWidth="24" strokeLinecap="round" />
                <path d="M304 280 L390 330" stroke="white" strokeWidth="24" strokeLinecap="round" />

                <circle cx="250" cy="80" r="35" fill="white" fillOpacity="0.8" />
                <circle cx="250" cy="420" r="35" fill="white" fillOpacity="0.8" />
                <circle cx="90" cy="160" r="35" fill="white" fillOpacity="0.8" />
                <circle cx="410" cy="160" r="35" fill="white" fillOpacity="0.8" />
                <circle cx="90" cy="340" r="35" fill="white" fillOpacity="0.8" />
                <circle cx="410" cy="340" r="35" fill="white" fillOpacity="0.8" />
            </g>
        </svg>
    );
};
