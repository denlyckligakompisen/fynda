import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudUploadRounded, PictureAsPdfRounded, CheckCircleRounded, AutoAwesomeRounded, ErrorOutlineRounded, FingerprintRounded } from '@mui/icons-material';

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

    const handleUnlock = () => {
        if (passwordInput === 'grodanboll1337') {
            setIsUnlocked(true);
            setPasswordError(false);
        } else {
            setPasswordError(true);
        }
    };

    const [isBiometricsSupported, setIsBiometricsSupported] = useState(false);

    useEffect(() => {
        if (window.PublicKeyCredential) {
            PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
                .then(available => setIsBiometricsSupported(available))
                .catch(() => setIsBiometricsSupported(false));
        }
    }, []);

    const bufferDecode = (value) => {
        return Uint8Array.from(atob(value), c => c.charCodeAt(0));
    };

    const bufferEncode = (value) => {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(value)))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");
    };

    const handleBiometricLogin = async () => {
        try {
            const credentialId = localStorage.getItem('webauthn_credential_id');
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            if (!credentialId) {
                const publicKey = {
                    challenge: challenge,
                    rp: { name: "Fynda" },
                    user: {
                        id: new Uint8Array(16),
                        name: "user@fynda.se",
                        displayName: "Fynda Användare"
                    },
                    pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required"
                    },
                    timeout: 60000,
                    attestation: "none"
                };
                window.crypto.getRandomValues(publicKey.user.id);
                
                const credential = await navigator.credentials.create({ publicKey });
                const rawId = bufferEncode(credential.rawId);
                localStorage.setItem('webauthn_credential_id', rawId);
                
                setIsUnlocked(true);
                setPasswordError(false);
            } else {
                const publicKey = {
                    challenge: challenge,
                    allowCredentials: [{
                        type: 'public-key',
                        id: bufferDecode(credentialId)
                    }],
                    userVerification: "required",
                    timeout: 60000
                };
                await navigator.credentials.get({ publicKey });
                setIsUnlocked(true);
                setPasswordError(false);
            }
        } catch (err) {
            console.error("Biometric Error", err);
            // Ignore error, allow fallback to password
        }
    };

    useEffect(() => {
        if (item && (item.booliId || item.url)) {
            const cacheKey = `pdf_scan_${item.booliId || item.url}`;
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                try {
                    setScanResult(JSON.parse(cachedData));
                } catch (e) {
                    console.error("Error parsing cached scan data", e);
                }
            }
        }
    }, [item]);

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
        if (file.size > 15 * 1024 * 1024) {
            setError("Filen är för stor. Maxstorlek är 15 MB.");
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

            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
                throw new Error("Saknar Gemini API-nyckel i .env (VITE_GEMINI_API_KEY).");
            }

            const prompt = `Du är en expert på att analysera svenska årsredovisningar för bostadsrättsföreningar.
Läs igenom bifogad årsredovisning och extrahera data för de TRE SENASTE ÅREN som redovisas.
Hitta och bedöm följande nyckeltal för alla tre åren enligt mina strikta regler:

1. Skuldsättning / kvm upplåten bostadsrätt
   - Bra: under 8000
   - Dåligt: över 15000
   - Mellan: annars

2. Sparande per kvadratmeter
   - Bra: över 200
   - Dåligt: under 120
   - Mellan: annars

3. Räntekänslighet (%)
   - Bra: under 5
   - Dåligt: över 10
   - Mellan: annars
   - MÅSTE anges med en decimal (t.ex. 4.5 %)

4. Energikostnad per kvadratmeter
   - Bra: under 200
   - Dåligt: över 200
   - Mellan: annars (notera, exakt 200 kan vara mellan)

5. Årsavgift / kvm upplåten bostadsrätt
   - Bra: under 800
   - Dåligt: över 1000
   - Mellan: annars

Svara ENDAST med giltig JSON utan markdown-formatering. Inga backticks.
Alla siffror MÅSTE formateras med svenskt talformat: mellanslag som tusentalsavskiljare och kommatecken som decimalavskiljare (t.ex. 12 500 kr, 4,5 %).
Leta reda på de faktiska årtalen (t.ex. "2023", "2022", "2021") och ange dem i "years"-arrayen med det senaste året först.
Dessutom, identifiera och ange bostadsrättsföreningens (BRF) fullständiga namn i fältet "brfName".
Formatet måste vara exakt såhär:
{
  "brfName": "Brf Exempel",
  "years": ["2023", "2022", "2021"],
  "metrics": {
    "skuldsattning": { 
      "2023": { "value": "7 500 kr", "status": "bra" },
      "2022": { "value": "8 200 kr", "status": "mellan" },
      "2021": { "value": "-", "status": "saknas" }
    },
    "sparande": { 
      "2023": { "value": "150 kr", "status": "mellan" },
      "2022": { "value": "110 kr", "status": "daligt" },
      "2021": { "value": "130 kr", "status": "mellan" }
    },
    "rantekanslighet": { 
      "2023": { "value": "4,5 %", "status": "bra" },
      "2022": { "value": "5,2 %", "status": "mellan" },
      "2021": { "value": "4,8 %", "status": "bra" }
    },
    "energikostnad": { 
      "2023": { "value": "250 kr", "status": "daligt" },
      "2022": { "value": "210 kr", "status": "daligt" },
      "2021": { "value": "190 kr", "status": "bra" }
    },
    "arsavgift": { 
      "2023": { "value": "900 kr", "status": "mellan" },
      "2022": { "value": "880 kr", "status": "mellan" },
      "2021": { "value": "850 kr", "status": "mellan" }
    }
  }
}
Använd enbart statusvärdena: "bra", "mellan", "daligt", "saknas". Om ett nyckeltal inte hittas för ett specifikt år, MÅSTE du sätta value till "-" och status till "saknas".`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: "application/pdf",
                                    data: base64Data
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        response_mime_type: "application/json"
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || "Ett fel uppstod vid analysen.");
            }

            const data = await response.json();
            const jsonText = data.candidates[0].content.parts[0].text;
            const resultObj = JSON.parse(jsonText);
            setScanResult(resultObj);

            if (item && (item.booliId || item.url)) {
                localStorage.setItem(`pdf_scan_${item.booliId || item.url}`, JSON.stringify(resultObj));
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

            {localStorage.getItem('webauthn_credential_id') && (
                <div style={{ padding: '8px', marginBottom: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                    <strong>Din Face ID-kod (kopiera till AI:n):</strong><br/>
                    {localStorage.getItem('webauthn_credential_id')}
                </div>
            )}

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
                    {isBiometricsSupported && (
                        <button 
                            onClick={handleBiometricLogin}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                padding: '8px 16px', 
                                borderRadius: '8px', 
                                border: '1px solid var(--border-color)', 
                                background: 'transparent', 
                                color: 'var(--text-primary)', 
                                fontWeight: 500, 
                                cursor: 'pointer',
                                marginTop: '4px'
                            }}
                        >
                            <FingerprintRounded fontSize="small" /> Använd Face ID / Touch ID
                        </button>
                    )}
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
