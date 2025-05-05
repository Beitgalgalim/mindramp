import { useState, useEffect, useRef, MutableRefObject, LegacyRef, forwardRef } from 'react';
import { PersonOutlined } from '@mui/icons-material';

import * as api from './api'
import { KioskProps, UserInfo } from './types';
import "./css/kiosk.css"
import { beep, documentKioskKeyDown, handleKioskKeyDown } from './utils/common';

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
        tabIndex={props.ignoreTab ? -1 : undefined}
        tab-marker={props["tab-marker"]}
        onClick={props.onPress}
        style={{
            backgroundColor: hashForColor(props.name),
            width: props.width, height: props.height
        }}
        onKeyDown={props.onKeyDown}
    >
        {props.icon ? <img style={{ width: props.width - 70, height: props.height - 70 }} src={props.icon} /> :
            <PersonOutlined style={{ fontSize: props.height - 70 }} />}
        <span>{props.name}</span>
    </button>
});

function getNick(user: UserInfo) {
    return user.nickName ? user.nickName : (user.fname + " " + user.lname);
}

export default function Kiosk({ onSelectUser }:
    KioskProps) {
    const [users, setUsers] = useState<UserInfo[]>([]);
    const firstElemRef = useRef<HTMLButtonElement>(null);
    const [userAboutToEnter, setUserAboutToEnter] = useState<UserInfo | null>(null);

    useEffect(() => {
        api.getKioskUsers().then((users: UserInfo[]) => setUsers(users));
    }, []);

    useEffect(() => documentKioskKeyDown(firstElemRef, document), []);

    const usersArray = userAboutToEnter ? [userAboutToEnter] : users;

    const userEnterScale = Math.min(window.innerWidth, window.innerHeight);

    return <div>
        <h1>יומן בית הגלגלים - בחירת משתמשים</h1>
        <div>

            {userAboutToEnter && <button className="kiosk-btn-enter kiosk-enter"
                onClick={() => onSelectUser(userAboutToEnter._ref?.id, getNick(userAboutToEnter), userAboutToEnter.avatar?.url)}
                ref={firstElemRef} >הכנס</button>}
            {userAboutToEnter &&
                <button className="kiosk-btn-enter kiosk-cancel" onClick={() => setUserAboutToEnter(null)} tab-marker="last">בטל</button>
            }
            <div className="kiosk-container" style={{ height: userAboutToEnter ? "70vh" : "90vh" }}>
                {usersArray.map((user, i) => {

                    return (<KioskPerson
                        ref={i === 0 && !userAboutToEnter ? firstElemRef : undefined}
                        key={i}
                        ignoreTab={!!userAboutToEnter}
                        width={userAboutToEnter ? userEnterScale * .7 : 210}
                        height={userAboutToEnter ? userEnterScale * .7 : 210}
                        name={getNick(user)}
                        icon={user.avatar?.url}
                        //onPress={() => onSelectUser(user._ref?.id, nickName, user.avatar?.url)}
                        onPress={() => {
                            setUserAboutToEnter(user)
                            setTimeout(() => firstElemRef.current?.focus(), 50);
                        }}
                        tab-marker={i === users.length - 1 ? "last" : ""}
                    />)
                })}
            </div>


        </div>
    </div >
}