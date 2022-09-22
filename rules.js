rules_version = '2';

service cloud.firestore {
    
  match /databases/{database}/documents {
    function isAdmin() {
      let email = request.auth.token.email;
      return get(/databases/$(database)/documents/users/$(email)).data.type == 2 || get(/databases/$(database)/documents/users/$(email)/system/Default).data.admin == true;
    }
    
    function isKiosk() {
      let email = request.auth.token.email;
      return get(/databases/$(database)/documents/users/$(email)).data.type == 3;    
    }
    
    function getParticipantKey() {
        let email = request.auth.token.email;
        return email.replace("\\.", "").replace("@", "");
    }
    
    function isDevAdmin() {
      let email = request.auth.token.email;
      return get(/databases/$(database)/documents/users_dev/$(email)).data.type == 2 || get(/databases/$(database)/documents/users_dev/$(email)/system/Default).data.admin == true;
    }
    
    function isDevKiosk() {
      let email = request.auth.token.email;
      return get(/databases/$(database)/documents/users_dev/$(email)).data.type == 3;    
    }
    
    function isCurrentUser(email) {
    	return email == request.auth.token.email;
    }

		function isAuthenticated() {
    	return request.auth != null;
    }
    
  	match /event/{eventId} {
      allow read: if isAdmin() ||
        isKiosk() || 
        resource.data.participants == {} || 
      	resource.data.participants[getParticipantKey()] != null ||
        resource.data.guide.email == request.auth.token.email;
      allow write: if isAdmin();
    }
    
    match /media/{mediaId} {
      allow read, write: if isAdmin();
    }
    
    match /event_dev/{eventId} {
      allow read: if isDevAdmin() ||
        isDevKiosk() || 
        resource.data.participants == {} || 
      	resource.data.participants[getParticipantKey()] != null ||
        resource.data.guide.email == request.auth.token.email;
      allow write: if isDevAdmin();
    }
    
    match /media_dev/{mediaId} {
      allow read, write: if isDevAdmin();
    }
    
    match /locations/{locationId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /locations_dev/{locationId} {
      allow read: if true;
      allow write: if isDevAdmin();
    }
    
    match /guides_dev/{guideId} {
    	allow read: if true;
      allow write: if isDevAdmin();
    }
    
    match /users_dev/{email} {
      allow read: if isCurrentUser(email) || isDevAdmin() || 
      isDevKiosk() && resource.data.showInKiosk == true;
      allow create: if false;
      allow update: if isDevAdmin();
      
      match /system/{docID} {
        allow read, write: if isDevAdmin();
      }
      
       match /personal/{docID} {
        allow read, write: if isDevAdmin() || isCurrentUser(email);
      }
    }
    
     match /users/{email} {
      allow read: if isCurrentUser(email) || isAdmin() || 
      isKiosk() && resource.data.showInKiosk == true;
      allow create: if false;
      allow update: if isAdmin();
      
      match /system/{docID} {
        allow read, write: if isAdmin();
      }
      
       match /personal/{docID} {
        allow read, write: if isAdmin() || isCurrentUser(email);
      }
    }
  }
}