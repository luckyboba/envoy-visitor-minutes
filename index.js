const express = require('express');
const { envoyMiddleware, errorMiddleware } = require('@envoy/envoy-integrations-sdk');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use the Envoy middleware
app.use(envoyMiddleware());

// Basic health check route
app.get('/', (req, res) => {
  res.send('Visitor Minute Tracker is running');
});

// Minute validation endpoint
app.post('/minute-validation', (req, res) => {
  console.log('Received validation request:', req.body);
  
  // Get maxDuration from any possible location in the request
  const maxDurationRaw = req.body.maxDuration || req.body.MAX_DURATION || '';
  
  // Try to convert to a valid number
  let duration;
  
  // Handle empty input
  if (maxDurationRaw === '' || maxDurationRaw === null || maxDurationRaw === undefined) {
    // If empty, use a default value
    duration = 60; // Default to 60 minutes
    console.log('Empty input received, using default value:', duration);
  } else {
    // Parse the input
    duration = parseInt(maxDurationRaw, 10);
    
    // Check invalid number
    if (isNaN(duration)) {
      console.log('Invalid number format received:', maxDurationRaw);
      return res.status(400).send({
        error: 'Max duration must be a number between 0 and 180 minutes'
      });
    }
    
    
    if (duration < 0 || duration > 180) {
      console.log('Out of range value received:', duration);
      return res.status(400).send({
        error: 'Max duration must be a number between 0 and 180 minutes'
      });
    }
  }
  
  console.log('Validation successful:', { duration });
  res.send({ maxDuration: duration });
});

// No action needed for visitor sign-in
app.post('/visitor-sign-in', async (req, res) => {
  // We don't need to do anything on sign-in
  res.send({ message: 'Visitor signed in' });
});

// Check duration on visitor sign-out
app.post('/visitor-sign-out', async (req, res) => {
  try {
    const envoy = req.envoy;
    
    if (!envoy) {
      console.error('Envoy object not found');
      return res.status(500).send({ error: 'Envoy object not found' });
    }
    
    const job = envoy.job;
    const visitor = envoy.payload;
    const maxDuration = parseInt(envoy.meta.config.MAX_DURATION || '60', 10);
    
    if (!visitor) {
      console.error('Visitor information missing');
      return res.status(400).send({ error: 'Visitor information missing' });
    }
    
    // Calculate stay duration
    const signInTime = new Date(visitor.attributes['signed-in-at']);
    const signOutTime = new Date();
    const durationInMs = signOutTime - signInTime;
    const durationInMinutes = Math.floor(durationInMs / (1000 * 60));
    
    // Check if overstayed
    const visitorName = visitor.attributes['full-name'] || 'Visitor';
    let message;
    
    if (durationInMinutes > maxDuration) {
      message = `${visitorName} overstayed by ${durationInMinutes - maxDuration} minutes. (Stay: ${durationInMinutes} min, Max: ${maxDuration} min)`;
    } else {
      message = `${visitorName} stayed for ${durationInMinutes} minutes, within the allowed ${maxDuration} minutes.`;
    }
    
    // Attach message
    await job.attach({ label: 'Duration Check', value: message });
    
    res.send({ durationInMinutes, maxDuration, message });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ error: 'Error processing sign-out' });
  }
});

// Error middleware
app.use(errorMiddleware());

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});