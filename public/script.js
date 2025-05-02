const socket = io();
let localStream, peerConnection;
let remoteId = null;

const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const callInput = document.getElementById('callTo');
const callBtn = document.getElementById('callBtn');
const endBtn = document.getElementById('endBtn');
const myIdDisplay = document.getElementById('myId');

socket.on('connect', () => {
  myIdDisplay.textContent = socket.id;
});

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;
  })
  .catch(err => console.error('Failed to get media:', err));

callBtn.onclick = async () => {
  remoteId = callInput.value.trim();
  if (!remoteId) return alert('Enter remote user ID');

  peerConnection = createPeerConnection();
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('call-user', { to: remoteId, offer });
};

endBtn.onclick = () => {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
    remoteVideo.srcObject = null;
  }
};

socket.on('incoming-call', async ({ from, offer }) => {
  remoteId = from;
  peerConnection = createPeerConnection();
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit('answer-call', { to: from, answer });
});

socket.on('call-answered', async ({ answer }) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('ice-candidate', ({ candidate }) => {
  if (candidate && peerConnection) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
});

function createPeerConnection() {
  const pc = new RTCPeerConnection(config);

  pc.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('ice-candidate', { to: remoteId, candidate: event.candidate });
    }
  };

  pc.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
      pc.close();
      remoteVideo.srcObject = null;
    }
  };

  return pc;
}
