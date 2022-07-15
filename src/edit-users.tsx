import { Colors, Design } from './theme';
import { Avatar } from './elem';
import { Button, TextField, Checkbox, FormControlLabel, Grid } from '@mui/material';
import { EditUserProps } from './types';
import { useEffect, useRef, useState, Fragment } from 'react';
import { UserType, UserInfo } from './types';
import * as api from "./api";

export default function EditUser({ userInfo, afterSaved, notify }: EditUserProps) {
    const inputEl = useRef<HTMLInputElement | null>(null);
    const [preview, setPreview] = useState<string | undefined>(userInfo.avatar?.url);
    const [fname, setFName] = useState<string>(userInfo.fname);
    const [lname, setLName] = useState<string>(userInfo.lname);
    const [email, setEmail] = useState<string>(userInfo._ref?.id || "");
    const [pwd1, setPwd1] = useState<string>("");
    const [pwd2, setPwd2] = useState<string>("");
    const [admin, setAdmin] = useState<boolean>(false);
    const [type, setType] = useState<UserType>(userInfo.type);
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
    }

    function handleTypeChange(e: any) {
        if (e.target.checked) {
            setType(UserType.GUIDE);
        } else {
            setType(UserType.PARTICIPANT);
        }
    }

    function onSelectedFile(f: any) {
        if (!f.target.files || f.target.files.length === 0) {
            setPreview(undefined);
        }
        const objectUrl = URL.createObjectURL(f.target.files[0]);
        setPreview(objectUrl);

    }

    function onEmailChange(n: any) {
        setEmail(n.currentTarget.value);
    }

    function onFNameChange(n: any) {
        setFName(n.currentTarget.value);
    }

    function onLNameChange(n: any) {
        setLName(n.currentTarget.value);
    }

    function onDelete() {
        if (userInfo._ref && userInfo.avatar)
            api.deleteMedia(userInfo.avatar.path, userInfo._ref).finally(() => afterSaved());
    }

    function onSave() {
        const files = inputEl?.current?.files;
        let updatedUserInfo: UserInfo = {
            fname: fname,
            lname: lname,
            displayName: userInfo.displayName,
            avatar: userInfo.avatar,
            type: type,
        };

        // exist guide
        if (userInfo._ref) {
            if ((files && files.length) || updatedUserInfo.fname !== userInfo.fname || updatedUserInfo.lname !== userInfo.lname ||
                updatedUserInfo.type !== userInfo.type || adminInDB !== admin) {
                api.editUser(userInfo._ref, (files && files.length) ? files[0] : null, updatedUserInfo, admin).then(() => {
                    notify.success("נשמר בהצלחה")
                    afterSaved();
                },
                    (err) => notify.error(err.message, "שמירה נכשלה")
                );
            } else {
                // console.log("it seems that nothing changed...");
            }
            return;
        }

        // new guide
        if (email.length) {
            const pic = files && files.length > 0 ? files[0] : undefined;
            if (pwd1.trim().length < 5) {
                notify.error("סיסמא קצרה מ 6 תווים");
                return;
            }

            if (pwd1 !== pwd2) {
                notify.error("סיסמא לא תואמת בשני השדות");
                return;
            }

            api.addUser(updatedUserInfo, admin, email, pwd1, pic).then(
                () => {
                    notify.success("נשמר בהצלחה")
                    //console.log(`המדריך נוצר בהצלחה`);
                    afterSaved();
                },
                (err) => {
                    notify.error(err.message, "שמירה נכשלה");
                }
            );
        }
    }

    return (
        <Grid container spacing={1} style={{
            position: 'absolute',
            top: "10vh",
            left: "10vw",
            height: "85%",
            width: '70%',
            backgroundColor: Colors.PopupBackground,
            zIndex: 500,
            borderRadius: 15,
            boxShadow: Design.popUpboxShadow,
        }}>
            <Grid item xs={12}>
                <h2>{userInfo._ref ? "עריכת פרטי משתמש" : "משתמש חדש"} </h2>
            </Grid>
            <Grid item xs={12}>
                <TextField variant="standard" helperText="אימייל" type="email" value={email}
                    autoComplete="new-email" 
                    disabled={userInfo._ref !== undefined}
                    onChange={onEmailChange} />
            </Grid>
            <Grid item xs={12}>
                {!userInfo._ref &&
                    <Fragment>
                        <TextField 
                            variant="standard" type="password" 
                            
                            autoComplete="new-password" 
                            helperText="סיסמא" value={pwd1} 
                            onChange={(e) => setPwd1(e.currentTarget.value)} />
                        <TextField 
                        variant="standard" type="password" 
                        autoComplete="new-password" 
                        helperText="סיסמא בשנית" value={pwd2} 
                        onChange={(e) => setPwd2(e.currentTarget.value)} />
                    </Fragment>
                }
            </Grid>
            <Grid container>
                <Grid item xs={5}>
                    <TextField variant="standard" helperText="שם פרטי" value={fname} onChange={onFNameChange} />
                </Grid>
                <Grid item xs={2}/>
                <Grid item xs={5}>
                    <TextField variant="standard" helperText="שם משפחה" value={lname} onChange={onLNameChange} />
                </Grid>
            </Grid>
            <Grid item xs={12}>
                <FormControlLabel control={inputEl && <Avatar imageSrc={preview} size={48} />} label="תמונה" />
            </Grid>
            <Grid item xs={12}>
                    <input className="custom-file-input" type="file" ref={inputEl} style={{ width: 400 }} onChange={onSelectedFile} />
            </Grid>
            <Grid container>
                <Grid item xs={6}>
                    <FormControlLabel control={<Checkbox checked={type === UserType.GUIDE} onChange={handleTypeChange} />} label="מדריך\ה" />
                </Grid>
                <Grid item xs={6}>
                    <FormControlLabel control={<Checkbox checked={admin} onChange={handleAdminChange} />} label="מנהל\ת תוכן(אדמין)" />
                </Grid>
            </Grid>
            <Grid item xs={12}>
                <Button variant="contained" onClick={onSave}>שמור</Button>
                {userInfo._ref && <Button variant="contained" onClick={onDelete}>מחיקה</Button>}

                <Button variant="contained" onClick={afterSaved}>ביטול</Button>
            </Grid>
        </Grid>);
}