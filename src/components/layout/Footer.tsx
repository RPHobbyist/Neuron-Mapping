import { SYSTEM_CONFIG } from "@/lib/core/core-system";
import { LicenseDialog } from "@/components/feedback/LicenseDialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ShieldCheck, Info } from "lucide-react";

export const Footer = () => {
    return (
        <footer className="bg-white border-t px-6 py-2 flex items-center justify-between flex-shrink-0 text-xs">
            <div className="flex items-center gap-4 text-gray-500">
                <span>
                    Made by <a href={SYSTEM_CONFIG.vendorLink} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{SYSTEM_CONFIG.vendor}</a>
                </span>
                <LicenseDialog />
                <a
                    href="https://github.com/RPHobbyist/Neuron-Mapping/releases/download/Software/Neuron_Mapping_v.1.5.0.zip"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors whitespace-nowrap"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download Software
                </a>

                <a
                    href="https://github.com/RPHobbyist/neuron-mapping"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors whitespace-nowrap"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
                    GitHub
                </a>

                <a
                    href="https://www.youtube.com/playlist?list=PLwLQ_Xr7StXi2H1R3ZEGeMu5MX3V3ZXqD"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors whitespace-nowrap"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                    Tutorials
                </a>
            </div>

            <HoverCard openDelay={0} closeDelay={0}>
                <HoverCardTrigger asChild>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/80 text-gray-600 cursor-help hover:bg-slate-200/80 transition-colors">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span className="font-medium">Private & Secure</span>
                    </div>
                </HoverCardTrigger>
                <HoverCardContent side="top" align="end" className="w-80">
                    <div className="flex gap-3">
                        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-gray-600 leading-relaxed">
                            Your privacy matters — No user data is collected or stored on external servers. All data remains in your local storage.
                        </p>
                    </div>
                </HoverCardContent>
            </HoverCard>
        </footer>
    );
};
