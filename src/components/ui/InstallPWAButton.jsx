import React, { useState, useEffect } from 'react';
import { isAppInstalled, isIOS, subscribeToInstallPrompt, triggerInstallPrompt } from '../../utils/pwa';

/**
 * InstallPWAButton Component
 * 
 * Scalability Design:
 * - Adapts dynamically to Chrome, Android, Safari, and iOS.
 * - Uses display-mode standalone and navigator.standalone check.
 * - Shows clear manual instructions for iOS Safari.
 * - Offers a one-click install button for Chrome/Android.
 */
function InstallPWAButton() {
  const [installed, setInstalled] = useState(isAppInstalled());
  const [promptEvent, setPromptEvent] = useState(null);
  const [iosDevice, setIosDevice] = useState(isIOS());

  useEffect(() => {
    // Check installation status periodically or on focus
    const checkStatus = () => {
      setInstalled(isAppInstalled());
    };

    window.addEventListener('focus', checkStatus);
    
    // Subscribe to the beforeinstallprompt event
    const unsubscribe = subscribeToInstallPrompt((event) => {
      setPromptEvent(event);
      // Re-verify installation status in case event changed it
      setInstalled(isAppInstalled());
    });

    return () => {
      window.removeEventListener('focus', checkStatus);
      unsubscribe();
    };
  }, []);

  const handleInstallClick = async () => {
    if (!promptEvent) return;
    const installedSuccess = await triggerInstallPrompt();
    if (installedSuccess) {
      setInstalled(true);
    }
  };

  // 1. Installed State
  if (installed) {
    return (
      <div className="flex flex-col items-center justify-center py-4 text-center">
        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-3 border border-emerald-100 animate-bounce">
          ✓
        </div>
        <h4 className="font-extrabold text-sm text-emerald-800">Aplicación instalada</h4>
        <p className="text-xs text-emerald-600/80 mt-1 max-w-[220px]">
          Estás disfrutando de la versión móvil autónoma y optimizada.
        </p>
      </div>
    );
  }

  // 2. iOS Safari Instructions State
  if (iosDevice) {
    return (
      <div className="space-y-4 py-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
          <h4 className="font-bold text-sm text-slate-800">Instrucciones para Safari iOS</h4>
        </div>
        <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs text-slate-600 space-y-2">
          <p className="font-medium">Para instalar en tu iPhone/iPad:</p>
          <ol className="list-decimal list-inside space-y-1.5 font-normal">
            <li>
              Presiona el botón de <strong className="text-brand-blue">Compartir</strong> 
              <span className="mx-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-sm">⎋</span> 
              en Safari (en la barra inferior).
            </li>
            <li>
              Desplázate hacia abajo y selecciona <strong className="text-slate-800">"Agregar a pantalla de inicio"</strong>.
            </li>
            <li>
              Presiona <strong className="text-brand-blue">"Agregar"</strong> en la esquina superior derecha.
            </li>
          </ol>
        </div>
      </div>
    );
  }

  // 3. Android / Chrome Installable State
  if (promptEvent) {
    return (
      <div className="space-y-4 py-2 text-center sm:text-left">
        <div>
          <span className="bg-sky-50 text-sky-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            Disponible para instalación
          </span>
          <p className="text-xs text-slate-500 mt-2">
            Instala la aplicación en tu celular o computadora para acceder más rápido y sin conexión.
          </p>
        </div>
        <button
          onClick={handleInstallClick}
          className="w-full py-2.5 px-4 bg-brand-blue hover:bg-brand-blue/90 active:scale-[0.98] text-brand-white text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 border border-brand-blue-dark/10"
        >
          📲 Instalar Aplicación
        </button>
      </div>
    );
  }

  // 4. Default / Standalone not supported or prompt not fired yet
  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 bg-slate-400 rounded-full"></span>
        <h4 className="font-bold text-sm text-slate-700">Disponible para instalación</h4>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">
        Abre esta página en Chrome, Edge o tu navegador móvil preferido para poder instalar la aplicación de forma rápida.
      </p>
      <div className="text-[10px] text-slate-400 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
        Tip: Si usas Chrome/Edge en PC, busca el ícono de instalación en la barra de direcciones.
      </div>
    </div>
  );
}

export default InstallPWAButton;
