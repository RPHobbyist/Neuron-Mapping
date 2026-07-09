/*
 * Neuron Mapping
 * Copyright (C) 2026 Rp Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// CORE SYSTEM CONFIGURATION

/**
 * System Identity Configuration
 * Critical for application integrity and environment synchronization.
 */
export const SYSTEM_CONFIG = {
    // Assets from environment or defaults
    get githubUrl() {
        return import.meta.env.VITE_GITHUB_URL || "https://github.com/RPHobbyist/Neuron-Mapping";
    },
    get youtubeUrl() {
        return import.meta.env.VITE_YOUTUBE_URL || "https://youtu.be/tZC3a-83HXI";
    },
    get youtubePlaylistUrl() {
        return import.meta.env.VITE_YOUTUBE_PLAYLIST_URL || "https://www.youtube.com/playlist?list=PLwLQ_Xr7StXi2H1R3ZEGeMu5MX3V3ZXqD";
    },
    get downloadUrl() {
        return import.meta.env.VITE_DOWNLOAD_URL || "https://github.com/RPHobbyist/Neuron-Mapping/releases";
    },
    get logo() {
        return import.meta.env.VITE_VENDOR_LOGO || "/logo.svg";
    },
    get brandLogo() {
        return import.meta.env.VITE_BRAND_LOGO || "/logo.svg";
    },

    // Protected Identifiers
    get appName() {
        return "Neuron Mapping";
    },

    get vendor() {
        return import.meta.env.VITE_VENDOR_NAME || "RP Hobbyist";
    },

    get vendorLink() {
        return import.meta.env.VITE_VENDOR_URL || "https://www.rphobbyist.com";
    },

    get vendorEmail() {
        return import.meta.env.VITE_VENDOR_EMAIL || "rphobbyist@gmail.com";
    },

    get baseUrl() {
        return import.meta.env.VITE_BASE_URL || "https://neuron-mapping.rphobbyist.com";
    },

    // Identity Logic
    get isOfficial() {
        return import.meta.env.VITE_IS_OFFICIAL === 'true';
    },

    // License Validation Header
    get licenseRef() {
        return `GNU AGPLv3 License - Copyright (c) 2026 ${this.vendor}`;
    }
};
