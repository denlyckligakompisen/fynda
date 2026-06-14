import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudUploadRounded, PictureAsPdfRounded, CheckCircleRounded, AutoAwesomeRounded, ErrorOutlineRounded } from '@mui/icons-material';

const PdfScanner = ({ item, onFileSelected }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isAddingNewFile, setIsAddingNewFile] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState(false);

    const handleUnlock = async () => {
        try {
            const res = await fetch('/api/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: passwordInput })
            });
            if (res.ok) {
                setIsUnlocked(true);
                setPasswordError(false);
            } else {
                setPasswordError(true);
            }
        } catch (err) {
            console.error("Fel vid verifiering", err);
            setPasswordError(true);
        }
    };

    useEffect(() => {
        const fetchAnalysis = async () => {
            if (item && (item.booliId || item.url) && isUnlocked) {
                const id = item.booliId || item.url;
                try {
                    const res = await fetch(`/api/getAnalysis?id=${encodeURIComponent(id)}`);
                    if (res.ok) {
                        const json = await res.json();
                        if (json.found) {
                            setScanResult(json.data);
                        }
                    } else if (res.status === 401) {
                        // Inte inloggad, vilket förväntas om man laddar sidan och inte låst upp än
                        // Vi behöver egentligen inte göra något, eftersom isUnlocked hanterar rutan
                    }
                } catch (e) {
                    console.error("Error fetching analysis from cloud", e);
                }
            }
        };
        fetchAnalysis();
    }, [item, isUnlocked]);

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

    const analyzePdf = async (file) => {
        if (file.size > 3.5 * 1024 * 1024) {
            setError("Filen är för stor för Vercel Serverless (Max 3.5 MB).");
            return;
        }

        setIsScanning(true);
        setError(null);
        setIsAddingNewFile(false);

        try {
            const base64Data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result;
                    const base64 = result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    pdfBase64: base64Data
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Ett fel uppstod vid analysen.");
            }

            const resultObj = await response.json();
            setScanResult(resultObj);

            if (item && (item.booliId || item.url)) {
                try {
                    await fetch('/api/saveAnalysis', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: item.booliId || item.url,
                            data: resultObj
                        })
                    });
                } catch (e) {
                    console.error("Failed to save analysis to cloud", e);
                }
            }

        } catch (err) {
            console.error("PDF Analysis Error:", err);
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
            const file = e.dataTransfer.files[0];
            if (file.type === 'application/pdf') {
                setSelectedFile(file);
                if (onFileSelected) onFileSelected(file);
                analyzePdf(file);
            } else {
                setError("Vänligen släpp en PDF-fil.");
            }
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.type === 'application/pdf') {
                setSelectedFile(file);
                if (onFileSelected) onFileSelected(file);
                analyzePdf(file);
            } else {
                setError("Vänligen välj en PDF-fil.");
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
        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px' }}>
            <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AutoAwesomeRounded sx={{ color: '#007aff' }} /> AI Årsredovisningsanalys
            </h4>

            {!isUnlocked ? (
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
                        Analysera årsredovisningar är en premiumfunktion.<br />Ange lösenord för att låsa upp.
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleUnlock(); }}
                            placeholder="Lösenord"
                            style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: `1px solid ${passwordError ? '#ef4444' : 'var(--border-color)'}`,
                                background: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                outline: 'none'
                            }}
                        />
                        <button
                            onClick={handleUnlock}
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
                            Lås upp
                        </button>
                    </div>
                    {passwordError && (
                        <div style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '-8px' }}>Fel lösenord!</div>
                    )}
                </div>
            ) : (
                <>
                    {(!scanResult || isAddingNewFile) && !isScanning && (
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
                                accept="application/pdf"
                                style={{ display: 'none' }}
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <CloudUploadRounded sx={{ fontSize: 48, color: isDragging ? '#007aff' : 'var(--text-tertiary)' }} />
                            <div>
                                <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                                    Släpp årsredovisning här
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    (eller klicka för att bläddra)
                                </div>
                            </div>
                        </div>
                    )}

                    {isScanning && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '32px 0' }}
                        >
                            <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTopColor: '#007aff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Läser och analyserar PDF...</div>
                        </motion.div>
                    )}

                    {error && (
                        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                            <ErrorOutlineRounded fontSize="small" /> {error}
                        </div>
                    )}

                    {scanResult && !isScanning && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircleRounded sx={{ color: '#10b981', fontSize: '20px' }} />
                                    <span style={{ fontWeight: 600 }}>{scanResult.brfName || selectedFile?.name}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsAddingNewFile(!isAddingNewFile);
                                    }}
                                    style={{ background: 'none', border: 'none', color: '#007aff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}
                                >
                                    {isAddingNewFile ? 'Dölj uppladdning' : 'Analysera ny fil'}
                                </button>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '2px solid var(--border-color)' }}>Nyckeltal</th>
                                            {scanResult.years && scanResult.years.map((year, idx) => (
                                                <th key={idx} style={{ textAlign: 'right', padding: '8px', color: 'var(--text-primary)', fontWeight: 600, borderBottom: '2px solid var(--border-color)' }}>{year}</th>
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
                        </motion.div>
                    )}
                </>
            )}
        </div>
    );
};

export default PdfScanner;
