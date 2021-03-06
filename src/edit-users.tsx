import { Colors, Design } from './theme';
import { Button, TextField, Checkbox, FormControlLabel, Grid, Badge } from '@mui/material';
import { Avatar, HBox, HBoxSB, Spacer, } from './elem';
import { EditUserProps } from './types';
import { useEffect, useRef, useState, Fragment } from 'react';
import { UserType, UserInfo } from './types';
import * as api from "./api";
import { BadgeOutlined, ContactMail, ContactMailOutlined, Email, Password, PersonAddOutlined, PersonOff, PersonOutlined, PersonRemoveAlt1Outlined, Phone } from '@mui/icons-material';

export default function EditUser({ userInfo, afterSaved, notify }: EditUserProps) {
    const inputEl = useRef<HTMLInputElement | null>(null);
    const [preview, setPreview] = useState<string | undefined>(userInfo.avatar?.url);
    const [fname, setFName] = useState<string>(userInfo.fname);
    const [lname, setLName] = useState<string>(userInfo.lname);
    const [phone, setPhone] = useState<string | undefined>(userInfo.phone);
    const [email, setEmail] = useState<string>(userInfo._ref?.id || "");
    const [pwd1, setPwd1] = useState<string>("");
    const [pwd2, setPwd2] = useState<string>("");
    const [admin, setAdmin] = useState<boolean>(false);
    const [type, setType] = useState<UserType>(userInfo.type);
    const [dirty, setDirty] = useState<boolean>(false);
    const [adminInDB, setadminInDB] = useState<boolean>(false);

    useEffect(() => {
        api.isUserAdmin(userInfo).then(res => {
            setAdmin(res);
            setadminInDB(res);
        });

        setEmail(userInfo._ref?.id || "");
    }, [userInfo, userInfo._ref]);

    function handleAdminChange(e: any) {
        let res: boolean = (e.target.checked);
        setAdmin(res);
        setDirty(true);
    }

    function handleTypeChange(e: any) {
        if (e.target.checked) {
            setType(UserType.GUIDE);
        } else {
            setType(UserType.PARTICIPANT);
        }
        setDirty(true);
    }

    function onSelectedFile(f: any) {
        if (!f.target.files || f.target.files.length === 0) {
            setPreview(undefined);
        } else {
            const objectUrl = URL.createObjectURL(f.target.files[0]);
            setPreview(objectUrl);
        }
        setDirty(true);

    }

    function onEmailChange(n: any) {
        setEmail(n.currentTarget.value);
        setDirty(true);

    }

    function onPhoneChange(n: any) {
        setPhone(n.currentTarget.value);
        setDirty(true);

    }

    function onFNameChange(n: any) {
        setFName(n.currentTarget.value);
        setDirty(true);

    }

    function onLNameChange(n: any) {
        setLName(n.currentTarget.value);
        setDirty(true);

    }

    function onDelete() {
        notify.ask("?????? ?????????? ?????????? " + userInfo.fname + " " + userInfo.lname + " (" + userInfo._ref?.id + ")", "?????????? ??????????", [
            {
                caption: "??????",
                callback: () => {
                    if (userInfo._ref) {
                        api.deleteDocWithMedia(userInfo?.avatar?.path, userInfo._ref).finally(() => afterSaved());
                    }
                }
            },
            {
                caption: "??????",
                callback: () => { }
            }
        ]
        )
    }

    function onSave() {
        const files = inputEl?.current?.files;
        let updatedUserInfo: UserInfo = {
            fname: fname,
            lname: lname,
            phone,
            displayName: userInfo.displayName,
            avatar: userInfo.avatar,
            type: type,
        };

        // exist guide
        if (userInfo._ref) {
            api.editUser(userInfo._ref, (files && files.length) ? files[0] : null, preview, updatedUserInfo, admin).then(() => {
                notify.success("???????? ????????????")
                afterSaved();
            },
                (err) => notify.error(err.message, "?????????? ??????????")
            );
        } else {
            if (email.trim().length == 0) {
                notify.error("?????? ????????????");
                return;
            }
            const pic = files && files.length > 0 ? files[0] : undefined;
            if (pwd1.trim().length < 5) {
                notify.error("?????????? ???????? ?? 6 ??????????");
                return;
            }

            if (pwd1 !== pwd2) {
                notify.error("?????????? ???? ?????????? ???????? ??????????");
                return;
            }

            api.addUser(updatedUserInfo, admin, email, pwd1, pic).then(
                () => {
                    notify.success("???????? ????????????")
                    afterSaved();
                },
                (err) => {
                    notify.error(err.message, "?????????? ??????????");
                }
            );
        }
    }

    return (<div className="edit-user-container">
        <Grid container spacing={1} style={{
        }}>
            <Grid item xs={12}>
                <h2>{userInfo._ref ? "?????????? ???????? ??????????" : "?????????? ??????"} </h2>
            </Grid>
            <Spacer height={20} />

            <Grid container spacing={2} style={{ textAlign: "right" }}>
                <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }} >
                    <ContactMailOutlined />
                </Grid>
                <Grid container item xs={9} spacing={2} >
                    <TextField variant="standard" helperText="????????????"
                        type="email"
                        value={email}
                        autoComplete="new-email"
                        fullWidth
                        disabled={userInfo._ref !== undefined}
                        onChange={onEmailChange} />
                </Grid>
            </Grid>
            <Spacer height={20} />

            {!userInfo._ref && <Grid container spacing={2} style={{ textAlign: "right" }}>
                <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }} >
                    <Password />
                </Grid>

                <Grid item xs={5}>
                    <TextField
                        variant="standard" type="password"

                        autoComplete="new-password"
                        helperText="??????????" value={pwd1}
                        onChange={(e) => setPwd1(e.currentTarget.value)} />
                </Grid>
                <Grid item xs={5}>
                    <TextField
                        variant="standard" type="password"
                        autoComplete="new-password"
                        helperText="?????????? ??????????" value={pwd2}
                        onChange={(e) => setPwd2(e.currentTarget.value)} />
                </Grid>
            </Grid>
            }
            {!userInfo._ref && <Spacer height={20} />}

            <Grid container spacing={2} style={{ textAlign: "right" }}>
                <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }} >
                    <BadgeOutlined />
                </Grid>
                <Grid item xs={5}>
                    <TextField variant="standard" helperText="???? ????????" value={fname} onChange={onFNameChange} />
                </Grid>

                <Grid item xs={5}>
                    <TextField variant="standard" helperText="???? ??????????" value={lname} onChange={onLNameChange} />
                </Grid>
            </Grid>
            <Spacer height={20} />

            <Grid container spacing={2} style={{ textAlign: "right" }}>
                <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }} >
                    <Phone />
                </Grid>
                <Grid item xs={5}>
                    <TextField variant="standard" helperText="??????????" value={phone || ""} onChange={onPhoneChange} />
                </Grid>

            </Grid>
            <Spacer height={20} />


            <Grid container spacing={2} style={{ textAlign: "right" }}>
                <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }} >
                    <PersonOutlined />
                </Grid>
                <Grid item xs={2} style={{ alignItems: "center" }}>
                    {preview? <Avatar imageSrc={preview} size={48} />: <PersonOff style={{fontSize:48}} />}
                </Grid>
                <Grid item xs={3} style={{ alignItems: "center" }}>
                    <HBox>
                        <PersonAddOutlined style={{ fontSize: 35 }}
                            onClick={() => inputEl?.current?.click()} />
                        <Spacer width={10} />
                        <PersonRemoveAlt1Outlined style={{ fontSize: 35 }}
                            onClick={() => {
                                setPreview(undefined)
                                setDirty(true);
                            }} />
                    </HBox>
                </Grid>

            </Grid>
            <input className="custom-file-input" type="file" ref={inputEl} style={{ visibility: "hidden" }} onChange={onSelectedFile} />
            <Spacer height={20} />


            <Grid container spacing={2} style={{ textAlign: "right" }}>
                <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }} >
                </Grid>
                <Grid item xs={6} style={{ alignItems: "right" }}>
                    <FormControlLabel control={<Checkbox checked={type === UserType.GUIDE} onChange={handleTypeChange} />} label="??????????\??" />
                </Grid>
            </Grid>
            <Spacer height={10} />

            <Grid container spacing={2} style={{ textAlign: "right" }}>
                <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }} >
                </Grid>
                <Grid item xs={6} style={{ alignItems: "right" }}>
                    <FormControlLabel control={<Checkbox checked={admin} onChange={handleAdminChange} />} label="????????\?? ????????(??????????)" />
                </Grid>
            </Grid>

            <Spacer height={20} />



            <Grid item xs={12}>
                <Button variant="contained" onClick={onSave} disabled={!dirty}>????????</Button>
                {userInfo._ref && <Button variant="contained" onClick={onDelete}>??????????</Button>}

                <Button variant="contained" onClick={afterSaved}>??????????</Button>
            </Grid>
        </Grid>
    </div>);
}