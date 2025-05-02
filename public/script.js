const socket = io();

const user1Btn = document.getElementById('user1Btn');
const user2Btn = document.getElementById('user2Btn');
const localVideo = document.getElementById('local');
const remoteVideo = document.getElementById('remote');

let localStream;
let peerConnection;
const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// Get media
async function startMedia() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;
}

async function createPeerConnection(isCaller) {
  peerConnection = new RTCPeerConnection(config);

  peerConnection.onicecandidate = ({ candidate }) => {
    if (candidate) {
      socket.emit('ice-candidate', candidate);
    }
  };

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  if (isCaller) {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', offer);
  }
}

// User 1 starts the call
user1Btn.onclick = async () => {
  await startMedia();
  await createPeerConnection(true);
};

// User 2 joins the call
user2Btn.onclick = async () => {
  await startMedia();
  await createPeerConnection(false);
};

// Socket listeners
socket.on('offer', async (offer) => {
  if (!peerConnection) await createPeerConnection(false);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', answer);
});

socket.on('answer', async (answer) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('ice-candidate', async (candidate) => {
  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (e) {
    console.error('Error adding received ICE candidate', e);
  }
});
