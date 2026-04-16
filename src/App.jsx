import React, { useState } from 'react';
import './App.css'; // We'll add the CSS

const API_BASE = 'https://forex-app-rc3d.onrender.com'; // Local backend URL

function App() {
  const [instrument, setInstrument] = useState('GBP_USD');
  const [granularity, setGranularity] = useState('D');
  const [dataStatus, setDataStatus] = useState('');
  const [modelType, setModelType] = useState('xgboost');
  const [trainStatus, setTrainStatus] = useState('');
  const [nPeriods, setNPeriods] = useState(5);
  const [forecast, setForecast] = useState(null);
  const [signalModel, setSignalModel] = useState('xgboost');
  const [riskPct, setRiskPct] = useState(1.0);
  const [slPips, setSlPips] = useState(30);
  const [tpPips, setTpPips] = useState(90);
  const [signals, setSignals] = useState(null);
  const [indicators, setIndicators] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [pivots, setPivots] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/data/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instrument, granularity })
      });
      const result = await response.json();
      if (result.error) {
        setDataStatus(result.error);
      } else {
        setDataStatus(result.message);
      }
    } catch (error) {
      setDataStatus(`Error fetching data: ${error.message}`);
    }
  };

  const trainModel = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/models/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_type: modelType })
      });
      const result = await response.json();
      if (result.error) {
        setTrainStatus(result.error);
      } else {
        setTrainStatus(result.message);
      }
    } catch (error) {
      setTrainStatus(`Error training model: ${error.message}`);
    }
  };

  const predict = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/models/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_type: modelType, n_periods: parseInt(nPeriods) })
      });
      const predictions = await response.json();
      if (predictions.error) {
        setForecast({ error: predictions.error });
      } else {
        setForecast(predictions);
      }
    } catch (error) {
      setForecast({ error: `Error predicting: ${error.message}` });
    }
  };

  const generateSignals = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/signals/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_type: signalModel, risk_pct: parseFloat(riskPct), sl_pips: parseInt(slPips), tp_pips: parseInt(tpPips) })
      });
      const signalsData = await response.json();
      if (signalsData.error) {
        setSignals({ error: signalsData.error });
      } else {
        setSignals(signalsData);
      }
    } catch (error) {
      setSignals({ error: `Error generating signals: ${error.message}` });
    }
  };

  const executeTrade = async () => {
    if (!signals || signals.signal === 'Hold') {
      alert('No trade signal');
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/trading/place_order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signal: signals.signal,
          current_price: signals.current_price,
          risk_pct: signals.risk_pct,
          sl_pips: signals.sl_pips,
          tp_pips: signals.tp_pips
        })
      });
      const result = await response.json();
      if (result.error) {
        alert(result.error);
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert(`Error executing trade: ${error.message}`);
    }
  };

  const loadIndicators = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/indicators/values`);
      const ind = await response.json();
      if (ind.error) {
        setIndicators({ error: ind.error });
      } else {
        setIndicators(ind);
      }
    } catch (error) {
      setIndicators({ error: `Error loading indicators: ${error.message}` });
    }
  };

  const detectAnomalies = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/indicators/anomaly/detection`);
      const result = await response.json();
      if (result.error) {
        setAnomalies({ error: result.error });
      } else {
        setAnomalies(result);
      }
    } catch (error) {
      setAnomalies({ error: `Error detecting anomalies: ${error.message}` });
    }
  };

  const loadPivots = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/indicators/pivot/values`);
      const pivotsData = await response.json();
      if (pivotsData.error) {
        setPivots({ error: pivotsData.error });
      } else {
        setPivots(pivotsData);
      }
    } catch (error) {
      setPivots({ error: `Error loading pivots: ${error.message}` });
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Forex Entry/Exit Prediction (XGBoost Multiclass + S/R Zones)</h1>
        <p><strong>Disclaimer: Not a financial advice</strong></p>
      </div>

      <div className="section">
        <h2>Data Fetching</h2>
        <div className="form-group">
          <label htmlFor="instrument">Forex Pair:</label>
          <input type="text" id="instrument" value={instrument} onChange={(e) => setInstrument(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="granularity">Granularity:</label>
          <select id="granularity" value={granularity} onChange={(e) => setGranularity(e.target.value)}>
            <option value="D">Daily</option>
            <option value="H1">1 Hour</option>
            <option value="H4">4 Hours</option>
            <option value="M30">30 Minutes</option>
            <option value="M15">15 Minutes</option>
            <option value="M5">5 Minutes</option>
            <option value="M1">1 Minute</option>
          </select>
        </div>
        <button onClick={fetchData}>Fetch Data</button>
        <div id="dataStatus">{dataStatus}</div>
      </div>

      <div className="section">
        <h2>Model Training</h2>
        <div className="form-group">
          <label htmlFor="modelType">Model Type:</label>
          <select id="modelType" value={modelType} onChange={(e) => setModelType(e.target.value)}>
            <option value="lstm">LSTM</option>
            <option value="cnn_lstm">CNN-LSTM</option>
            <option value="xgboost">XGBoost</option>
          </select>
        </div>
        <button onClick={trainModel}>Train Model</button>
        <div id="trainStatus">{trainStatus}</div>
      </div>

      <div className="section">
        <h2>Forecast</h2>
        <div className="form-group">
          <label htmlFor="nPeriods">Number of Days:</label>
          <input type="number" id="nPeriods" value={nPeriods} onChange={(e) => setNPeriods(e.target.value)} />
        </div>
        <button onClick={predict}>Predict</button>
        <div id="forecastChart" className="chart">
          {forecast && forecast.error ? (
            <div>{forecast.error}</div>
          ) : forecast && forecast.signal ? (
            <div className={`signal ${forecast.signal.toLowerCase()}`}>Predicted Signal: {forecast.signal}</div>
          ) : (
            <div>Forecast chart would go here</div>
          )}
        </div>
      </div>

      <div className="section">
        <h2>Signals</h2>
        <div className="form-group">
          <label htmlFor="signalModel">Model for Signals:</label>
          <select id="signalModel" value={signalModel} onChange={(e) => setSignalModel(e.target.value)}>
            <option value="lstm">LSTM</option>
            <option value="cnn_lstm">CNN-LSTM</option>
            <option value="xgboost">XGBoost</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="riskPct">Risk %:</label>
          <input type="number" id="riskPct" value={riskPct} step="0.1" onChange={(e) => setRiskPct(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="slPips">Stop Loss Pips:</label>
          <input type="number" id="slPips" value={slPips} onChange={(e) => setSlPips(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="tpPips">Take Profit Pips:</label>
          <input type="number" id="tpPips" value={tpPips} onChange={(e) => setTpPips(e.target.value)} />
        </div>
        <button onClick={generateSignals}>Generate Signals</button>
        <div id="signals">
          {signals && signals.error ? (
            <div>{signals.error}</div>
          ) : signals ? (
            <>
              <div className="metric">Current Price: {signals.current_price.toFixed(4)}</div>
              <div className="metric">Predicted Price: {signals.predicted_price.toFixed(4)}</div>
              <div className={`signal ${signals.signal.toLowerCase()}`}>Signal: {signals.signal}</div>
              <div className={`signal ${signals.atr_signal.toLowerCase()}`}>ATR Signal: {signals.atr_signal}</div>
              <div className={`signal ${signals.pivot_signal.toLowerCase()}`}>Pivot Signal: {signals.pivot_signal}</div>
              <div className={`signal ${signals.smart_money_signal.replace(' ', '').toLowerCase()}`}>Smart Money Signal: {signals.smart_money_signal}</div>
            </>
          ) : null}
        </div>
        <button onClick={executeTrade} style={{ backgroundColor: '#28a745' }}>Execute Trade</button>
      </div>

      <div className="section">
        <h2>Technical Indicators</h2>
        <button onClick={loadIndicators}>Load Indicators</button>
        <div id="indicators">
          {indicators && indicators.error ? (
            <div>{indicators.error}</div>
          ) : indicators ? (
            <>
              <div className="metric">RSI: {indicators.rsi}</div>
              <div className="metric">MACD: {indicators.macd}</div>
              <div className="metric">MACD Signal: {indicators.macd_signal}</div>
              <div className="metric">ATR: {indicators.atr}</div>
            </>
          ) : null}
        </div>
        <div id="rsiChart" className="chart">RSI Chart</div>
        <div id="macdChart" className="chart">MACD Chart</div>
        <div id="atrChart" className="chart">ATR Chart</div>
      </div>

      <div className="section">
        <h2>Charts</h2>
        <button>Load 1-Hour Chart</button>
        <div id="chart1H" className="chart">1H Chart</div>
      </div>

      <div className="section">
        <h2>Anomaly Detection</h2>
        <button onClick={detectAnomalies}>Detect Anomalies</button>
        <div id="anomalies">
          {anomalies && anomalies.error ? (
            <div>{anomalies.error}</div>
          ) : anomalies ? (
            <>
              <div className="metric">Anomalies Detected: {anomalies.anomalies.length}</div>
              <div className="metric">Clusters: {Math.max(...anomalies.clusters) + 1}</div>
            </>
          ) : null}
        </div>
      </div>

      <div className="section">
        <h2>Pivot Points</h2>
        <button onClick={loadPivots}>Load Pivots</button>
        <div id="pivots">
          {pivots && pivots.error ? (
            <div>{pivots.error}</div>
          ) : pivots ? (
            <>
              <div className="metric">Pivot: {pivots.pivot.toFixed(4)}</div>
              <div className="metric">R1: {pivots.r1.toFixed(4)}</div>
              <div className="metric">R2: {pivots.r2.toFixed(4)}</div>
              <div className="metric">S1: {pivots.s1.toFixed(4)}</div>
              <div className="metric">S2: {pivots.s2.toFixed(4)}</div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default App;
