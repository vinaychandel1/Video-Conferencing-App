'use strict'

var isConnectedToHost = false;
var isInitiator = false;
var isSuperNode = false;
var isHost = true;
var toggleScreen = false;
var toggleAudio = true;
var toggleVideo = false;
var togglePenWork =false;
var stopSpeakingTimeOut;
var hadStopped = true;
var speechEvents = null;
var alreadyDrawed = false;
var networkInfo;
var discTimeout;
var ctx;
var mouse = {x: 0, y: 0};
var last_mouse = {x: 0, y: 0};
var remoteStream = null;
var callType = null;
var localStream;
var prevScreenStream;
var clientId;
var localPeerList = new Map();
var offerBufferList = [];
var answerBufferList = [];
var pcConfig = {
    iceServers: [{
        urls: [ "stun:bn-turn1.xirsys.com",
        "stun:stun.l.google.com:19302"
     ]
   }, {
    username: "z0hP4q9X-FlUPCXCrnUxgOw2RmyfFCJRZRk82UpmOoRoOXWD2j00tqu-5LknYPGGAAAAAF70dSh5b2xvMTIz",
    credential: "5a49c916-b6ca-11ea-a0c2-0242ac140004",
    urls: [
        "turn:bn-turn1.xirsys.com:80?transport=udp",
        "turn:bn-turn1.xirsys.com:3478?transport=udp",
        "turn:bn-turn1.xirsys.com:80?transport=tcp",
        "turn:bn-turn1.xirsys.com:3478?transport=tcp",
        "turns:bn-turn1.xirsys.com:443?transport=tcp",
        "turns:bn-turn1.xirsys.com:5349?transport=tcp"
      ]
   }]
};

var canvas = document.querySelector('#canvas');
var localVideo = document.querySelector('#localVideo');
var progressBar = document.querySelector("#progressBar");
var startVideoCallButton = document.querySelector('#startVideoCall');
var startAudioCallButton = document.querySelector('#startAudioCall');
var toggleVideoButton = document.querySelector('#toggleVideo');
var toggleAudioButton = document.querySelector('#toggleAudio');
var requestList = document.querySelector('#requests');
var hangupButton = document.querySelector('#hangupButton');
var toggleScreenShare = document.querySelector("#toggleScreenShare");
var rname = document.querySelector('#rname');
var uname = document.querySelector('#uname');
var togglePen = document.querySelector("#togglePen");
var closeAnno = document.querySelector("#closeAnotate");
var x = window.matchMedia("(max-width: 600px)")
myFunction(x)
x.addListener(myFunction)

startVideoCallButton.style.display = "none";
progressBar.style.display = "none";
requestList.style.display = "none";
startAudioCallButton.style.display = "none";
hangupButton.style.display = "none";
function myFunction(x) {
    if (x.matches) {
        toggleScreenShare.style.display = "none";
    } else {
        toggleScreenShare.style.display = "block";
    }
  }
toggleVideoButton.style.display = "none";
toggleAudioButton.style.display = "none";
togglePen.style.display = "none";
canvas.style.display = "none";

var prevSession = JSON.parse(localStorage.getItem(rname.textContent));
console.log(prevSession);
var socket = io.connect();
var room;
if(prevSession != null){
    room = prevSession.room;
    uname.textContent =prevSession.uname;
}else{
room = rname.textContent;
if(uname.textContent === ''){
    var person = prompt("Please enter a username : ");
    while (person == null || person == "" || person.length > 8){
        person = prompt("Please enter a username (Max 8 characters):");
    }
    uname.textContent = person;
}
}

startVideoCallButton.addEventListener('click',startVideoCall);
startAudioCallButton.addEventListener('click',startAudioCall);
hangupButton.addEventListener('click',hangupAction);
toggleScreenShare.addEventListener('click',toggleScreenShareAction);
toggleVideoButton.addEventListener('click',toggleVideoAction);
toggleAudioButton.addEventListener('click',toggleAudioAction);
togglePen.addEventListener('click',togglePenAction);
closeAnno.addEventListener('click',togglePenAction);

