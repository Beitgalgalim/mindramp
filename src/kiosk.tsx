import { useState, useEffect, useRef, MutableRefObject, LegacyRef, forwardRef } from 'react';
import { PersonOutlined } from '@mui/icons-material';

import * as api from './api'
import { KioskProps, UserInfo } from './types';
import "./css/kiosk.css"
import { beep } from './utils/common';

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


const KioskPerson = forwardRef((props: any, ref: LegacyRef<HTMLButtonElement>) => {
    return <button ref={ref} className="kiosk-person"
        tab-marker={props["tab-marker"]}
        onClick={props.onPress} style={{ backgroundColor: hashForColor(props.name) }}
        onKeyDown={props.onKeyDown}
    >
        {props.icon ? <img className="kiosk-person-img" src={props.icon} /> : <PersonOutlined style={{ fontSize: 180 }} />}
        <span>{props.name}</span>
    </button>
});


export default function Kiosk({ onSelectUser }:
    KioskProps) {
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [focusIndex, setFocusIndex] = useState(0);
    const firstElemRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        api.getKioskUsers().then((users: UserInfo[]) => setUsers(users));
    }, []);
    const maxTabIndex = users.length - 1;

    return <div >
        <h1>יומן בית הגלגלים - בחירת משתמשים</h1>
        <div className="kiosk-container"
            onKeyDown={(e: any) => {
                if (e.key == "Tab" && !e.shiftKey) {
                    beep(200, 50, 40)
                    if (e.target.getAttribute("tab-marker") === "last") {
                        firstElemRef.current?.focus();
                        e.preventDefault();
                    }
                }
            }}
        >
            {users.map((user, i) => (<KioskPerson
                ref={i === 0 ? firstElemRef : undefined}
                key={i}
                name={user.fname + " " + user.lname}
                icon={user.avatar?.url}
                onPress={() => onSelectUser(user._ref?.id, user.avatar?.url)}
                tab-marker={i === users.length-1?"last":""}
            />))}
        </div>
    </div >
}