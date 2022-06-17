import { red } from '@material-ui/core/colors';
import { NotificationsActive } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { Text } from './elem';
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

export default function EventsHeader({ user, onLogoDoubleClicked, nickName, showDateTime, height, centered,
    onNotificationClick, showingNotifications, newNotificationCount }: EventsHeaderProps) {

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
        fontSize: '1.7rem',
        fontWeight: 900,
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15, marginLeft: 15,
    }}>
        {
            // Connected sign
            user && <div style={{
                position: "absolute", left: 3, top: 3, width: 12, height: 12, borderRadius: 7,
                backgroundColor: "#00FF04",
            }} />
        }

        {
            /** Notifications */
            <div style={{
                position: "absolute", right: 0, top: 0, width: 50, height: 50,

            }} onClick={onNotificationClick}>
                {newNotificationCount > 0 &&
                    <div style={{
                        position: "absolute",
                        top: 0,
                        right: 10,
                        backgroundColor: "red",
                        fontSize:"0.9rem",
                        lineHeight:"0.8rem",
                        width: 16,
                        height: 16, 
                        borderRadius: 8,
                        zIndex:1000,
                    }}
                    >{newNotificationCount}</div>
                }
                <NotificationsActive style={{
                    borderRadius: 15,
                    padding: 2,
                    backgroundColor: showingNotifications ? "gray" : "transparent"
                }} />

            </div>
        }
        <Text textAlign={centered ? "center" : "right"}>{headerMsg}</Text>

        <img
            src={logo}
            style={{
                position: 'absolute',
                left: 15,
                height: 60, borderRadius: 7
            }}
            onClick={handleClick}
            alt={"לוגו של בית הגלגלים"}
            aria-hidden="true" />

    </div>
}