function togglePenAction(){
    if(togglePenWork===false){
        canvas.style.display = "block";
        togglePenWork = true;
        ctx = canvas.getContext('2d');
        canvas.width = localStream.getVideoTracks()[0].getSettings().width;
        canvas.height = localStream.getVideoTracks()[0].getSettings().height;
        ctx.drawImage(localVideo, 0, 0,  localStream.getVideoTracks()[0].getSettings().width,localStream.getVideoTracks()[0].getSettings().height);
        canvas.srcObject = localStream;
        localStream.getVideoTracks().forEach(track =>track.stop());
        var newStream = canvas.captureStream();
        newStream.addTrack(localStream.getAudioTracks()[0]);
        localStream = newStream;
        localVideo.srcObject = canvas.captureStream();
        var trackk = canvas.captureStream().getVideoTracks()[0];
        localPeerList.forEach(function(value,key,map){
            var videoSender = value.peerConnection.getSenders().find(function(s) {
                return s.track.kind == trackk.kind;});
            videoSender.replaceTrack(trackk);
        });
        var initValCol = document.getElementById('selectedColor').value;
        ctx.strokeStyle = initValCol;
        if(alreadyDrawed === false)
            init();
    }else if(togglePenWork === true){
        togglePenWork = false;
        canvas.style.display = "none";
        localVideo.srcObject = prevScreenStream;
        var trackk = prevScreenStream.getVideoTracks()[0];
        localPeerList.forEach(function(value,key,map){
            var videoSender = value.peerConnection.getSenders().find(function(s) {
                return s.track.kind == trackk.kind;});
            videoSender.replaceTrack(trackk);
        });
    }
}
function init(){
    var startX,startY;
    alreadyDrawed = true;
	canvas.addEventListener('mousemove', function(e) {
		last_mouse.x = mouse.x;
		last_mouse.y = mouse.y;
		mouse.x = e.pageX - this.offsetLeft;
        mouse.y = e.pageY - this.offsetTop;
        //console.log(mouse.x);
       // console.log(mouse.y)
       // console.log(this.offsetLeft);
        //console.log(this.offsetTop);
    }, false);
	ctx.lineWidth = 2;
	ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
	var color_select = document.getElementById('selectedColor');
	color_select.addEventListener('change', function(event) {
		  ctx.strokeStyle = event.target.value;
	});
	canvas.addEventListener('mousedown', function(e) {
        canvas.addEventListener('mousemove', onPaint, false);
	}, false);
	
	canvas.addEventListener('mouseup', function() {
        canvas.removeEventListener('mousemove', onPaint, false);
	}, false);
	
	var onPaint = function() {
		ctx.beginPath();
		ctx.moveTo(last_mouse.x, last_mouse.y);
		ctx.lineTo(mouse.x, mouse.y);
		ctx.closePath();
		ctx.stroke();
    };
}

