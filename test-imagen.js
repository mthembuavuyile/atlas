const apiKey = process.env.GEMINI_API_KEY || 'YOUR_API_KEY';

async function generateImage() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages?key=${apiKey}`;
  
  const payload = {
    instances: [
      { prompt: "Generate a basic image of a friendly robot" }
    ],
    parameters: {
      sampleCount: 1
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", text);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

generateImage();
