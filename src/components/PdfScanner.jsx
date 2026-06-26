import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudUploadRounded, PictureAsPdfRounded, CheckCircleRounded, AutoAwesomeRounded, ErrorOutlineRounded, CancelRounded } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const PdfScanner = ({ item, onFileSelected }) => {
    const { user, signInWithGoogle } = useAuth();
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const [isAddingNewFile, setIsAddingNewFile] = useState(false);

    const isAuthorized = user && user.email === 'frebrandberg@gmail.com';

    useEffect(() => {
        const fetchAnalysis = async () => {
            if (item && (item.booliId || item.url) && isAuthorized) {
                const id = item.booliId || item.url;
                try {
                    const safeId = encodeURIComponent(id);
                    const docRef = doc(db, "analyses", safeId);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        setScanResult(docSnap.data());
                    }
                } catch (e) {
                    console.error("Error fetching analysis from cloud", e);
                }
            }
        };
        fetchAnalysis();
    }, [item, isAuthorized]);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const analyzeFilesRef = useRef();
    useEffect(() => {
        analyzeFilesRef.current = analyzeFiles;
    });

    useEffect(() => {
        const handlePaste = (e) => {
            if (!isAuthorized || isScanning) return;

            // Ignorera urklipp om användaren skriver i ett textfält
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
                const files = Array.from(e.clipboardData.files);
                const validFiles = files.filter(f => f.type === 'application/pdf' || f.type.startsWith('image/'));

                if (validFiles.length > 0) {
                    e.preventDefault();
                    setSelectedFile(validFiles[0]);
                    if (onFileSelected) onFileSelected(validFiles[0]);
                    if (analyzeFilesRef.current) {
                        analyzeFilesRef.current(validFiles);
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isAuthorized, isScanning, onFileSelected]);

    const analyzeFiles = async (filesArray) => {
        if (!isAuthorized) return;

        let filesToProcess = filesArray;

        let extractedText = null;

        if (filesArray[0].type === 'application/pdf') {
            setIsCompressing(true);
            setError(null);
            try {
                const file = filesArray[0];
                const arrayBuffer = await file.arrayBuffer();
                const typedarray = new Uint8Array(arrayBuffer);
                const pdfDoc = await pdfjsLib.getDocument({ data: typedarray }).promise;
                
                let fullText = "";
                const numPages = pdfDoc.numPages;
                
                for (let i = 1; i <= numPages; i++) {
                    const page = await pdfDoc.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += `--- Sida ${i} ---\n${pageText}\n\n`;
                }
                
                extractedText = fullText;
                filesToProcess = []; // We don't send the raw PDF file anymore
            } catch (err) {
                console.error("PDF Text Extraction Error:", err);
                setError("Kunde inte läsa texten från PDF:en: " + err.message);
                setIsCompressing(false);
                return;
            } finally {
                setIsCompressing(false);
            }
        }

        setIsScanning(true);
        setError(null);
        setIsAddingNewFile(false);

        try {
            const token = await user.getIdToken();

            const isAlreadyProcessed = filesToProcess.length > 0 && !(filesToProcess[0] instanceof File);

            let processedFiles = [];
            if (isAlreadyProcessed) {
                processedFiles = filesToProcess;
            } else {
                const filePromises = filesToProcess.map(file => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const result = reader.result;
                            const base64 = result.split(',')[1];
                            resolve({
                                data: base64,
                                mimeType: file.type
                            });
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                });
                processedFiles = await Promise.all(filePromises);
            }

            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    pdfText: extractedText,
                    files: processedFiles
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                let errMsg = errData.error || "Ett fel uppstod vid analysen.";
                if (errData.details) errMsg += " Detaljer: " + errData.details;
                throw new Error(errMsg);
            }

            const resultObj = await response.json();
            setScanResult(resultObj);

            if (item && (item.booliId || item.url)) {
                try {
                    const id = item.booliId || item.url;
                    const safeId = encodeURIComponent(id);
                    await setDoc(doc(db, "analyses", safeId), resultObj);
                } catch (e) {
                    console.error("Failed to save analysis to cloud", e);
                    setError("Kunde inte spara analysen till molnet. Kontrollera dina databasregler (Firestore Rules): " + e.message);
                }
            }

        } catch (err) {
            console.error("Analysis Error:", err);
            setError(err.message);
        } finally {
            setIsScanning(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            const validFiles = files.filter(f => f.type === 'application/pdf' || f.type.startsWith('image/'));

            if (validFiles.length > 0) {
                setSelectedFile(validFiles[0]);
                if (onFileSelected) onFileSelected(validFiles[0]);
                analyzeFiles(validFiles);
            } else {
                setError("Vänligen släpp en PDF eller bildfil.");
            }
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const validFiles = files.filter(f => f.type === 'application/pdf' || f.type.startsWith('image/'));

            if (validFiles.length > 0) {
                setSelectedFile(validFiles[0]);
                if (onFileSelected) onFileSelected(validFiles[0]);
                analyzeFiles(validFiles);
            } else {
                setError("Vänligen välj en PDF eller bildfil.");
            }
        }
    };

    const renderStatusBall = (status) => {
        let color = '#f59e0b'; // yellow (mellan)
        if (status === 'bra') color = '#10b981'; // green
        if (status === 'daligt') color = '#ef4444'; // red
        if (status === 'saknas') color = '#9ca3af'; // gray

        return (
            <div style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: color,
                flexShrink: 0,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }} />
        );
    };

    return (
        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', maxWidth: '100%', overflow: 'hidden' }}>
            <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AutoAwesomeRounded sx={{ color: '#007aff' }} /> Analysera årsredovisningen
            </h4>

            {!user ? (
                <div style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: '12px',
                    padding: '32px 16px',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px'
                }}>
                    <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                        <AutoAwesomeRounded sx={{ fontSize: 32, color: 'var(--text-tertiary)', marginBottom: '8px' }} /><br />
                        Analysera årsredovisningar är en premiumfunktion.
                    </div>
                    <button
                        onClick={signInWithGoogle}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#007aff',
                            color: 'white',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Logga in med Google
                    </button>
                </div>
            ) : !isAuthorized ? (
                <div style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: '12px',
                    padding: '32px 16px',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px'
                }}>
                    <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                        <ErrorOutlineRounded sx={{ fontSize: 32, color: '#ef4444', marginBottom: '8px' }} /><br />
                        Du saknar behörighet att använda analysverktyget.<br />Endast administratörer har tillgång.
                    </div>
                </div>
            ) : (
                <>
                    {(!scanResult || isAddingNewFile) && !isScanning && !isCompressing && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            style={{
                                border: `2px dashed ${isDragging ? '#007aff' : 'var(--border-color)'}`,
                                borderRadius: '12px',
                                padding: '32px 16px',
                                textAlign: 'center',
                                backgroundColor: isDragging ? 'rgba(0, 122, 255, 0.05)' : 'var(--bg-primary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px'
                            }}
                        >
                            <input
                                type="file"
                                accept="application/pdf,image/png,image/jpeg,image/webp"
                                multiple
                                style={{ display: 'none' }}
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <CloudUploadRounded sx={{ fontSize: 48, color: isDragging ? '#007aff' : 'var(--text-tertiary)' }} />
                            <div>
                                <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                                    Släpp årsredovisning (PDF eller bilder)
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    (eller klicka för att bläddra / klistra in med Ctrl+V)
                                </div>
                            </div>
                        </div>
                    )}

                    {isCompressing && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '32px 0' }}
                        >
                            <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)', textAlign: 'center' }}>Extraherar text från PDF...<br/><span style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>(Blixtsnabbt och säkert)</span></div>
                        </motion.div>
                    )}

                    {isScanning && !isCompressing && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '32px 0' }}
                        >
                            <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTopColor: '#007aff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Läser och analyserar fil(er)...</div>
                        </motion.div>
                    )}

                    {error && (
                        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                            <ErrorOutlineRounded fontSize="small" /> {error}
                        </div>
                    )}

                    {scanResult && !isScanning && !isCompressing && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)', maxWidth: '100%', overflow: 'hidden' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                <div
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: selectedFile ? 'pointer' : 'default', padding: '4px 8px', marginLeft: '-8px', borderRadius: '8px', transition: 'background-color 0.2s' }}
                                    onClick={() => {
                                        if (selectedFile) {
                                            window.open(URL.createObjectURL(selectedFile), '_blank');
                                        }
                                    }}
                                    onMouseEnter={(e) => selectedFile && (e.currentTarget.style.backgroundColor = 'var(--bg-input)')}
                                    onMouseLeave={(e) => selectedFile && (e.currentTarget.style.backgroundColor = 'transparent')}
                                    title={selectedFile ? "Öppna PDF i ny flik" : ""}
                                >
                                    <span style={{
                                        fontWeight: 600,
                                        color: 'var(--text-primary)'
                                    }}>
                                        {scanResult.brfName || selectedFile?.name}
                                    </span>
                                    {selectedFile && (
                                        <PictureAsPdfRounded sx={{ fontSize: '16px', color: 'var(--text-tertiary)' }} />
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        setIsAddingNewFile(!isAddingNewFile);
                                    }}
                                    style={{ background: 'none', border: 'none', color: '#007aff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}
                                >
                                    {isAddingNewFile ? 'Dölj uppladdning' : 'Analysera igen'}
                                </button>
                            </div>

                            {(scanResult.landOwnership || scanResult.isGenuine) && (
                                <div style={{ marginBottom: '16px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                                    {scanResult.landOwnership && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Äger marken:</span>
                                            {scanResult.landOwnership === 'Äganderätt' ? (
                                                <CheckCircleRounded sx={{ color: '#10b981', fontSize: '20px' }} />
                                            ) : scanResult.landOwnership === 'Tomträtt' ? (
                                                <CancelRounded sx={{ color: '#ef4444', fontSize: '20px' }} />
                                            ) : (
                                                <span style={{ color: 'var(--text-tertiary)' }}>{scanResult.landOwnership}</span>
                                            )}
                                        </div>
                                    )}

                                    {scanResult.isGenuine && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Äkta förening:</span>
                                            {scanResult.isGenuine === 'Äkta' ? (
                                                <CheckCircleRounded sx={{ color: '#10b981', fontSize: '20px' }} />
                                            ) : scanResult.isGenuine === 'Oäkta' ? (
                                                <CancelRounded sx={{ color: '#ef4444', fontSize: '20px' }} />
                                            ) : (
                                                <span style={{ color: 'var(--text-tertiary)' }}>{scanResult.isGenuine}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {scanResult.properties && (
                                <div style={{ marginBottom: '16px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                                    {scanResult.properties.apartments > 0 && (
                                        <div style={{ marginBottom: '4px' }}>
                                            Bostäder: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{scanResult.properties.apartments} st</span>
                                            {(scanResult.properties.commercialSpaces > 0 || scanResult.properties.rentals > 0) && (
                                                <span>
                                                    {' (+'}
                                                    {[
                                                        scanResult.properties.commercialSpaces > 0 ? `${scanResult.properties.commercialSpaces} lokal${scanResult.properties.commercialSpaces > 1 ? 'er' : ''}` : null,
                                                        scanResult.properties.rentals > 0 ? `${scanResult.properties.rentals} hyresrätt${scanResult.properties.rentals > 1 ? 'er' : ''}` : null
                                                    ].filter(Boolean).join(' & ')}
                                                    {')'}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {(scanResult.properties.parkingSpaces > 0 || scanResult.properties.garageSpaces > 0) && (
                                        <div>
                                            Parkering: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {scanResult.properties.parkingSpaces > 0 ? `${scanResult.properties.parkingSpaces} st` : ''}
                                                {scanResult.properties.parkingSpaces > 0 && scanResult.properties.garageSpaces > 0 ? ' + ' : ''}
                                                {scanResult.properties.garageSpaces > 0 ? `${scanResult.properties.garageSpaces} garage` : ''}
                                            </span>
                                            {scanResult.properties.evSpaces > 0 && (
                                                <span> ({scanResult.properties.evSpaces} elbil)</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '2px solid var(--border-color)', whiteSpace: 'nowrap' }}>Nyckeltal</th>
                                            {scanResult.years && scanResult.years.map((year, idx) => (
                                                <th key={idx} style={{ textAlign: 'right', padding: '8px', color: 'var(--text-primary)', fontWeight: 600, borderBottom: '2px solid var(--border-color)', whiteSpace: 'nowrap' }}>{year}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { key: 'skuldsattning', label: 'Skuldsättning / kvm' },
                                            { key: 'sparande', label: 'Sparande / kvm' },
                                            { key: 'rantekanslighet', label: 'Räntekänslighet' },
                                            { key: 'energikostnad', label: 'Energikostnad / kvm' },
                                            { key: 'arsavgift', label: 'Årsavgift / kvm' }
                                        ].map((item) => {
                                            return (
                                                <tr key={item.key} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{item.label}</td>
                                                    {scanResult.years && scanResult.years.map((year, idx) => {
                                                        const metricsObj = scanResult.metrics || {};
                                                        const metricData = metricsObj[item.key] || {};
                                                        const yearData = metricData[year] || { value: '-', status: 'saknas' };

                                                        return (
                                                            <td key={idx} style={{ padding: '12px 8px', textAlign: 'right' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                                    <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{yearData.value}</span>
                                                                    {renderStatusBall(yearData.status)}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {scanResult.summary && (
                                <div style={{ marginTop: '16px', fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    {scanResult.summary}
                                </div>
                            )}

                            {scanResult.upcomingLoans && scanResult.upcomingLoans.length > 0 && (
                                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <h5 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Lån som ska villkorsändras i närtid</h5>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {scanResult.upcomingLoans.map((loan, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', paddingBottom: idx !== scanResult.upcomingLoans.length - 1 ? '8px' : '0', borderBottom: idx !== scanResult.upcomingLoans.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                                <div>
                                                    <span style={{ fontWeight: 500 }}>År {loan.year}</span>
                                                    <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>{loan.interestRate} ränta</span>
                                                </div>
                                                <div style={{ fontWeight: 600 }}>{loan.amount}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </>
            )}
        </div>
    );
};

export default PdfScanner;
