let accessToken = null;
let deviceId = null;
const bells = new Audio("/Users/abiodunsalavu/Desktop/pomodoro timer/bell.mp3");
const startBtn = document.querySelector(".btn-start");
const session = document.querySelector(".minutes");
let myInterval;
let state = true;

// Disable start button initially until Spotify player is ready
const startSessionBtn = document.getElementById('start-session');
if (startSessionBtn) startSessionBtn.disabled = true;

function appTimer() {
  const sessionAmount = Number.parseInt(session.textContent);

  if (state) {
    state = false;
    totalSeconds = sessionAmount * 60;
    myInterval = setInterval(updateSeconds, 1000);
  } else {
    alert('Session has already started.');
  }
}

const updateSeconds = () => {
  const minuteDiv = document.querySelector('.minutes');
  const secondDiv = document.querySelector('.seconds');

  totalSeconds--;

  let minutesLeft = Math.floor(totalSeconds / 60);
  let secondsLeft = totalSeconds % 60;

  secondDiv.textContent = secondsLeft < 10 ? '0' + secondsLeft : secondsLeft;
  minuteDiv.textContent = `${minutesLeft}`;

  if (minutesLeft === 0 && secondsLeft === 0) {
    bells.play();
    clearInterval(myInterval);
    stopSpotifyPlayback();
  }
};

document.getElementById('start-session').addEventListener('click', async () => {
  const linkInput = document.getElementById('spotify-link').value.trim();
  const uri = extractSpotifyUri(linkInput);

  if (!uri) {
    alert("Please enter a valid Spotify track or playlist link.");
    return;
  }

  // No need to check deviceId here since button is disabled until ready

  await startSpotifyPlayback(uri);
  appTimer();
});

function extractSpotifyUri(link) {
  if (!link.startsWith("https://open.spotify.com/")) return null;
  try {
    const parts = new URL(link).pathname.split('/');
    if (parts.length >= 3) {
      return `spotify:${parts[1]}:${parts[2]}`; // e.g., spotify:track:xyz or spotify:playlist:abc
    }
  } catch {
    return null;
  }
  return null;
}

async function stopSpotifyPlayback() {
  if (!accessToken) return;
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/pause', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + accessToken
      }
    });
    if (!response.ok) {
      console.error('Error pausing playback:', await response.json());
    } else {
      console.log('Spotify playback paused');
    }
  } catch (err) {
    console.error('Error pausing Spotify playback:', err);
  }
}

async function startSpotifyPlayback(uri) {
  if (!accessToken || !deviceId) {
    console.error("Missing accessToken or deviceId");
    return;
  }

  try {
    const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify({ uris: [uri] }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + accessToken
      }
    });
    if (!response.ok) {
      console.error('Spotify playback error:', await response.json());
    } else {
      console.log('Spotify playback started!');
    }
  } catch (err) {
    console.error('Error starting playback:', err);
  }
}

const script = document.createElement('script');
script.src = "https://sdk.scdn.co/spotify-player.js";
document.body.appendChild(script);

window.onSpotifyWebPlaybackSDKReady = () => {
  const player = new Spotify.Player({
    name: 'Pomodoro Web Player',
    getOAuthToken: cb => { cb(accessToken); },
    volume: 0.5
  });

  player.addListener('ready', ({ device_id }) => {
    console.log('Ready with Device ID', device_id);
    deviceId = device_id;

    // Enable the start button once player is ready
    if (startSessionBtn) startSessionBtn.disabled = false;
  });

  player.addListener('not_ready', ({ device_id }) => {
    console.log('Device ID has gone offline', device_id);

    // Disable the start button if player goes offline
    if (startSessionBtn) startSessionBtn.disabled = true;
  });

  player.connect();
};

// Retrieve access token from URL hash if available
if (window.location.hash) {
  const hash = window.location.hash.substring(1).split("&").reduce((acc, item) => {
    const parts = item.split("=");
    acc[parts[0]] = parts[1];
    return acc;
  }, {});
  accessToken = hash.access_token;
  window.history.replaceState({}, document.title, window.location.pathname);
  console.log("Access token retrieved:", accessToken ? "Yes" : "No");
}