socket.on('created', function(room,sid){
    console.log('Created room ' + room);
    clientId = sid;
    isSuperNode = true;
    isConnectedToHost = true;
    isInitiator = true;
    startVideoCallButton.style.display = "block";
    startAudioCallButton.style.display = "block";
});
socket.on('full', function(room) {
    console.log('Room ' + room + ' is full');
});
socket.on('join', function (room){
    console.log('Another peer made a request to join room ' + room);
    console.log('This peer is the initiator of room ' + room + '!');
});
socket.on('joined', function(room,sid,numClients) {
    console.log('joined: ' + room);
    toggleScreenShare.style.display = "none"
    isSuperNode = true;
    clientId =sid;
    hangupButton.style.display = "block";
    var d = {};
    d.sid = sid;
    d.uname =  uname.textContent;
    d.room = room;
    localStorage.setItem(room,JSON.stringify(d));
    console.log(JSON.parse(localStorage.getItem(room)));
   // if(prevSession!=null){
     //   var message = {};
      //  message.specific = clientId;
      //  message.callType = "videoCall";
       // callAction(true);
       // permissionGranted(message)
    //}
    //else{
        callAction(false);
    //}
});
socket.on('message',async function(message) {
    console.log('Client received message:', message);
    if(message.type === 'offer') {
        if(message.specific === clientId){
            progressBar.style.display = "block";
            var newM = Object.assign({},message);
            offerBufferList.push(newM);
            await handleOffer(offerBufferList.pop());
        }
    }else if (message.type === 'answer'){
      if(message.specific === clientId){
            var newA = Object.assign({},message);
            answerBufferList.push(newA);
            await handleAnswer(answerBufferList.pop());
        }
    }else if (message.type === 'broadcastid') {
        broadcastIdReceived(message);
    }else if (message.type === 'grantedpermission'){
        permissionGranted(message);
    }else if (message.type === 'askpermission'){
        askedPermission(message);
    }else if (message.type === 'bye'){
        handleRemoteHangup(message.userid);
    }else if(message.type === 'streaming'){
        var nums = document.getElementById("videos");
        var listItem = nums.getElementsByTagName("div");
        for (var i=0; i < listItem.length; i++) {
            if(listItem[i].id === message.userid){
                listItem[i].getElementsByTagName('p')[0].style.background = 
                "brown";
                var sp = document.getElementById("remoteVideoDiv");
                sp.getElementsByTagName('video')[0].srcObject = listItem[i]
                .getElementsByTagName('video')[0].srcObject;
                listItem[i].getElementsByTagName('video')[0].style.borderColor = "rgb(0,255,0)";
                var p =  sp.getElementsByTagName('p')[0];
                p.textContent = listItem[i]
                .getElementsByTagName('p')[0].textContent;
                p.style.color = "white";
                p.style.textAlign = "center";
                p.style.marginLeft="0px";
                p.style.background="brown";
                p.style.marginTop = "0px";
                p.style.width="100%";
            }
        }
    }else if(message.type === 'streamingstoped'){
        var nums = document.getElementById("videos");
        var listItem = nums.getElementsByTagName("div");
        for (var i=0; i < listItem.length; i++) {
            if(listItem[i].id === message.userid){
                listItem[i]
                .getElementsByTagName('video')[0].style.borderColor = "white";
                listItem[i].getElementsByTagName('p')[0].style.background="linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.4))";
                listItem[i].getElementsByTagName('p')[0].style.borderColor = "white";
                var sp = document.getElementById("remoteVideoDiv");
                sp.getElementsByTagName('video')[0].srcObject = null;
                sp.getElementsByTagName('video')[0].style.borderColor = "white";
                sp.getElementsByTagName('p')[0].textContent = "Currently Speaking";
                sp.getElementsByTagName('p')[0].style.background="linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.4))";
            }
        }
    }else if (message.type === 'candidate') {
        if(clientId === message.specific){
            var candidate = new RTCIceCandidate({
                sdpMLineIndex: message.label,
                candidate: message.candidate
            });
            localPeerList.get(message.userid).peerConnection.addIceCandidate(candidate);
            console.log("Candidate added successfully")
        }
    }
});

start();
function start(){
    var isWebRTCSupported = navigator.mediaDevices.getUserMedia ||
    navigator.mediaDevices.webkitGetUserMedia ||
    navigator.mediaDevices.mozGetUserMedia ||
    navigator.mediaDevices.msGetUserMedia ||
    window.RTCPeerConnection;
    if (isWebRTCSupported){

        socket.emit('create or join', room,isHost);
        console.log('Want to create or  join room', room);
    }else{
        alert("WebRTC is not supported");
    }
}

async function handleOffer(message){
    var kk = await doAnswer(message);
    console.log(kk);
}
async function handleAnswer(message){
    try{
    await localPeerList.get(message.userid).peerConnection.setRemoteDescription
    (new RTCSessionDescription(message));}
    catch(e){
        console.log(e);
    }
}
function askPermission(){
    var myObj = {type: 'askpermission', roomname: room,username:uname.textContent, userid: clientId};
    socket.emit("message",myObj);
    progressBar.style.display = "block";
}
async function askedPermission(message){
    if(isInitiator && message.roomname === room){
        var li = document.createElement("li");
        li.appendChild(document.createTextNode(message.username));
        li.id = message.userid;
        requestList.appendChild(li);
        requestList.addEventListener('click', function(ev) {
            if(ev.target.tagName === 'LI' && ev.target.className != 'checked') {
                var myObj = {type: 'grantedpermission', specific: ev.target.id,callType: callType};
                socket.emit("message",myObj);
                ev.target.classList.toggle('checked');
                ev.target.style.color = "green";
            }
        }, false);
    }
}
async function permissionGranted(message){
    if(clientId === message.specific){
        isConnectedToHost = true;
		if(message.callType === "videoCall"){
			toggleAudioButton.style.display = "block";
            toggleVideoButton.style.display = "block";
            toggleVideoButton.style.background = "red";
            callType = "videoCall";
            broadcastId();
		}else if(message.callType === "audioCall"){
            localStream.getTracks().forEach(track =>track.stop());
            navigator.mediaDevices.getUserMedia({ video:false,
                audio :{ echoCancellationType: 'system',
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate:24000,
                sampleSize:16,
                channelCount:2,
                volume:0.5}
            }).then(function(stream){
                toggleAudioButton.style.display = "block";
                callType = "audioCall";
                gotStream(stream);
                broadcastId();
            }).catch(function(e){
                    alert('getUserMedia() error: ' + e);
                });
        }
    }
}

