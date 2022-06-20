import { useEffect, useRef, useState } from 'react';
import * as api from './api'

import './App.css';
import { Alert, AlertTitle } from '@mui/material'
import { Text, Spacer, HBoxC } from './elem';

import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Collapse } from '@material-ui/core';
import { Button, LinearProgress } from '@mui/material';

import { MessageInfo, MsgButton, NotificationMessage, NotificationToken } from './types';
import UserEvents from './user-events';
import Admin from './admin';
import { User } from '@firebase/auth';
import Login from './login';
import { Close } from '@mui/icons-material';
import useLocalStorageState from 'use-local-storage-state';
const logo = require("./logo-small.png");

function App(props: any) {

  const [user, setUser] = useState<string | null | undefined>(undefined);
  const [msg, setMsg] = useState<NotificationMessage | undefined>(undefined);

  const [connected, setConnected] = useState(false);
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [notificationOn, setNotificationOn] = useState<boolean | null>();
  const [tokens, setTokens] = useState<NotificationToken[] | null>()
  const [notificationToken, setNotificationToken] = useState<string | null>();
  const msgTimerRef = useRef<NodeJS.Timer>();
  const [notifications, setNotifications] = useLocalStorageState<MessageInfo[]>("notifications");


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
      setMsg({ open: true, severity: "error", title, body, progress: false });
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
    const greeting = new Notification(msgPayload.notification?.title,{
      body: msgPayload.notification.body,
      icon: logo,
    });

    // greeting.onclick = () => {
    //   alert("test");
    // };
  };

  useEffect(() => {
    api.initAPI(
      // Callback for AuthStateChanged
      (userPersonalInfo) => {
        if (userPersonalInfo) {
          setUser(userPersonalInfo.email);
          setNotificationOn(userPersonalInfo.notificationOn === true);
          setTokens(userPersonalInfo.tokens);
        } else {
          setUser(null);
          setNotificationOn(false);
          setTokens(null);
        }
      },
      onPushNotification,
      (notifToken) => setNotificationToken(notifToken)
    );

    setConnected(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    //Update server with notification info if needed
    if (notificationToken && notificationToken !== "" && user &&
      (!tokens || !tokens.find(n => n.token === notificationToken))) {
      const isSafari = 'safari' in window;
      api.updateUserNotification(notificationOn === true, notificationToken, isSafari);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationToken, notificationOn, user, tokens]);

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
                onLogin={(u: User) => { }}
                onError={(err: Error) => notify.error(err.toString())}
                onForgotPwd={() => {
                  //todo
                }}
              />
                :
                <Admin connected={connected} notify={notify} user={user} />

          } />
          <Route path="/" element={<UserEvents
            notificationOn={notificationOn === true}
            onNotificationToken={(notifToken) => setNotificationToken(notifToken)}
            onPushNotification={onPushNotification}
            onNotificationOnChange={(on) => setNotificationOn(on)}
            notifications={notifications}
            onSetNotificationRead={notif=>{
              // in case of notification - delete read messages
              setNotifications(curr=>{
                if (curr) {
                  return curr.filter(c=>(notif.title !== c.title || notif.body !== c.body));
                }
                return undefined;
              })
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
