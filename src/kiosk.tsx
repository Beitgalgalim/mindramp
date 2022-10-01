import { useCallback, useState, useEffect } from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Link from '@material-ui/core/Link';
import { PersonOutlined } from '@mui/icons-material';
import Typography from '@material-ui/core/Typography';

import * as api from './api'
import { KioskProps, UserInfo } from './types';
import { HBox, Spacer, VBoxC } from './elem';
import { Checkbox, FormControlLabel } from '@mui/material';
import { Person } from './people-picker';
import "./css/kiosk.css"

// const colors = [
//     '#6DB1B9',
//     '#CAC7BC',
//     '#2D332F',
//     '#9BBFBF',
//     '#957D68',
//     '#60584B',
//     '#6D8071',
//     '#616F6F',
//     '#C2583A',
//     '#AABC9C',
// ]


function hashForColor(name: string) {
    let hash = 5381;
    for (var i = 0; i < name.length; i++) {
        hash = ((hash << 5) + hash) + name.charCodeAt(i); /* hash * 33 + c */
    }
    //return colors[hash % colors.length];

    var r = (hash & 0xFF0000) >> 16;
    var g = (hash & 0x00FF00) >> 8;
    var b = hash & 0x0000FF;
    return "#" + ("0" + r.toString(16)).substr(-2) + ("0" + g.toString(16)).substr(-2) + ("0" + b.toString(16)).substr(-2);
}


function KioskPerson(props: any) {
    return <button className="kiosk-person" onClick={props.onPress} style={{ backgroundColor: hashForColor(props.name) }}>
        {props.icon ? <img className="kiosk-person-img" src={props.icon} /> : <PersonOutlined style={{ fontSize: 180 }} />}
        <span>{props.name}</span>
    </button>
}


export default function Kiosk({ onSelectUser }:
    KioskProps) {
    const [users, setUsers] = useState<UserInfo[]>([]);

    useEffect(() => {
        api.getKioskUsers().then((users: UserInfo[]) => setUsers(users));
    }, []);

    return <div >
        <h1>יומן בית הגלגלים - בחירת משתמשים</h1>
        <div className="kiosk-container">
            {users.map((user, i) => (<KioskPerson
                key={i}
                name={user.fname + " " + user.lname}
                icon={user.avatar?.url}
                onPress={() => onSelectUser(user._ref?.id)}
            />))}
        </div>
    </div>
}