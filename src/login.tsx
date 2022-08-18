import { useCallback, useState, useEffect } from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Link from '@material-ui/core/Link';
import { ConstructionOutlined, LockOutlined } from '@mui/icons-material';
import Typography from '@material-ui/core/Typography';

import * as api from './api'
import { LoginProps } from './types';
import { HBox, Spacer, VBoxC } from './elem';
import { Checkbox, FormControlLabel } from '@mui/material';
//import SelfRegistration from './self-registeration';




export default function Login({ onForgotPwd, onLogin, onError, onCancel }:
    LoginProps) {
    //const classes = useStyles();

    const [user, setUser] = useState<string>("");
    const [pwd, setPwd] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(true);

    const ok = useCallback(() => {
        console.log("in ok");
        api.getUserInfo(user.trim(), pwd.trim()).then(
            info => onLogin(info),
            err => onError(new Error(err.message))
        );
    }, [user, pwd, onError, onLogin])


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
                        onChange={(e) => setUser(e.currentTarget.value)}
                    />
                </div>
                <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    label="סיסמא"
                    type={showPassword?"text":"password"}
                    
                    autoComplete="current-password"
                    onChange={(e) => setPwd(e.currentTarget.value)}
                />
                <FormControlLabel control={<Checkbox
                    checked={showPassword}
                    onChange={(e) => setShowPassword(prev => e.currentTarget.checked)}
                />} label="הצג סיסמא" />
                <Spacer height={15}/>
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
                    <Link variant="body2" onClick={() => onForgotPwd()}>
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