function broadcastId() {
    var myObj = {type: 'broadcastid', userid: clientId,roomname:rname.textContent,username:uname.textContent,isSuperNode:isSuperNode};
    socket.emit("message",myObj);
}

function broadcastIdReceived(message){
    if(isConnectedToHost && isSuperNode && message.isSuperNode && message.roomname === room){
        doCall(message.userid,message.username,message.isSuperNode,false);
    }
}

function toggleAudioAction(){
    if(toggleAudio === false){
        toggleAudio = true;
        localStream.getAudioTracks().forEach(t => t.enabled = true);
        toggleAudioButton.style.background = null;
        localPeerList.forEach(function(value,key,map){
            value.stream.getAudioTracks().forEach(t => t.enabled = true);
        });
    }else if(toggleAudio === true){
        toggleAudio = false;
        localStream.getAudioTracks().forEach(t => t.enabled = false);
        toggleAudioButton.style.background = "red";
        localPeerList.forEach(function(value,key,map){
            value.stream.getAudioTracks().forEach(t => t.enabled = false);
        });
    }
}
function toggleVideoAction(){
    if(toggleVideo === false){
        toggleVideo = true;
        toggleAudio = true;
        toggleAudioButton.style.background = null;
        toggleVideoButton.style.background = null;
        localStream.getTracks().forEach(t => t.enabled = true);
        localPeerList.forEach(function(value,key,map){
            value.stream.getTracks().forEach(t => t.enabled = true);
        });
        stopSpeakingTimeOut = setTimeout(handleStopSpeaking, 5000);
    }else if(toggleVideo === true){
        toggleVideo = false;
        toggleVideoButton.style.background = "red";
        localStream.getVideoTracks().forEach(t => t.enabled = false);
        localPeerList.forEach(function(value,key,map){
            value.stream.getVideoTracks().forEach(t => t.enabled = false);
        });
    }
}
function toggleScreenShareAction(){
    if(toggleScreen === false){
        toggleScreen = true;
        enableScreenShare();
    }else if(toggleScreen === true){
        toggleScreen = false;
        disableScreenShare();
    }
}
function enableScreenShare(){
    navigator.mediaDevices.getDisplayMedia({
        video : true
    }).then(function(stream){
        prevScreenStream = stream.clone();
        localStream.getVideoTracks().forEach(track =>track.stop());
        var newStream = stream;
        newStream.addTrack(localStream.getAudioTracks()[0]);
        localStream = newStream;
        localVideo.srcObject = stream;
       var trackk = stream.getVideoTracks()[0];
       localPeerList.forEach(function(value,key,map){
           var videoSender = value.peerConnection.getSenders().find(function(s) {
               return s.track.kind == trackk.kind;});
            videoSender.replaceTrack(trackk);
        });
       togglePen.style.display = "block";
    })
    .catch(function(e) {
    alert('getUserMedia() error: ' + e.name);
    console.log(e);
  })
}
function disableScreenShare(){
    canvas.style.display = "none"
    navigator.mediaDevices.getUserMedia({
        video:{width:320 ,height : 240}
    }).then(function(stream){
        var newStream = stream;
        newStream.addTrack(localStream.getAudioTracks()[0]);
        localPeerList.forEach(function(value,key,map){
            value.stream = newStream.clone();
            var trackk =  value.stream.getVideoTracks()[0];
            var videoSender = value.peerConnection.getSenders().find(function(s) {
                return s.track.kind == trackk.kind;});
            videoSender.replaceTrack(trackk);
            value.stream.getVideoTracks().forEach(t => t.enabled = false);
        });
        gotStream(newStream);
        togglePen.style.display = "none";
    }).catch(function(e) {
        alert('getUserMedia() error: ' + e);
    });
}

