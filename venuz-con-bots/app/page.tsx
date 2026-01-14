'use client';

import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [diagnostico, setDiagnostico] = useState<any>(null);

  useEffect(() => {
    // EXPONER CONFIG EN CONSOLA DEL NAVEGADOR
    const config = {
      // @ts-ignore
      url: (supabase as any).supabaseUrl || 'unknown',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };

    console.log('🔍 SUPABASE CONFIG EN PRODUCCIÓN:', config);

    // Test de conexión básico
    supabase
      .from('content')
      .select('id, title, category, active')
      .limit(5)
      .then(({ data, error }) => {
        const resultado = {
          success: !error,
          count: data?.length || 0,
          error: error?.message || null,
          sample: data?.[0] || null,
          config
        };

        console.log('🧪 TEST QUERY RESULT:', resultado);
        setDiagnostico(resultado);
      });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#111', color: '#0f0', minHeight: '100vh', wordBreak: 'break-word' }}>
      <h1>🔬 DIAGNÓSTICO VENUZ - FASE 1</h1>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(diagnostico, null, 2)}</pre>
      <div style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '20px' }}>
        <p>Instrucciones Vercel (IMPORTANTE):</p>
        <p>1. Ve a Vercel -> Settings -> General -> <strong>Clear Build Cache</strong></p>
        <p>2. Haz <strong>Redeploy</strong> manualmente.</p>
        <hr style={{ borderColor: '#333', margin: '10px 0' }} />
        <p>Lectura de Resultados:</p>
        <p>A. ¿URL = jbrmziwo...? (Si es rumilv... -> Cache no se limpió)</p>
        <p>B. Success=true y Count=0? -> Problema RLS</p>
        <p>C. Error explícito? -> Reportar a soporte</p>
      </div>
    </div>
  );
}
