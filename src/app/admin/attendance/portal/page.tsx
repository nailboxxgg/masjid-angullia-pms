"use client";

import { useState } from "react";
import { Copy, Clock, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clockInStaff, clockOutStaff } from "@/lib/staff";

export default function AttendancePortal() {
    const [staffId, setStaffId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [staffName, setStaffName] = useState<string | null>(null);

    const handleClockIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!staffId.trim()) return;
        setIsLoading(true);
        setMessage(null);
        setStaffName(null);

        const result = await clockInStaff(staffId.trim());

        if (result.success) {
            setMessage({ text: result.message, type: 'success' });
            if (result.staff) setStaffName(result.staff.name);
            setStaffId("");
        } else {
            setMessage({ text: result.message, type: 'error' });
        }
        setIsLoading(false);
    };

    const handleClockOut = async () => {
        if (!staffId.trim()) return;
        setIsLoading(true);
        setMessage(null);
        setStaffName(null);

        const result = await clockOutStaff(staffId.trim());

        if (result.success) {
            setMessage({ text: result.message, type: 'success' });
            if (result.staff) setStaffName(result.staff.name);
            setStaffId("");
        } else {
            setMessage({ text: result.message, type: 'error' });
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-secondary-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary-500/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-[3rem] p-8 md:p-12 shadow-2xl"
            >
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-secondary-900/50 text-primary-400 mb-6 shadow-inner ring-1 ring-white/10"
                    >
                        <Clock className="w-10 h-10" />
                    </motion.div>
                    <motion.h1
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl font-black text-white font-heading tracking-tight mb-2"
                    >
                        Attendance Portal
                    </motion.h1>
                    <motion.p
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-secondary-400 text-lg font-medium"
                    >
                        Enter your Staff ID to clock in or out.
                    </motion.p>
                </div>

                <form onSubmit={handleClockIn} className="space-y-6">
                    <div className="relative">
                        <input
                            type="text"
                            value={staffId}
                            onChange={(e) => setStaffId(e.target.value.toUpperCase())}
                            placeholder="e.g. S-123456"
                            className="w-full text-center text-3xl font-black tracking-widest uppercase bg-secondary-900/50 border-2 border-secondary-700 focus:border-primary-500 rounded-2xl py-6 text-white placeholder-secondary-700 outline-none transition-all shadow-inner"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="submit" // Default submit is clock in
                            disabled={isLoading || !staffId}
                            className="w-full py-4 rounded-2xl bg-green-500 hover:bg-green-400 text-secondary-900 font-black text-lg shadow-lg shadow-green-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            TIME IN
                        </button>
                        <button
                            type="button"
                            onClick={handleClockOut}
                            disabled={isLoading || !staffId}
                            className="w-full py-4 rounded-2xl bg-secondary-800 hover:bg-secondary-700 text-white font-black text-lg shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            TIME OUT
                        </button>
                    </div>
                </form>

                {/* Status Message */}
                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className={`mt-8 p-4 rounded-2xl text-center font-bold text-sm ${message.type === 'success'
                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                }`}
                        >
                            {message.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Info */}
                <div className="mt-10 text-center text-[10px] text-secondary-600 font-bold uppercase tracking-widest opacity-50">
                    Masjid Angullia Staff System
                </div>
            </motion.div>
        </div>
    );
}
