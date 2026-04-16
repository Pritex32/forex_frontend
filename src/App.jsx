import { useState } from 'react';
import './App.css'; // We'll add the CSS

const API_BASE = 'https://forex-app-rc3d.onrender.com'; // Change to your backend URL

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

  // Loading states
  const [loadingData, setLoadingData] = useState(false);
  const [loadingTrain, setLoadingTrain] = useState(false);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [loadingIndicators, setLoadingIndicators] = useState(false);
  const [loadingAnomalies, setLoadingAnomalies] = useState(false);
  const [loadingPivots, setLoadingPivots] = useState(false);

  const fetchData = async () => {
    if (loadingData) return; // Prevent multiple clicks
    setLoadingData(true);
    setDataStatus('Fetching data... This may take several minutes.');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      const response = await fetch(`${API_BASE}/api/data/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instrument, granularity }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const result = await response.json();
      if (result.error) {
        setDataStatus(result.error);
      } else {
        setDataStatus(result.message);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setDataStatus('Request timed out. Data fetching may still be running on the server.');
      } else {
        setDataStatus(`Error fetching data: ${error.message}`);
      }
    } finally {
      setLoadingData(false);
    }
  };

  const trainModel = async () => {
    if (loadingTrain) return; // Prevent multiple clicks
    setLoadingTrain(true);
    setTrainStatus('Training model... This may take several minutes.');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout for training

      const response = await fetch(`${API_BASE}/api/models/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_type: modelType }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const result = await response.json();
      if (result.error) {
        setTrainStatus(result.error);
      } else {
        setTrainStatus(result.message);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setTrainStatus('Training timed out. Model training may still be running on the server.');
      } else {
        setTrainStatus(`Error training model: ${error.message}`);
      }
    } finally {
      setLoadingTrain(false);
    }
  };

  const predict = async () => {
    if (loadingPredict) return; // Prevent multiple clicks
    setLoadingPredict(true);
    setForecast({ loading: 'Generating predictions...' });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout

      const response = await fetch(`${API_BASE}/api/models/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_type: modelType, n_periods: parseInt(nPeriods) }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const predictions = await response.json();
      if (predictions.error) {
        setForecast({ error: predictions.error });
      } else {
        setForecast(predictions);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setForecast({ error: 'Prediction timed out. Please try again.' });
      } else {
        setForecast({ error: `Error predicting: ${error.message}` });
      }
    } finally {
      setLoadingPredict(false);
    }
  };

  const generateSignals = async () => {
    if (loadingSignals) return; // Prevent multiple clicks
    setLoadingSignals(true);
    setSignals({ loading: 'Generating trading signals...' });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout

      const response = await fetch(`${API_BASE}/api/signals/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_type: signalModel, risk_pct: parseFloat(riskPct), sl_pips: parseInt(slPips), tp_pips: parseInt(tpPips) }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const signalsData = await response.json();
      if (signalsData.error) {
        setSignals({ error: signalsData.error });
      } else {
        setSignals(signalsData);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setSignals({ error: 'Signal generation timed out. Please try again.' });
      } else {
        setSignals({ error: `Error generating signals: ${error.message}` });
      }
    } finally {
      setLoadingSignals(false);
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
    if (loadingIndicators) return; // Prevent multiple clicks
    setLoadingIndicators(true);
    setIndicators({ loading: 'Loading technical indicators...' });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${API_BASE}/api/indicators/values`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const ind = await response.json();
      if (ind.error) {
        setIndicators({ error: ind.error });
      } else {
        setIndicators(ind);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setIndicators({ error: 'Loading indicators timed out. Please try again.' });
      } else {
        setIndicators({ error: `Error loading indicators: ${error.message}` });
      }
    } finally {
      setLoadingIndicators(false);
    }
  };

  const detectAnomalies = async () => {
    if (loadingAnomalies) return; // Prevent multiple clicks
    setLoadingAnomalies(true);
    setAnomalies({ loading: 'Detecting anomalies...' });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout

      const response = await fetch(`${API_BASE}/api/indicators/anomaly/detection`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const result = await response.json();
      if (result.error) {
        setAnomalies({ error: result.error });
      } else {
        setAnomalies(result);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setAnomalies({ error: 'Anomaly detection timed out. Please try again.' });
      } else {
        setAnomalies({ error: `Error detecting anomalies: ${error.message}` });
      }
    } finally {
      setLoadingAnomalies(false);
    }
  };

  const loadPivots = async () => {
    if (loadingPivots) return; // Prevent multiple clicks
    setLoadingPivots(true);
    setPivots({ loading: 'Loading pivot points...' });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${API_BASE}/api/indicators/pivot/values`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const pivotsData = await response.json();
      if (pivotsData.error) {
        setPivots({ error: pivotsData.error });
      } else {
        setPivots(pivotsData);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setPivots({ error: 'Loading pivots timed out. Please try again.' });
      } else {
        setPivots({ error: `Error loading pivots: ${error.message}` });
      }
    } finally {
      setLoadingPivots(false);
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
        <button onClick={fetchData} disabled={loadingData}>
          {loadingData ? 'Fetching Data...' : 'Fetch Data'}
        </button>
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
        <button onClick={trainModel} disabled={loadingTrain}>
          {loadingTrain ? 'Training Model...' : 'Train Model'}
        </button>
        <div id="trainStatus">{trainStatus}</div>
      </div>

      <div className="section">
        <h2>Forecast</h2>
        <div className="form-group">
          <label htmlFor="nPeriods">Number of Days:</label>
          <input type="number" id="nPeriods" value={nPeriods} onChange={(e) => setNPeriods(e.target.value)} />
        </div>
        <button onClick={predict} disabled={loadingPredict}>
          {loadingPredict ? 'Predicting...' : 'Predict'}
        </button>
        <div id="forecastChart" className="chart">
          {forecast && forecast.loading ? (
            <div>{forecast.loading}</div>
          ) : forecast && forecast.error ? (
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
        <button onClick={generateSignals} disabled={loadingSignals}>
          {loadingSignals ? 'Generating Signals...' : 'Generate Signals'}
        </button>
        <div id="signals">
          {signals && signals.loading ? (
            <div>{signals.loading}</div>
          ) : signals && signals.error ? (
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
        <button onClick={executeTrade} disabled={!signals || signals.signal === 'Hold' || signals.loading} style={{ backgroundColor: '#28a745' }}>Execute Trade</button>
      </div>

      <div className="section">
        <h2>Technical Indicators</h2>
        <button onClick={loadIndicators} disabled={loadingIndicators}>
          {loadingIndicators ? 'Loading Indicators...' : 'Load Indicators'}
        </button>
        <div id="indicators">
          {indicators && indicators.loading ? (
            <div>{indicators.loading}</div>
          ) : indicators && indicators.error ? (
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
        <button onClick={detectAnomalies} disabled={loadingAnomalies}>
          {loadingAnomalies ? 'Detecting Anomalies...' : 'Detect Anomalies'}
        </button>
        <div id="anomalies">
          {anomalies && anomalies.loading ? (
            <div>{anomalies.loading}</div>
          ) : anomalies && anomalies.error ? (
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
        <button onClick={loadPivots} disabled={loadingPivots}>
          {loadingPivots ? 'Loading Pivots...' : 'Load Pivots'}
        </button>
        <div id="pivots">
          {pivots && pivots.loading ? (
            <div>{pivots.loading}</div>
          ) : pivots && pivots.error ? (
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