function startAudioCall(){
    navigator.mediaDevices.getUserMedia({ video:false,
        audio :true }).then(function(stream){
            gotStream(stream);
            startVideoCallButton.style.display = "none"
            startAudioCallButton.disabled = true;
            startAudioCallButton.style.display = "none"
            toggleAudioButton.style.display = "block"
            callType = "audioCall";
            requestList.style.display = "block";
            hangupButton.style.display = "block";
        }).catch(function(e) {
            alert('getUserMedia() error: ' + e);
        });
}

function startVideoCall(){
	if (room !== '') {
        navigator.mediaDevices.getUserMedia({ video:{width:320 ,height : 240},
            audio :{ echoCancellationType: 'system',
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate:24000,
            sampleSize:16,
            channelCount:2,
            volume:0.5} }).then(function(stream){
            gotStream(stream);
            
            toggleVideoButton.style.display = "block"
            toggleVideoButton.style.background = "red";
            toggleAudioButton.style.display = "block"
            startAudioCallButton.style.display = "none"
            startVideoCallButton.disabled = true;
            startVideoCallButton.style.display = "none"
            callType = "videoCall";
            requestList.style.display = "block";
            hangupButton.style.display = "block";
        }).catch(function(e) {
        alert('getUserMedia() error: ' + e);
        });
	}
}

function callAction(reCon){
    navigator.mediaDevices.getUserMedia({ video:{width:320 ,height : 240},
        audio :{ echoCancellationType: 'system',
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate:24000,
        sampleSize:16,
        channelCount:2,
        volume:0.5} 
    }).then(function(stream){
        gotStream(stream);
        if(reCon == false)
            askPermission();
    }).catch(function(e) {
        let silence = () => {
            let ctx = new AudioContext(), oscillator = ctx.createOscillator();
            let dst = oscillator.connect(ctx.createMediaStreamDestination());
            oscillator.start();
            return Object.assign(dst.stream.getAudioTracks()[0], {enabled: false});
        }
        let black = ({width = 640, height = 480} = {}) => {
            let canvas = Object.assign(document.createElement("canvas"), {width, height});
            canvas.getContext('2d').fillRect(0, 0, width, height);
            let stream = canvas.captureStream();
            return Object.assign(stream.getVideoTracks()[0], {enabled: false});
        }  
        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
        //Add the dummy Stream (Blank frames and silence)
        gotStream(blackSilence());
        if(reCon == false)
            askPermission();
    });
}

function hangupAction(){
	if(confirm("Are you sure you want to hang up?")){
		hangup();
	}else{
	}
}

