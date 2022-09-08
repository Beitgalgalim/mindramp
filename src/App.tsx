import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from './api'

import './App.css';
import { Alert, AlertTitle } from '@mui/material'
import { Text, Spacer, HBoxC } from './elem';

import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Collapse } from '@material-ui/core';
import { Button, LinearProgress } from '@mui/material';

import { MessageInfo, MsgButton, NotificationMessage, NotificationToken, UserType } from './types';
import UserEvents from './user-events';
import Admin from './admin';
import { User } from '@firebase/auth';
import Login from './login';
import { Close } from '@mui/icons-material';
import useLocalStorageState from 'use-local-storage-state';
const logo = require("./logo-small.png");
let gNotificationTimeout:any = undefined;

function App(props: any) {

  const [user, setUser] = useState<string | null | undefined>(undefined);
  const [admin, setAdmin] = useState<boolean>(false);
  const [guide, setGuide] = useState<boolean>(false);
  const [gettingAdminStatus, setGettingAdminStatus] = useState<boolean>(false);

  const [msg, setMsg] = useState<NotificationMessage | undefined>(undefined);

  const [connected, setConnected] = useState(false);
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const msgTimerRef = useRef<NodeJS.Timer>();

  // Notification
  const [localNotificationToken, setLocalNotificationToken] = useLocalStorageState<string>("NotificationToken");
  const [actualtNotificationOn, setActualNotificationOn] = useState<boolean>(false);
  const [desiredNotificationOn, setDesiredNotificationOn] = useState<boolean | null>(null);
  const [serverPersistedNotificationTokens, setServerPersistedNotificationTokens] = useState<NotificationToken[] | null>()
  const [deviceProvidedNotificationToken, setDeviceProvidedNotificationToken] = useState<string | null>();
  const [notificationReady, setNotificationReady] = useState<boolean>(false);

  useEffect(() => {
    function handleResize() {
      setWindowSize({ w: window.innerWidth, h: window.innerHeight })
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

  }, [])


  const clearMsg = () => {
    setMsg(undefined);
    if (msgTimerRef.current) {
      clearTimeout(msgTimerRef.current);
      msgTimerRef.current = undefined;
    }
  }
  const notify = {
    success: (body: string, title?: string) => {
      setMsg({ open: true, severity: "success", title, body, progress: false });
      msgTimerRef.current = setTimeout(clearMsg, 5000);
    },
    error: (body: string, title?: string) => {

      setMsg({ open: true, severity: "error", title: "" + title, body: "" + body, progress: false });
      msgTimerRef.current = setTimeout(clearMsg, 5000);

    },
    ask: (body: string, title: string, buttons: MsgButton[], details?: string) => {
      clearMsg();
      setMsg({ open: true, severity: "info", title, body, buttons, details, progress: false });
    },
    clear: clearMsg,
    inProgress: () => {
      setMsg({ progress: true, open: true })
    },
  }

  const onPushNotification = (msgPayload: any) => {
    console.log("New forground notification:", msgPayload.notification);
    // notify.success(msgPayload.notification.body, msgPayload.notification?.title || "")
    // const newNotif = {
    //   title: msgPayload.notification?.title || "",
    //   body: msgPayload.notification.body,
    //   unread:true,
    // }
    // setNotifications(curr=>curr?[...curr, newNotif]:[newNotif]);
    const greeting = new Notification(msgPayload.notification?.title, {
      body: msgPayload.notification.body,
      icon: logo,
      badge: logo,
      dir: "ltr",
    });

    // greeting.onclick = () => {
    //   alert("test");
    // };
  };

  useEffect(() => {
    api.initAPI(
      // Callback for AuthStateChanged
      (userDocument) => {
        if (userDocument) {
          setUser(userDocument.email);
          // setDesiredNotificationOn(userPersonalInfo.notificationOn === true);
          // setActualNotificationOn(userPersonalInfo.notificationOn === true)
          // setServerPersistedNotificationTokens(userPersonalInfo.tokens);
          setGettingAdminStatus(true);
          setGuide(userDocument.type == UserType.GUIDE);
          api.isCurrentUserAdmin().then((isAdmin)=>{
            setAdmin(isAdmin);
            setGettingAdminStatus(false);
          })
        } else {
          setUser(null);
          setDesiredNotificationOn(false);
          setActualNotificationOn(false);
          setServerPersistedNotificationTokens([]);
        }
        setNotificationReady(true)
      },
      onPushNotification,
      (notifToken) => setDeviceProvidedNotificationToken(notifToken)
    );

    setConnected(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!notificationReady) return;

    const isSafari = 'safari' in window;
    let needsServerUpdate = false;
    if (deviceProvidedNotificationToken && localNotificationToken !== deviceProvidedNotificationToken) {
      if (serverPersistedNotificationTokens?.find(t => t.token === deviceProvidedNotificationToken)) {
        //only local update
        setLocalNotificationToken(deviceProvidedNotificationToken);
      } else {
        needsServerUpdate = true;
      }
    }

    if (desiredNotificationOn !== null && desiredNotificationOn !== actualtNotificationOn) {
      needsServerUpdate = true;
    }
    if (needsServerUpdate) {
      if(gNotificationTimeout) {
        clearTimeout(gNotificationTimeout);
      }
      gNotificationTimeout = setTimeout(()=>{
        gNotificationTimeout = undefined;
        api.updateUserNotification(desiredNotificationOn === true, deviceProvidedNotificationToken, isSafari).then(
        () => {
          setActualNotificationOn(desiredNotificationOn === true);
          setLocalNotificationToken(deviceProvidedNotificationToken || "");
          notify.success(desiredNotificationOn === true ?
          "הודעות מופעלות" :
          "הודעות כבויות")
        },
        (err) => notify.error("שמירת מצב הודעות נכשל: " + err.message)
      )}, 1000);  
    }

  }, [serverPersistedNotificationTokens, desiredNotificationOn,
    actualtNotificationOn, deviceProvidedNotificationToken,
    localNotificationToken, notificationReady]);


  return (
    <div className="App" dir="rtl">
      {msg && <Collapse in={msg.open} timeout={500} style={{
        position: 'fixed',
        display: "flex", justifyContent: "center",
        top: msg.top || 0, left: 0, right: 0, fontSize: 15, zIndex: 1000
      }} >
        <Alert style={{
          fontSize: 22,
          width: "70vw",
          borderRadius: 15,
          borderStyle: "solid",
          borderWidth: 1,
          borderColor: "gray",
          justifyContent: "center",
        }} severity={msg.severity}>
          {!msg.buttons && <div style={{ position: "absolute", left: "14vw", top: "1vh" }}><Close onClick={() => notify.clear()} /></div>}
          {msg.title ? <AlertTitle>{msg.title}</AlertTitle> : null}
          <Text>{msg.body}</Text>
          {msg.details ? msg.details.split("\n").map(d => <Text fontSize={15}>{d}</Text>) : null}
          {msg.details ? <Spacer height={10} /> : null}
          {msg.buttons && msg.buttons.length > 0 ?
            <HBoxC >
              {msg.buttons.map(btn => ([
                <Spacer key={1} width={20} />,
                <Button key={2} variant="contained" onClick={() => {
                  setMsg(undefined);
                  btn.callback();
                }}>{btn.caption}</Button>
              ])
              )}
            </HBoxC> : null}
        </Alert>
      </Collapse>}

      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={
            // ---- Loading bar ----
            !connected ? <LinearProgress />
              :
              // ---- Login -----
              !user ? <Login
                onLogin={(u: User) => { console.log("logged?") }}
                onError={(err: Error) => notify.error(err.toString())}
                onForgotPwd={() => {
                  //todo
                }}
              />
                :
                (guide || admin) ? <Admin connected={connected} notify={notify} user={user} isCurrentUserAdmin={admin} /> :
                gettingAdminStatus ? <div>
                  <LinearProgress />
                  <div style={{fontSize:30}}>טוען הרשאות</div>
                </div> : <div>אינך מורשה</div>

          } />
          <Route path="/" element={<UserEvents
            isAdmin={admin}
            isGuide={true}
            notificationOn={actualtNotificationOn === true}
            onNotificationToken={(notifToken) => {
              setDeviceProvidedNotificationToken(notifToken);
            }}
            onPushNotification={onPushNotification}
            onNotificationOnChange={(on) => {
              setDesiredNotificationOn(on);
            }}

            windowSize={windowSize}
            connected={connected}
            user={user}
            notify={notify} />}
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
