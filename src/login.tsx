import { useCallback, useState, useEffect } from 'react';
import { ConstructionOutlined, LockOutlined } from '@mui/icons-material';

import * as api from './api'
import { LoginProps } from './types';
import { HBox, Spacer, VBoxC } from './elem';
import { Checkbox, FormControlLabel, Link , Button, TextField, Typography, Avatar} from '@mui/material';
//import SelfRegistration from './self-registeration';




export default function Login({ onForgotPwd, onLogin, onError, onCancel, notify }:
    LoginProps) {
    //const classes = useStyles();

    const [user, setUser] = useState<string>("");
    const [pwd, setPwd] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(true);
    const [forgotUser, setForgotUser] = useState<boolean>(false);
    const [phone, setPhone] = useState<string>("");

    const ok = useCallback(() => {
        console.log("in ok");
        if (forgotUser) {
            api.forgotUser(phone.trim()).then(
                () => notify.success("הודעה נשלחה עם שם המשתמש לווטסאפ"),
                err => onError(new Error(err.message))
            );
            return;
        }
        api.getUserInfo(user.trim(), pwd.trim()).then(
            info => onLogin(info),
            err => onError(new Error(err.message))
        );
    }, [user, pwd, onError, onLogin, forgotUser])


    useEffect(() => {
        const listener = (evt: KeyboardEvent) => {
            if (evt.code === "Enter" || evt.code === "NumpadEnter") {
                evt.preventDefault();
                ok();
            }
        };
        document.addEventListener("keydown", listener);
        return () => {
            document.removeEventListener("keydown", listener);
        };
    }, [ok]);

    if (forgotUser) {
        return <VBoxC>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: 15, minWidth: 250, maxWidth: 500 }}>
                <Avatar >
                    <LockOutlined />
                </Avatar>
                <Typography component="h1" variant="h5">שכחתי משתמש</Typography>
                <div style={{ width: '100%' }} dir={'ltr'}>
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        label="מספר טלפון"

                        autoFocus
                        onChange={(e) => setPhone(e.currentTarget.value)}
                    />
                </div>
                <div style={{display:"flex", justifyContent:"center"}}>
                    <Button

                        
                        variant="contained"
                        color="primary"
                        onClick={() => ok()}
                    >
                        שלח
                    </Button>
                    <Spacer />
                    <Button

                        
                        variant="contained"
                        color="primary"
                        onClick={() => setForgotUser(false)}
                    >
                        בטל
                    </Button>
                </div>
            </div>
        </VBoxC>
    }


    return (
        <VBoxC>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: 15, minWidth: 250, maxWidth: 500 }}>
                <Avatar >
                    <LockOutlined />
                </Avatar>
                <Typography component="h1" variant="h5">התחברות</Typography>
                <div style={{ width: '100%' }} dir={'ltr'}>
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        label="אימייל"
                        autoComplete="email"
                        autoFocus
                        onChange={(e) => setUser(e.currentTarget.value.toLowerCase())}
                    />
                </div>
                <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    label="סיסמא"
                    type={showPassword ? "text" : "password"}

                    autoComplete="current-password"
                    onChange={(e) => setPwd(e.currentTarget.value)}
                />
                <FormControlLabel control={<Checkbox
                    checked={showPassword}
                    onChange={(e) => setShowPassword(prev => e.currentTarget.checked)}
                />} label="הצג סיסמא" />
                <Spacer height={15} />
                <Button

                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => ok()}
                >
                    התחבר
                </Button>
                <Spacer />
                <HBox>
                    <Link variant="body2" onClick={() => setForgotUser(true)} style={{ fontSize: 22 }}>
                        שכחתי משתמש?
                    </Link>
                    <Spacer width={20} />
                    <Link variant="body2" onClick={() => onForgotPwd()} style={{ fontSize: 22 }}>
                        שכחתי סיסמא?
                    </Link>
                    <Spacer width={20} />
                    {onCancel && <Link variant="body2" onClick={() => onCancel && onCancel()}>
                        הישאר אנונימי
                    </Link>}
                </HBox>
            </div>
        </VBoxC>
    );
}