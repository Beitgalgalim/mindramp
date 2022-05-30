import { useCallback, useState, useEffect } from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import Link from '@material-ui/core/Link';
import Grid from '@material-ui/core/Grid';
import { LockOutlined } from '@mui/icons-material';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';

import * as api from './api'
import { LoginProps, NotificationMessage } from './types';
import { User } from '@firebase/auth';
import { HBox, Spacer } from './elem';
//import SelfRegistration from './self-registeration';


const useStyles = makeStyles((theme) => ({
    paper: {
        marginTop: theme.spacing(8),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    avatar: {
        margin: theme.spacing(1),
        backgroundColor: theme.palette.secondary.main,
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(1),
    },
    submit: {
        margin: theme.spacing(3, 0, 2),
    },
}));

export default function Login({ onForgotPwd, onLogin, onError, onCancel }:
    LoginProps) {
    //const classes = useStyles();

    const [user, setUser] = useState<string>("");
    const [pwd, setPwd] = useState<string>("");

    const ok = useCallback(() => {
        api.getUserInfo(user, pwd).then(
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: 15 }}>
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
                type="password"
                autoComplete="current-password"
                onChange={(e) => setPwd(e.currentTarget.value)}
            />
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
                <Link variant="body2" onClick={() => onCancel && onCancel()}>
                    הישאר אנונימי
                </Link>
            </HBox>
        </div>

    );
}