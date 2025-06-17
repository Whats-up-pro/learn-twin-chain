import React, { useEffect, useState } from 'react';
import { Card, Grid, Typography, Box } from '@mui/material';
import TwinStateViewer from './TwinStateViewer.tsx';
import TwinMetrics from './TwinMetrics';
import TwinControls from './TwinControls.tsx';
import LoadingSpinner from '../common/LoadingSpinner';
import { DigitalTwin } from '../../types';

interface TwinMetrics {
  sync_count: number;
  error_count: number;
  retry_count: number;
  total_sync_time: number;
  last_sync: string | null;
}

interface DigitalTwinDashboardProps {
  twinId: string;
}

const DigitalTwinDashboard: React.FC<DigitalTwinDashboardProps> = ({ twinId }) => {
  const [twinState, setTwinState] = useState<DigitalTwin | null>(null);
  const [metrics, setMetrics] = useState<TwinMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const websocket = new WebSocket(`ws://localhost:8765/${twinId}`);
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
      setIsLoading(false);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'sync_complete') {
        // Update metrics
        setMetrics(data.metrics);
        // Request new state
        fetchTwinState();
      } else if (data.type === 'sync_error') {
        console.error('Sync error:', data.error);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(websocket);

    // Fetch initial state
    fetchTwinState();
    fetchMetrics();

    return () => {
      websocket.close();
    };
  }, [twinId]);

  const fetchTwinState = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/twins/${twinId}/state`);
      const data = await response.json();
      setTwinState(data);
    } catch (error) {
      console.error('Error fetching twin state:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/twins/${twinId}/metrics`);
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const handleSyncRequest = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: 'sync_request' }));
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Digital Twin Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* State Viewer */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            {twinState && <TwinStateViewer twin={twinState} />}
          </Card>
        </Grid>

        {/* Metrics */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            {metrics && <TwinMetrics metrics={metrics} />}
          </Card>
        </Grid>

        {/* Controls */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <TwinControls 
              onSyncRequest={handleSyncRequest}
              twinId={twinId}
            />
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DigitalTwinDashboard; 