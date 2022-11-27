import { Colors, Design } from './theme';
import { Button, TextField, Checkbox, FormControlLabel, Grid, Badge } from '@mui/material';
import { Avatar, ComboBox, HBox, HBoxSB, Spacer, Text, } from './elem';
import { EditUserProps, Role, RoleRecord, Roles } from './types';
import { useEffect, useRef, useState, Fragment } from 'react';
import { UserType, UserInfo } from './types';
import * as api from "./api";
import { BadgeOutlined, ContactMail, ContactMailOutlined, Email, Password, PersonAddOutlined, PersonOff, PersonOutlined, PersonRemoveAlt1Outlined, Phone } from '@mui/icons-material';
import { CircularProgress } from '@material-ui/core';
import { hasRole } from './utils/common';

export default function EditUser({ user, userInfo, afterSaved, notify, roles, roleRecords }: EditUserProps) {
    const inputEl = useRef<HTMLInputElement | null>(null);
    const [preview, setPreview] = useState<string | undefined>(userInfo.avatar?.url);
    const [fname, setFName] = useState<string>(userInfo.fname);
    const [lname, setLName] = useState<string>(userInfo.lname);
    const [phone, setPhone] = useState<string | undefined>(userInfo.phone);
    const [email, setEmail] = useState<string>(userInfo._ref?.id || "");
    const [pwd1, setPwd1] = useState<string>("");
    const [pwd2, setPwd2] = useState<string>("");
    const [showInKiosk, setShowInKiosk] = useState<boolean>(userInfo.showInKiosk === true);
    const [type, setType] = useState<UserType>(userInfo.type);
    const [dirty, setDirty] = useState<boolean>(false);
    const [updateInProgress, setUpdateInProgress] = useState<boolean>(false);
    const stopUpdateInProgress = () => setUpdateInProgress(false);
    const [localRoles, setLocalRoles] = useState<string[]>([]);
    const [implicitRoles, setImplicitRoles] = useState<string[]>([]);

    useEffect(() => {
        setEmail(userInfo._ref?.id || "");
    }, [userInfo, userInfo._ref]);

    useEffect(() => {
        setLocalRoles(roleRecords.filter(rr => rr.members.includes(email)).map(rr => rr.id));
    }, [email]);

    useEffect(() => {
        const impRoles: string[] = [];
        const recursiveAssignRole = (role: string) => {
            impRoles.push(role);
            const roleRec = roleRecords.find(rr => rr.id === role);
            roleRec?.assignRoles?.forEach(ar => {
                if (!impRoles.includes(ar)) {
                    recursiveAssignRole(ar);
                }
            });
        }

        localRoles.forEach(role => {
            if (!impRoles.includes(role)) {
                recursiveAssignRole(role);
            }
        });
        setImplicitRoles(impRoles)
    }, [localRoles, roleRecords]);

    function handleRoleChange(role: string, hasRole: boolean) {
        if (hasRole) {
            setLocalRoles(prev => !prev?.includes(role) ? [...prev, role] : prev);
        } else {
            setLocalRoles(prev => prev?.filter(r => r !== role));
        }
    }

    function handleRoleChangeEvent(e: any, role: string) {
        let hasRole: boolean = (e.target.checked);
        handleRoleChange(role, hasRole);
        setDirty(true);
    }

    function handleTypeChange(key: string) {
        setType(parseInt(key));

        // if this is a technical user to be a kiosk user, assigns the role kiosk to it.
        handleRoleChange(Roles.Kiosk, parseInt(key) === UserType.KIOSK);

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
        setEmail(n.currentTarget.value.toLowerCase());
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

    function handleShowInKioskChange(e: any) {
        let res: boolean = (e.target.checked);
        setShowInKiosk(res);
        setDirty(true);
    }

    function onDelete() {
        notify.ask("האם למחוק משתמש " + userInfo.fname + " " + userInfo.lname + " (" + userInfo._ref?.id + ")", "מחיקת משתמש", [
            {
                caption: "מחק",
                callback: () => {
                    if (userInfo._ref) {
                        setUpdateInProgress(true);
                        api.deleteUser(userInfo._ref.id, userInfo).finally(() => {
                            setUpdateInProgress(false);
                            afterSaved();
                        });
                    }
                }
            },
            {
                caption: "בטל",
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
        if (showInKiosk) {
            updatedUserInfo.showInKiosk = true;
        }

        // exist guide
        if (userInfo._ref) {
            setUpdateInProgress(true);
            api.editUser(userInfo._ref, (files && files.length) ? files[0] : null, preview, updatedUserInfo, localRoles).then(() => {
                notify.success("נשמר בהצלחה")
                afterSaved();
            },
                (err) => notify.error(err.message, "שמירה נכשלה")
            ).finally(stopUpdateInProgress);
        } else {
            if (email.trim().length == 0) {
                notify.error("חסר אימייל");
                return;
            }
            const pic = files && files.length > 0 ? files[0] : undefined;
            if (pwd1.trim().length < 5) {
                notify.error("סיסמא קצרה מ 6 תווים");
                return;
            }

            if (pwd1 !== pwd2) {
                notify.error("סיסמא לא תואמת בשני השדות");
                return;
            }
            setUpdateInProgress(true);
            api.addUser(updatedUserInfo, localRoles, email, pwd1, pic).then(
                () => {
                    notify.success("נשמר בהצלחה")
                    afterSaved();
                },
                (err) => {
                    notify.error(err.message, "שמירה נכשלה");
                }
            ).finally(stopUpdateInProgress);
        }
    }

    return (<div className="edit-user-container">
        {updateInProgress && <div className="event-center-progress">
            <CircularProgress />
        </div>}

        <Grid container spacing={1} style={{
        }}>
            <Grid item xs={12}>
                <h2>{userInfo._ref ? "עריכת פרטי משתמש" : "משתמש חדש"} </h2>
            </Grid>
            <Spacer height={20} />

            <Grid container spacing={2} style={{ textAlign: "right" }}>
                <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }} >
                    <ContactMailOutlined />
                </Grid>
                <Grid container item xs={9} spacing={2} style={{ direction: "ltr" }}>
                    <TextField variant="standard" helperText="אימייל"
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
                        helperText="סיסמא" value={pwd1}
                        onChange={(e) => setPwd1(e.currentTarget.value)} />
                </Grid>
                <Grid item xs={5}>
                    <TextField
                        variant="standard" type="password"
                        autoComplete="new-password"
                        helperText="סיסמא בשנית" value={pwd2}
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
                    <TextField variant="standard" helperText="שם פרטי" value={fname} onChange={onFNameChange} />
                </Grid>

                <Grid item xs={5}>
                    <TextField variant="standard" helperText="שם משפחה" value={lname} onChange={onLNameChange} />
                </Grid>
            </Grid>
            <Spacer height={20} />

            <Grid container spacing={2} style={{ textAlign: "right" }}>
                <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }} >
                    <Phone />
                </Grid>
                <Grid item xs={5}>
                    <TextField variant="standard" helperText="טלפון" value={phone || ""} onChange={onPhoneChange} />
                </Grid>

            </Grid>
            <Spacer height={20} />


            <Grid container spacing={2} style={{ textAlign: "right" }}>
                <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }} >
                    <PersonOutlined />
                </Grid>
                <Grid item xs={2} style={{ alignItems: "center" }}>
                    {preview ? <Avatar imageSrc={preview} size={48} /> : <PersonOff style={{ fontSize: 48 }} />}
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
                    <ComboBox
                        style={{
                            width: 150,
                            textAlign: "right",
                        }}
                        itemHeight={35}
                        listWidth={150}
                        hideExpandButton={false}
                        placeholder={"תפקיד"}
                        items={[
                            { value: "משתתף.ת", key: UserType.PARTICIPANT.toString() },
                            { value: "מדריך.ה", key: UserType.GUIDE.toString() },
                            { value: "עמדה משותפת", key: UserType.KIOSK.toString() }
                        ]}
                        value={type.toString()}
                        onSelect={handleTypeChange}
                        readOnly={true}
                    //onChange={(locationKey: string) => setSelectedLocation(locationKey)}
                    />
                </Grid>
            </Grid>
            <Spacer height={25} />
            <div className="permission-container">
                <div >הרשאות</div>
                {
                    roleRecords.filter(rr => rr.id !== Roles.Kiosk).map(rr => {
                        let checked = localRoles.includes(rr.id) || implicitRoles.includes(rr.id);
                        let disabled = implicitRoles.includes(rr.id) && !localRoles.includes(rr.id);

                        // Prevent a user admin to provide any permission he/she does not have
                        let disabledPreventPermissionElevation = !roles.some(role => role.id == rr.id);

                        // Prevent admin to lose its admin permission
                        let disableAdminForHimself = (user === email && rr.id === Roles.Admin && roles.some(role => role.id == Roles.Admin));

                        return (<div className="permission-item">
                            <FormControlLabel control={<Checkbox disabled={disabled || disabledPreventPermissionElevation || disableAdminForHimself}
                                checked={checked} onChange={(e) => handleRoleChangeEvent(e, rr.id)} />} label={rr.displayName} />
                            <div className="permission-desc">{rr.description}</div>
                        </div>)
                    })
                }
            </div >

            <Grid container spacing={2} style={{ textAlign: "right" }}>
                <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }} >
                </Grid>
                <Grid item xs={6} style={{ alignItems: "right" }}>
                    <FormControlLabel control={<Checkbox checked={showInKiosk} onChange={handleShowInKioskChange} />} label="הצג בעמדה משותפת" />
                </Grid>
            </Grid>


            <Spacer height={20} />



            <Grid item xs={12}>
                <Button variant="contained" onClick={onSave} disabled={!dirty || !hasRole(roles, Roles.UserAdmin) || updateInProgress}>שמור</Button>
                {userInfo._ref && <Button variant="contained" disabled={!hasRole(roles, Roles.UserAdmin) || updateInProgress} onClick={onDelete}>מחיקה</Button>}

                <Button variant="contained" onClick={afterSaved}>ביטול</Button>
            </Grid>
        </Grid >
    </div >);
}