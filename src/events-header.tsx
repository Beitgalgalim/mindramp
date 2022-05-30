import { useEffect, useState } from 'react';
import {  Text } from './elem';
import { EventsHeaderProps } from './types';
const logo = require("./logo-small.png");

function useSingleAndDoubleClick(onDoubleClick: CallableFunction, onClick?: CallableFunction, delay = 250) {
    const [click, setClick] = useState<number>(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            // simple click
            if (click === 1 && onClick) onClick();
            setClick(0);
        }, delay);

        // the duration between this click and the previous one
        // is less than the value of delay = double-click
        if (click === 2) onDoubleClick();

        return () => clearTimeout(timer);

    }, [click, delay, onClick, onDoubleClick]);

    return () => setClick(prev => prev + 1);
}

export default function EventsHeader({user, onLogoDoubleClicked, nickName, showDateTime, height}: EventsHeaderProps) {

    const handleClick = useSingleAndDoubleClick(() => {
        // Double click
        onLogoDoubleClicked()
    }, undefined, 350);

    let headerMsg = nickName?.length > 0 ? "הי " + nickName : "";

    if (showDateTime) {
        const h = showDateTime.hour();
        if (headerMsg.length > 0) headerMsg += ", ";

        if (h > 6 && h < 12) {
            headerMsg += "בוקר טוב";
        } else if (h >= 12 && h <= 17) {
            headerMsg += "צהריים טובים";
        } else if (h > 17 && h < 21) {
            headerMsg += "ערב טוב";
        } else {
            headerMsg += "לילה טוב";
        }
    }

    return <div style={{
        height: height,
        fontSize: '1.9rem',
        fontWeight: 900,
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15, marginLeft: 15,
    }}>
        {
        user && <div style={{position:"absolute", right:3, top:3, width:12, height:12, borderRadius:7, 
            backgroundColor:"#00FF04", 
            //borderStyle:"solid", borderWidth:1, borderColor:"white"
            }}>

            </div>
            }
        <Text>{headerMsg}</Text>

        <img
            src={logo}
            style={{ height: 60, borderRadius: 7 }}
            onClick={handleClick}
            alt={"לוגו של בית הגלגלים"}
            aria-hidden="true" />

    </div>
}