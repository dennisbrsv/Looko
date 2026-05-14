import React from 'react';
import { Equal } from 'lucide-react';
import WidgetCard from './WidgetCard';

export default function CalculatorWidget({ expression, result, label = "Calculator", onDismiss }) {
  return (
    <WidgetCard label={label} onDismiss={onDismiss}>
      <div className="calc-widget">
        <div className="calc-expression">
          <code>{expression}</code>
        </div>
        <div className="calc-divider">
          <Equal size={14} />
        </div>
        <div className="calc-result">{result}</div>
      </div>
    </WidgetCard>
  );
}
