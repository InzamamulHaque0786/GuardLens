import React, { useState, useEffect, useRef } from 'react';
import { 
  LuShieldAlert, LuPhoneCall, LuX, LuMapPin, LuLock 
} from 'react-icons/lu';
import API from "../../api/API";

export default function SOSPanel() {
  // States: 'idle' | 'countdown' | 'active'
  const [status, setStatus] = useState('idle');
  const [countdown, setCountdown] = useState(3);
  
  const [sosId, setSosId] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // References for timers and GPS tracking
  const countdownRef = useRef(null);
  const watchIdRef = useRef(null);

  // --- 1. The Trigger Sequence ---
  const handleInitiateSOS = () => {
    setStatus('countdown');
    setCountdown(3);
    
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          fireSOSApi(); // 0 reached, fire the API!
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const abortCountdown = () => {
    clearInterval(countdownRef.current);
    setStatus('idle');
  };

  // --- 2. Firing the API & Starting Live Tracking ---
  const fireSOSApi = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setStatus('idle');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const payload = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        const response = await API.post('/sos/trigger', payload);
        
        if (response.data.success) {
          setSosId(response.data.data.sosId);
          setStatus('active');
          startLiveTracking(response.data.data.sosId);
        }
      } catch (err) {
        console.error("Failed to trigger SOS:", err);
        alert("CRITICAL ERROR: Failed to reach emergency servers.");
        setStatus('idle');
      }
    }, (err) => {
      alert("Please enable location permissions to use SOS.");
      setStatus('idle');
    });
  };

  // --- 3. Live GPS Tracking (watchPosition) ---
  const startLiveTracking = (activeSosId) => {
    // watchPosition fires automatically every time the GPS detects movement
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          await API.put('/sos/location', {
            sosId: activeSosId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          console.log("Live location ping sent.");
        } catch (error) {
          console.error("Failed to update live location.");
        }
      },
      (error) => console.error("GPS Tracking Error:", error),
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  // --- 4. Secure Cancellation ---
  const handleCancelSOS = async (e) => {
    e.preventDefault();
    if (pinInput.length !== 4) {
      setError("PIN must be 4 digits.");
      return;
    }

    setIsCancelling(true);
    setError('');

    try {
      const response = await API.post('/sos/cancel', { sosId, pin: pinInput });
      
      if (response.data.success) {
        // Stop tracking the user
        if (watchIdRef.current) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
        
        // Reset the UI
        setStatus('idle');
        setSosId(null);
        setPinInput('');
        alert("SOS Alert successfully cancelled.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel SOS. Incorrect PIN?");
    } finally {
      setIsCancelling(false);
    }
  };

  // Cleanup timers if the component unmounts unexpectedly
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // ================= RENDER =================

  // STATE A: The Lockdown / Active Screen
  if (status === 'active') {
    return (
      <div className="fixed inset-0 z-[9999] bg-red-600 flex flex-col items-center justify-center p-6 text-white animate-pulse-fast">
        <LuShieldAlert size={80} className="mb-4 animate-bounce" />
        <h1 className="text-4xl font-integral font-bold text-center mb-2">SOS ACTIVE</h1>
        <p className="text-center font-bold text-red-200 mb-8 max-w-sm">
          Your live location is currently being tracked and your emergency contacts have been notified.
        </p>
        
        <div className="bg-red-700/50 p-6 rounded-3xl w-full max-w-sm border border-red-500 backdrop-blur-sm">
          <p className="text-center text-sm font-bold mb-4 flex items-center justify-center gap-2">
            <LuLock /> Enter PIN to Cancel
          </p>
          
          <form onSubmit={handleCancelSOS} className="flex flex-col gap-4">
            <input 
              type="password" 
              maxLength="4"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/, ''))}
              placeholder="••••"
              className="w-full text-center text-3xl tracking-[1em] py-4 rounded-xl text-black outline-none focus:ring-4 focus:ring-red-300"
              required
            />
            {error && <p className="text-red-200 text-sm text-center font-bold">{error}</p>}
            
            <button 
              type="submit" 
              disabled={isCancelling || pinInput.length !== 4}
              className="w-full py-4 bg-white text-red-600 font-bold rounded-xl text-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {isCancelling ? "Verifying..." : "DISABLE SOS"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // STATE B: The Normal Screen (Idle or Countdown)
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-3xl border border-gray-200 shadow-sm">
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-integral text-red-600 flex items-center justify-center gap-2">
          <LuPhoneCall size={28} /> Emergency SOS
        </h2>
        <p className="text-gray-500 font-medium mt-2 max-w-xs">
          Instantly alert your trusted contacts and transmit your live location.
        </p>
      </div>

      <div className="relative">
        {/* The Massive Button */}
        <button 
          onClick={status === 'idle' ? handleInitiateSOS : abortCountdown}
          className={`relative z-10 w-48 h-48 rounded-full flex flex-col items-center justify-center text-white font-bold transition-all duration-300 shadow-2xl ${
            status === 'idle' 
              ? 'bg-red-600 hover:bg-red-700 hover:scale-105 shadow-red-500/50' 
              : 'bg-gray-900 hover:bg-black scale-95 shadow-gray-900/50'
          }`}
        >
          {status === 'idle' ? (
            <>
              <LuShieldAlert size={48} className="mb-2" />
              <span className="text-2xl tracking-widest">SOS</span>
            </>
          ) : (
            <>
              <span className="text-5xl font-integral text-red-500 animate-ping absolute">{countdown}</span>
              <span className="text-5xl font-integral relative z-10">{countdown}</span>
              <span className="text-sm text-gray-400 mt-4 flex items-center gap-1"><LuX /> Tap to Cancel</span>
            </>
          )}
        </button>

        {/* Pulse effect behind the idle button */}
        {status === 'idle' && (
          <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-20 pointer-events-none"></div>
        )}
      </div>

      {status === 'idle' && (
        <p className="mt-8 text-sm text-gray-400 font-bold flex items-center gap-1">
          <LuMapPin size={16} /> Requires GPS Access
        </p>
      )}

    </div>
  );
}