async function createPeerConnection(userid,username,isSN,willCall){
    try {
        var obj ={};
        obj.peerConnection = new RTCPeerConnection(pcConfig);
        obj.willCall = willCall;
        obj.connectionWith = userid;
        obj.username = username;
        obj.isSuperNode = isSN;
        obj.peerConnection.onicecandidate = async function(event) {
            await handleIceCandidate(event,obj);
        }
  
        obj.peerConnection.ontrack = function(event){
            handleRemoteStreamAdded(event,obj);
        }
        obj.peerConnection.onicegatheringstatechange = function(event){
            console.log("GatherStateChange");
            console.log(obj.peerConnection.iceGatheringState);
        }
        obj.peerConnection.oniceconnectionstatechange = function(event){
            /*if(obj.peerConnection.iceConnectionState === 'disconnected'){
                handRemoval(obj.connectionWith);
                if(obj.willCall === true){
                    obj.peerConnection.restartIce();
                    handleManualIceRestart(obj);
                }
            }*/
            console.log("Ice+GatherStateChange");
            if(obj.peerConnection.iceGatheringState === "gathering" &&
            obj.peerConnection.iceConnectionState === "disconnected"){
                handRemoval(obj.connectionWith);
                if(obj.willCall === true){
                    obj.peerConnection.restartIce();
                    handleManualIceRestart(obj);
                }
            }
            console.log(obj.peerConnection.iceConnectionState);
            console.log(obj.peerConnection.iceGatheringState);
        }
        /*obj.peerConnection.onnegotiationneeded = function(event){
            if(renegotiate === true){
                renegotiate = false;
                localPeerList.delete(obj.connectionWith);
                var nums = document.getElementById("videos");
                var listItem = nums.getElementsByTagName("div");
                var rl = requestList.getElementsByTagName("li");
                for (var i=0; i < listItem.length; i++) {
                    if(listItem[i].id === obj.connectionWith){
                        listItem[i].remove();
                    }
                }
                doCall(obj.connectionWith,obj.username,obj.isSuperNode);
            }
        }*/
        obj.peerConnection.onremovestream = handleRemoteStreamRemoved;
        console.log('Created RTCPeerConnnection');
        return Object.assign({},obj);
    }catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return;
    }
}
async function handleManualIceRestart(obj){
    var nums = document.getElementById("videos");
    var listItem = nums.getElementsByTagName("div");
    for (var i=0; i < listItem.length; i++) {
        if(listItem[i].id === obj.connectionWith){
            listItem[i].remove();
        }
    }
    await doCall(obj.connectionWith,obj.username,obj.isSuperNode,true);
}
async function doCall(userid,username,isSN,willCall) {
    if(localPeerList.has(userid)){
        localPeerList.delete(userid);
    }
    var pc = await createPeerConnection(userid,username,isSN,willCall);
    localPeerList.set(userid,pc);
    console.log(localPeerList);
    pc.stream = localStream.clone();
    pc.stream.getTracks().forEach(track => pc.peerConnection.addTrack(track, pc.stream));
    console.log('Sending offer to peer');
    await pc.peerConnection.createOffer().then(async function(offer){
      await pc.peerConnection.setLocalDescription(offer);
      await sendMessage({
          type: "offer",
          userid:clientId,
          roomname : rname.textContent,
          username : uname.textContent,
          willCall : willCall,
          specific: pc.connectionWith,
          isSuperNode : isSuperNode,
          sdp: offer.sdp
        });
        if(!toggleScreen)
            pc.stream.getVideoTracks().forEach(t => t.enabled = false);
    });
}
async function doAnswer(message) {
    var newWillCall = true;
    if(message.willCall == true){
        newWillCall = false;
    }
    if(localPeerList.has(message.userid)){
        localPeerList.delete(message.userid);
        newWillCall = false;
        var nums = document.getElementById("videos");
        var listItem = nums.getElementsByTagName("div");
        var rl = requestList.getElementsByTagName("li");
        for (var i=0; i < listItem.length; i++) {
            if(listItem[i].id === message.userid){
                listItem[i].remove();
            }
        }
    }
    console.log('Sending answer to peer.');
    var pc = await createPeerConnection(message.userid,message.username,message.isSuperNode,newWillCall);
    localPeerList.set(message.userid,pc);
    console.log(localPeerList);
    try {
        pc.stream = localStream.clone();
        pc.stream.getTracks().forEach(track => pc.peerConnection.addTrack(track, pc.stream));
        await pc.peerConnection.setRemoteDescription(new RTCSessionDescription(message)).then(
            await pc.peerConnection.createAnswer().then(async function(answer){
                await pc.peerConnection.setLocalDescription(answer);
                await sendMessage({
                    type: "answer",
                    userid:clientId,
                    specific: message.userid,
                    roomname : rname.textContent,
                    username : uname.textContent,
                    isSuperNode : isSuperNode,
                    sdp: answer.sdp
                });
            }));
            pc.stream.getVideoTracks().forEach(t => t.enabled = false);
            progressBar.style.display = "none";
            return "Answered";
    }catch(e){
        console.log(e);
    }
}

async function handleIceCandidate(event,pc) {
    if (event.candidate) {
        await sendMessage({
            type: 'candidate',
            userid : clientId,
            specific:pc.connectionWith,
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
        });
    }else{
        console.log('End of candidates.');
    }
}

function handleRemoteStreamAdded(event,pc) {
    if(event.streams[0]!=remoteStream){
        remoteStream = event.streams[0];
        console.log('Remote stream added.');
        console.log(remoteStream);
        var c = document.getElementById ("videos");
        var div = document.createElement("div");
        var v = document.createElement ("video");
        var p = document.createElement("p");
        var node = document.createTextNode(pc.username);
        div.id = pc.connectionWith;
        div.className = pc.isSuperNode
        div.style.display = "inline-block";
        p.appendChild(node);
        p.style.color = "white";
        p.style.textAlign = "center";
        p.style.marginLeft="0px";
        p.style.background="linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.4))";
        p.style.marginTop = "0px";
        p.style.width="100%";
        p.style.borderStyle= "solid";
        p.style.borderWidth = "2px";
        p.style.borderColor = "white";
        v.autoplay = true;
        v.className = "allRemVideos";
        v.style.display = "inline-block"
        v.style.borderStyle= "solid";
        v.style.borderWidth = "2px";
        v.style.borderColor = "white";
        v.style.top = "0px";
        v.defaultMuted = true;
        v.poster ="/img/Color-blue.jpg";
        //v.controls = true;
        v.srcObject = remoteStream;
        c.appendChild(div);
        div.appendChild(v);
        div.appendChild(p);
    }
}
function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
}


