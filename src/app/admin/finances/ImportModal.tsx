
"use client";

import { useState, useRef } from "react";
import { Dialog, DialogTitle, DialogDescription } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileSpreadsheet, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { addDonation } from "@/lib/donations";
import { Donation } from "@/lib/types";

type ExcelRow = Record<string, string | number | undefined>;

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<ExcelRow[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<"idle" | "parsing" | "uploading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };

    const parseFile = async (file: File) => {
        setUploadStatus("parsing");
        setErrorMessage("");

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                setErrorMessage("The file appears to be empty.");
                setUploadStatus("error");
                return;
            }

            // Basic validation: Check if keys likely match standard columns
            // We expect at least: 'Amount' or 'Donor'
            const firstRow = jsonData[0] as ExcelRow;
            if (!firstRow['Amount'] && !firstRow['amount']) {
                setErrorMessage("Could not find an 'Amount' column. Please ensure header row exists.");
                setUploadStatus("error");
                return;
            }

            setPreviewData((jsonData as ExcelRow[]).slice(0, 5)); // Preview first 5
            setUploadStatus("idle");
        } catch (error) {
            console.error("Parse error:", error);
            setErrorMessage("Failed to parse the file. Ensure it is a valid Excel/CSV.");
            setUploadStatus("error");
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploadStatus("uploading");
        setIsProcessing(true);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            let successCount = 0;

            for (const row of jsonData as ExcelRow[]) {
                // Map row to Donation object
                // Capable of handling various casing scenarios
                const amount = Number(row['Amount'] || row['amount'] || 0);
                const donor = String(row['Donor'] || row['donor'] || row['Name'] || row['name'] || "Anonymous");
                const typeRaw = String(row['Type'] || row['type'] || "General");

                // Validate Type
                let type: Donation['type'] = 'General';
                const typeStr = String(typeRaw).toLowerCase();
                if (typeStr.includes('zakat')) type = 'Community Welfare';
                else if (typeStr.includes('sadaqah')) type = 'General Donation';
                else if (typeStr.includes('construction')) type = 'Construction';
                else if (typeStr.includes('education')) type = 'Education';

                // Helper: Date parsing
                // Excel dates are sometimes numbers (days since 1900) or strings
                let date = Date.now();
                const rowDate = row['Date'] || row['date'];
                if (rowDate !== undefined) {
                    if (typeof rowDate === 'number') {
                        // JS Date from Excel serial date
                        date = new Date((rowDate - (25567 + 2)) * 86400 * 1000).getTime();
                    } else {
                        const parsed = new Date(String(rowDate)).getTime();
                        if (!isNaN(parsed)) date = parsed;
                    }
                }

                if (amount > 0) {
                    await addDonation({
                        amount,
                        donorName: donor,
                        type,
                        date,
                        status: 'completed',
                        paymentMethod: 'bank_transfer', // Assume offline/bank for manual imports
                        isAnonymous: donor.toLowerCase() === 'anonymous',
                        message: String(row['Message'] || row['message'] || row['Reference'] || row['reference'] || '')
                    });
                    successCount++;
                }
            }

            console.log(`Successfully imported ${successCount} donations`);
            setUploadStatus("success");
            setTimeout(() => {
                onClose();
                onSuccess();
                // Reset
                setFile(null);
                setPreviewData([]);
                setUploadStatus("idle");
            }, 1500);

        } catch (error) {
            console.error("Upload error:", error);
            setErrorMessage("An error occurred during upload.");
            setUploadStatus("error");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <Dialog static open={isOpen} onClose={() => !isProcessing && onClose()} className="relative z-50">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                        >
                            <div className="p-6 border-b border-secondary-100 dark:border-secondary-800 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-secondary-900 dark:text-secondary-100">Import Donations</h3>
                                <button onClick={onClose} disabled={isProcessing} className="text-secondary-900 hover:text-black dark:text-secondary-100 dark:hover:text-white font-bold">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                {uploadStatus === "success" ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-green-600 dark:text-green-400">
                                        <CheckCircle className="w-16 h-16 mb-4" />
                                        <DialogTitle className="text-2xl font-bold font-heading text-secondary-900 dark:text-white">Import Donation Data</DialogTitle>
                                        <DialogDescription className="text-secondary-900 dark:text-secondary-200 font-medium">
                                            Upload your CSV file from the donation system to bulk import records.
                                        </DialogDescription>
                                    </div>
                                ) : (
                                    <>
                                        {/* Drop Zone / File Input */}
                                        <motion.div
                                            whileHover={{ scale: 1.01, borderColor: "var(--primary-500)" }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${file
                                                ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                                                : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-secondary-50 dark:hover:bg-secondary-800/50'
                                                }`}
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                accept=".xlsx,.xls,.csv"
                                                className="hidden"
                                            />
                                            {file ? (
                                                <>
                                                    <FileSpreadsheet className="w-10 h-10 text-primary-600 dark:text-primary-400 mb-2" />
                                                    <p className="text-sm font-semibold text-secondary-900 dark:text-secondary-200">CSV File detected</p>
                                                    <p className="text-xs font-medium text-secondary-900 dark:text-secondary-200">{(file.size / 1024).toFixed(2)} KB</p>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 text-secondary-900 dark:text-secondary-100 mb-2" />
                                                    <p className="font-medium text-secondary-700 dark:text-secondary-300">Click to upload or drag & drop</p>
                                                    <p className="text-xs font-semibold text-secondary-900 dark:text-secondary-200 mt-1">Supports .xlsx, .xls, .csv</p>
                                                </>
                                            )}
                                        </motion.div>

                                        {/* Error Message */}
                                        {uploadStatus === "error" && (
                                            <div className="flex items-center gap-2 mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-3 rounded-lg border border-red-100 dark:border-red-800">
                                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                                <p>{errorMessage}</p>
                                            </div>
                                        )}

                                        {/* Preview */}
                                        {previewData.length > 0 && (
                                            <div className="mt-6">
                                                <p className="text-xs font-medium text-secondary-900 dark:text-secondary-200 mt-1 uppercase tracking-wider">Rows</p>
                                                <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg border border-secondary-200 dark:border-secondary-700 overflow-hidden">
                                                    <table className="w-full text-xs text-left">
                                                        <thead className="bg-secondary-50 dark:bg-secondary-800 text-secondary-900 dark:text-secondary-200 border-y border-secondary-200 dark:border-secondary-700">
                                                            <tr>
                                                                <th className="px-3 py-2">Date</th>
                                                                <th className="px-3 py-2">Donor</th>
                                                                <th className="px-3 py-2">Amount</th>
                                                                <th className="px-3 py-2">Type</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700 text-secondary-700 dark:text-secondary-200">
                                                            {previewData.map((row, i) => (
                                                                <tr key={i}>
                                                                    <td className="px-3 py-1.5">{String(row['Date'] || row['date'] || '-')}</td>
                                                                    <td className="px-3 py-1.5">{String(row['Donor'] || row['donor'] || row['Name'] || '-')}</td>
                                                                    <td className="px-3 py-1.5">{String(row['Amount'] || row['amount'] || '-')}</td>
                                                                    <td className="px-3 py-1.5">{String(row['Type'] || row['type'] || '-')}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <p className="text-[10px] font-bold text-secondary-900 dark:text-secondary-100 mt-2 text-right">
                                                    * Data will be mapped to system fields automatically.
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {uploadStatus !== "success" && (
                                <div className="p-6 border-t border-secondary-100 dark:border-secondary-800 flex justify-end gap-3 bg-secondary-50/50 dark:bg-secondary-900/50">
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 text-sm font-bold text-secondary-900 dark:text-secondary-100 hover:text-black dark:hover:text-white"
                                        disabled={isProcessing}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpload}
                                        disabled={!file || isProcessing || uploadStatus === "error"}
                                        className="px-4 py-2 bg-secondary-900 dark:bg-primary-600 hover:bg-secondary-800 dark:hover:bg-primary-700 text-white text-sm font-bold rounded-lg shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" /> Process Import
                                            </>
                                        ) : (
                                            "Import Data"
                                        )}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </Dialog>
            )}
        </AnimatePresence>
    );
}
