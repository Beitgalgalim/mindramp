# Mind Ramp Project Memory Bank

## Project Overview
- **Name**: Mind Ramp
- **Purpose**: To make digital calendars and events accessible for people with disabilities.
- **Target Audience**: Developed for Beit Galgalim, an Israeli NPO.

## Main Features
- **Event Management**: Create, update, delete, and display events.
- **User Management**: Add, edit, and delete users, manage user roles.
- **Media Management**: Upload and manage media files.
- **Accessibility**: Features to enhance accessibility for users with disabilities.
- **Notifications**: Send and display notifications to users.
- **Audio Recording**: Record and play audio files.

## Technologies Used
- **React**: For building the user interface.
- **Firebase**: For backend services, including Firestore and storage. all functions are under functions folder
- **TypeScript**: For type-safe JavaScript development.

## Development Details
- **Local Development**: 
  - Use `npm start` to run the app locally.
  - The app uses Firestore collections with `_dev` suffix (e.g., `event_dev`).
  - To run against production collections, create a `.env` file with `REACT_APP_PRODDATA=true`.
  - Uploaded WAV/JPEG files go to the same location in storage regardless of environment.

## Server Functions Setup
- Use Firebase CLI to set up WhatsApp configuration:
  ```bash
  firebase functions:config:set whatsapp.verifytoken=<Webhook verify_token>
  firebase functions:config:set whatsapp.appsecret=<Facebook App's appsecret>
  firebase functions:config:set whatsapp.phoneid=<your phone ID>
  firebase functions:config:set whatsapp.accesstoken=<access token>
  ```

## File Structure Overview
- **App.tsx**: Main application component.
- **AudioRecorderPlayer.tsx**: Handles audio recording and playback.
- **About.tsx**: Provides information about the application.
- **AccessibilitySettings.tsx**: Manages accessibility settings for users.
- **API.tsx**: Functions for interacting with backend services.
- **EditUser.tsx**: Allows editing of user information and roles.
- **EventDetails.tsx**: Displays detailed information about events.
- **Events.tsx**: Manages and displays events.
- **Kiosk.tsx**: Provides a kiosk mode for user interaction.
- **Login.tsx**: Handles user authentication.
- **MediaPicker.tsx**: Allows users to select media files.
- **NotificationView.tsx**: Displays notifications to users.
- **PeoplePicker.tsx**: Allows selection of people from a list.
- **UserEvents.tsx**: Manages user-specific events.
- **UserSettings.tsx**: Allows users to manage their settings.

## Future Plans
- import an excel file that updates calander events for all users. example function in devops.js: `importMeetingsFromExcel`. todo:
  - match the meeting's date & time to an event in the DB
  - update participants (override, excel wins)
  - create events for "פרטני" with the participant
  