async function sendMessage(message) {
    console.log('Client sending message: ', message);
    var ww = await socket.emit('message', message);
    return ww;
}

function gotStream(stream){
    console.log('Adding local stream.');
    let constraints = {
        width: 300,
        height: 300
    };
    if(stream.getVideoTracks().length >0)
        stream.getVideoTracks()[0].applyConstraints(constraints);
    localStream = stream;
    if(stream.getVideoTracks().length >0)
        localStream.getVideoTracks().forEach(t => t.enabled = false);
    localVideo.srcObject = localStream;
    sendMessage('got user media');
    if(speechEvents!=null)
        speechEvents.stop();
    speechEvents = hark(localStream, {});
    speechEvents.on('speaking', function (){
        try{
		    var myObj = {type: 'streaming', userid:clientId};
            socket.emit("message",myObj);
            clearTimeout(stopSpeakingTimeOut)
            if(hadStopped === true && localPeerList.size!=0){
                hadStopped = false;
                localPeerList.forEach(function(value,key,map){
                    if(toggleVideo === true)
                        value.stream.getTracks().forEach(t => t.enabled = true);
                    else if(toggleAudio === true)
                        value.stream.getAudioTracks().forEach(t => t.enabled = true);
                });
            }
        }catch(e){
            console.log(e);
        }
    });
    speechEvents.on('stopped_speaking',function(){
        if(localPeerList.size!=0){
            stopSpeakingTimeOut = setTimeout(handleStopSpeaking, 5000);
        }
    });
    //speechEvents.on('volume_change', function (volume, threshold) {});
}
function handleStopSpeaking(){
    try{
        hadStopped = true;
        if(toggleScreen === false){
            localPeerList.forEach(function(value,key,map){
                value.stream.getTracks().forEach(t => t.enabled = false);
            });
        }
        var myObj = {type: 'streamingstoped', userid:clientId};
        socket.emit("message",myObj);
    }catch(e){
        console.log(e);
    }
}

window.onbeforeunload = function(e){
    var myObj = {type: 'bye', roomname: room, userid: clientId};
    sendMessage(myObj);
};
/*
//For mobile devices, to detect when browser is closed
window.onblur = function(e){
    if (typeof window.orientation !== 'undefined') {
        console.log("Blurred waiting..");
        discTimeout = setTimeout(hangup,10000);   
    }                  
}
window.onfocus = function(e){
    clearTimeout(discTimeout);
}*/

function hangup() {
    var myObj = {type: 'bye', roomname: room, userid: clientId};
    sendMessage(myObj);
    clearConnection();
}
function handleRemoteHangup(userid) {
    console.log(userid + 'Session terminated..');
    try{
    localPeerList.get(userid).peerConnection.close();
    localPeerList.delete(userid);
    }catch(e){
        console.log(e);
    }
    var nums = document.getElementById("videos");
    var listItem = nums.getElementsByTagName("div");
    var rl = requestList.getElementsByTagName("li");
    for (var i=0; i < listItem.length; i++) {
        if(listItem[i].id === userid){
            listItem[i].remove();
        }
    }
    for(var i =0;i<rl.length;i++){
        if(rl[i].id === userid){
            rl[i].remove();
        }
    }
}
function handRemoval(userid) {
    console.log(userid + 'Session terminated..');
    //localPeerList.get(userid).peerConnection.close();
    var nums = document.getElementById("videos");
    var listItem = nums.getElementsByTagName("div");
    var rl = requestList.getElementsByTagName("li");
    for (var i=0; i < listItem.length; i++) {
        if(listItem[i].id === userid){
            listItem[i].remove();
        }
    }
    for(var i =0;i<rl.length;i++){
        if(rl[i].id === userid){
            rl[i].remove();
        }
    }
}
function clearConnection() {
    localPeerList.forEach(function(value,key,map){
        value.peerConnection.close();
        localPeerList.delete(key);
    });
    localStream.getTracks().forEach(function(track){track.stop()});
    var nums = document.getElementById("videos");
    nums.remove();
}