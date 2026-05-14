import React, { useEffect, useRef, useState } from 'react';
import WidgetCard from './WidgetCard';

export default function DesmosWidget({ expression, label = "Graph", onDismiss }) {
  const containerRef = useRef(null);
  const calculatorRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!window.Desmos && !document.getElementById('desmos-script')) {
      const script = document.createElement('script');
      script.id = 'desmos-script';
      script.src = 'https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6';
      script.onload = () => setLoaded(true);
      document.body.appendChild(script);
    } else if (window.Desmos) {
      setLoaded(true);
    }

    const checkInterval = setInterval(() => {
      if (window.Desmos) {
        setLoaded(true);
        clearInterval(checkInterval);
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, []);

  useEffect(() => {
    if (!loaded || !containerRef.current) return;

    if (!calculatorRef.current) {
      calculatorRef.current = window.Desmos.GraphingCalculator(containerRef.current, {
        expressions: false,
        settingsMenu: false,
        zoomButtons: true,
        lockViewport: false,
      });
    }

    const cleanExpr = expression.replace(/^(plot|graph|desmos|zeichne|trace|graficar|график|построй график)\s*/i, '');
    calculatorRef.current.setExpression({ id: 'graph1', latex: cleanExpr });
    
    return () => {
      if (calculatorRef.current) {
        calculatorRef.current.destroy();
        calculatorRef.current = null;
      }
    };
  }, [loaded, expression]);

  return (
    <WidgetCard label={label} onDismiss={onDismiss}>
      <div className="desmos-widget">
        <div className="desmos-expression">
          <code>{expression}</code>
        </div>
        <div ref={containerRef} className="desmos-container">
          {!loaded && (
            <div className="wc-loading">
              <div className="wc-loading-bar" />
              <div className="wc-loading-bar wc-loading-bar-short" />
            </div>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}
