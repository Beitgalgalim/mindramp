importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');


let app = firebase.initializeApp({
    apiKey: "AIzaSyAShjgi4n45TbHU0T717McP3VfhyXJDfts",
    projectId: "mindramp-58e89",
    messagingSenderId: "12081058518",
    appId: "1:12081058518:web:055ce975c0f635cfefaf77",
});

console.log("Setting up mind-ramp push notification");

const messaging = firebase.messaging(app);

