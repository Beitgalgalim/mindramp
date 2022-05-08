import { useEffect, useState } from 'react';
import * as api from './api'

import './App.css';
import { Alert, AlertTitle } from '@mui/material'
import { Text, HBox, Spacer, HBoxC } from './elem';

import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Collapse } from '@material-ui/core';
import { Button, LinearProgress } from '@mui/material';

import { MsgButton, NotificationMessage } from './types';
import UserEvents from './user-events';
import Admin from './admin';
import { User } from '@firebase/auth';
import Login from './login';
import { Close } from '@mui/icons-material';

function App(props: any) {

  const [user, setUser] = useState<string | null | undefined>(undefined);
  const [msg, setMsg] = useState<NotificationMessage | undefined>(undefined);
  const [connected, setConnected] = useState(false);
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [synced, setSynced] = useState(false);


  useEffect(() => {
    function handleResize() {
      setWindowSize({ w: window.innerWidth, h: window.innerHeight })
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

  }, [])

  const notify = {
    success: (body: string, title?: string) => {
      setMsg({ open: true, severity: "success", title, body, progress: false });
      setTimeout(() => setMsg(undefined), 5000);
    },
    error: (body: string, title?: string) => {
      setMsg({ open: true, severity: "error", title, body, progress: false });
      setTimeout(() => setMsg(undefined), 5000);

    },
    ask: (body: string, title: string, buttons: MsgButton[], details?: string) => {
      setMsg({ open: true, severity: "info", title, body, buttons, details, progress: false });
    },
    clear: () => {
      setMsg(undefined);
    },
    inProgress: () => {
      setMsg({ progress: true, open: true })
    },
  }

  useEffect(() => {
    const success = api.initAPI(
      // Callback for AuthStateChanged
      (user) => {
        console.log("user:", JSON.stringify(user));
        setUser(user?.email);
        setSynced(true);
      });
    if (success) {
      setConnected(true);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



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
          {!msg.buttons && <div style={{ position: "absolute", left: "14vw", top: "1vh" }}><Close onClick={() => setMsg(undefined)} /></div>}
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
            !synced ? <LinearProgress />
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
          <Route path="/" element={<UserEvents windowSize={windowSize} connected={connected} user={user} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
