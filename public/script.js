const socket = io();
const localVideo = document.getElementById('local');
const remoteVideo = document.getElementById('remote');

let peer = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

peer.onicecandidate = event => {
  if (event.candidate) {
    socket.emit('candidate', event.candidate);
  }
};

peer.ontrack = event => {
  remoteVideo.srcObject = event.streams[0];
};

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
  localVideo.srcObject = stream;
  stream.getTracks().forEach(track => peer.addTrack(track, stream));

  peer.createOffer().then(offer => {
    return peer.setLocalDescription(offer);
  }).then(() => {
    socket.emit('offer', peer.localDescription);
  });
});

socket.on('offer', offer => {
  peer.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {
    return navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  }).then(stream => {
    localVideo.srcObject = stream;
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
    return peer.createAnswer();
  }).then(answer => {
    return peer.setLocalDescription(answer);
  }).then(() => {
    socket.emit('answer', peer.localDescription);
  });
});

socket.on('answer', answer => {
  peer.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('candidate', candidate => {
  peer.addIceCandidate(new RTCIceCandidate(candidate));
});
