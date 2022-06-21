import { Colors, Design } from './theme';
import { Text, Spacer } from './elem';
import { Button, TextField, Checkbox, FormControlLabel } from '@mui/material';
import { EditGuideInfoProps } from './types';
import { useRef, useState } from 'react';
import { UserType, UserInfo } from './types';
import * as api from "./api";

export default function EditGuideInfo({guide_info, afterSaved} : EditGuideInfoProps) {
    const inputEl = useRef<HTMLInputElement | null>(null);
    const [preview, setPreview] = useState<string|undefined>(guide_info.avatar?.url);
    const [fname, setFName] = useState<string>(guide_info.fname);
    const [lname, setLName] = useState<string>(guide_info.lname);
    const [email, setEmail] = useState<string>(guide_info._ref ? guide_info._ref.id : "");
    const [admin, setAdmin] = useState<boolean>(false);
    const [read_DB_once, setReadDBOnce] =  useState<boolean>(false);
    const [type, setType] = useState<UserType>(guide_info.type);
    const [adminInDB, setadminInDB] =  useState<boolean>(false);

    if (!read_DB_once) {
        console.log("read admin state");
        setReadDBOnce(true);
        api.isUserAdmin(guide_info).then(res => {
            setAdmin(res);
            setadminInDB(res);
        });
    }

    function handleAdminChange(e : any) {
        let res:boolean = (e.target.checked);
        setAdmin(res);
    }

    function handleTypeChange(e : any) {
        if (e.target.checked){
            setType(UserType.GUIDE);
        } else {
            setType(UserType.PARTICIPANT);
        }
       
    }
    function onSelectedFile(f : any) {
        if(!f.target.files || f.target.files.length === 0){
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
        if (guide_info._ref)
            api.deleteMedia(guide_info.avatar.path, guide_info._ref).finally(()=> afterSaved());
    }

    function onSave() {
        const files = inputEl?.current?.files;
        let updatedUserInfo : UserInfo = {
            fname: fname,
            lname: lname,
            displayName: guide_info.displayName,
            avatar: guide_info.avatar,
            type: type,
        };
        
        // exist guide
        if (guide_info._ref) {
            if ((files && files.length) || updatedUserInfo.fname !== guide_info.fname || updatedUserInfo.lname !== guide_info.lname || 
                updatedUserInfo.type !== guide_info.type || adminInDB !== admin) {
                    api.editUserInfo(guide_info._ref, (files && files.length)? files[0] : null, updatedUserInfo, admin).then( () => { 
                        console.log(`משתמש עודכן בהצלחה`);
                        afterSaved();
                },
                (err)=>console.log(err)
                );
            } else {
               // console.log("it seems that nothing changed...");
            }
            return;
        }
        
        // new guide
        if(files && files.length > 0 && email.length) {
            api.addGuideInfo(updatedUserInfo, admin, email, files[0]).then(
                    () => { 
                        //console.log(`המדריך נוצר בהצלחה`);
                        afterSaved();
                    },
                    (err)=>console.log(err)
            );
        }
    }

    return (
        <div dir="rtl" style={{
            position: 'absolute',
            top: "10vh",
            left: "10vw",
            height: "85vh",
            width: '80vw',
            backgroundColor: Colors.PopupBackground,
            zIndex: 500,
            borderRadius: 15,
            boxShadow: Design.popUpboxShadow,
        }}>
            {guide_info._ref    ? <TextField variant="standard" helperText="אימייל" type="email" value={email} disabled />
                                : <TextField variant="standard" helperText="אימייל" type="email" value={email} onChange={onEmailChange} />}
            <TextField variant="standard" helperText="שם פרטי"  value={fname} onChange={onFNameChange} />
            <TextField variant="standard" helperText="שם משפחה"  value={lname} onChange={onLNameChange} />
            
            <Spacer width={30}/>

            <Text>תמונה של המנחה</Text>
            <input className="custom-file-input" type="file" ref={inputEl} style={{width:400}} onChange={onSelectedFile} />
            {inputEl && <img src={preview} style={{width:48}} alt={"אין תמונה"} />}

            <FormControlLabel control={<Checkbox checked={type === UserType.GUIDE} onChange={handleTypeChange}/>} label="מדריך" />
            {read_DB_once && <FormControlLabel control={<Checkbox checked={admin} onChange={handleAdminChange}/>} label="מנהל תוכן(אדמין)" />}

            <Spacer width={30}/>

            <Button variant="contained" onClick={onSave}>שמור</Button>
            {guide_info._ref && <Button variant="contained" onClick={onDelete}>מחיקה</Button> }
            <Button variant="contained" onClick={afterSaved}>ביטול</Button>
            </div>);
}