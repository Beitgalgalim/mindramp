import { Home, Notifications, NotificationsActive, NotificationsActiveRounded, NotificationsNone } from '@mui/icons-material';
import { Button } from '@mui/material';
import { useEffect, useState } from 'react';
import { Spacer, Text } from './elem';
import { EventsHeaderProps } from './types';
import { useNavigate } from "react-router-dom";
import { useLongPress } from 'use-long-press';
import './css/event.css'

const logo = require("./logo-small.png");

function useSingleAndDoubleClick(onDoubleClick: CallableFunction, onTripleClick?: CallableFunction, onClick?: CallableFunction, delay = 250) {
    const [click, setClick] = useState<number>(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            // simple click
            if (click === 1 && onClick) onClick();

            if (click === 3 && onTripleClick) {
                onTripleClick();
            }

            // the duration between this click and the previous one
            // is less than the value of delay = double-click
            if (click === 2) {
                onDoubleClick();
            }
            setClick(0);
        }, delay);

        return () => clearTimeout(timer);

    }, [click, delay, onClick, onDoubleClick]);

    return () => setClick(prev => prev + 1);
}

export default function EventsHeader({ user,
    avatarUrl,
    onLogoDoubleClicked,
    onLogoTripleClicked,
    nickName, showDateTime, height, centered,
    roles,
    isGuide,
    kioskMode,
    onGoHome,
    notificationOn,
    onNotificationClick, showingNotifications, newNotificationCount,
    firstElemRef,
    isTV,
}: EventsHeaderProps) {
    const navigate = useNavigate();

    const handleLongPress = useLongPress(() => {
        onLogoDoubleClicked();
    });

    const handleClick = useSingleAndDoubleClick(
        // Double click
        () => {
            onLogoDoubleClicked()
        },
        // Triple click
        () => {
            if (onLogoTripleClicked) {
                onLogoTripleClicked();
            }
        },
        undefined, 350);

    let headerMsg = "הי " + (nickName && nickName.length > 0 ? nickName : "אורח.ת");

    if (isTV && !(nickName && nickName.length > 0)) {
        headerMsg = "";
    }

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

    const NotificationIcon = showingNotifications ?
        Home : (
            notificationOn ?
                Notifications : Notifications);

    return <div className="main-header">

        {/* {
            // Connected sign
            user && <div style={{
                position: "absolute", left: 3, top: 3, width: 12, height: 12, borderRadius: 7,
                backgroundColor: "#00FF04",
            }} />
        } */}


        {/** Notifications */}
        <button
            className="event-notification-btn"
            ref={!kioskMode ? firstElemRef : undefined}
            onClick={onNotificationClick}
            tabIndex={kioskMode ? -1 : 0}
        >
            {newNotificationCount > 0 && !showingNotifications &&
                <div style={{
                    position: "absolute",
                    top: 3,
                    right: 4,
                    backgroundColor: "#D00C0C",
                    color:"white",
                    fontSize: "15px",
                    lineHeight: "18px",
                    fontWeight: 700,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    zIndex: 1000,
                }}
                >{newNotificationCount}</div>
            }
            <NotificationIcon
                style={{
                    width: 36, height: 36,
                    borderRadius: 18,
                    padding: 2,

                    color: "white",
                    //backgroundColor: showingNotifications ? "gray" : "transparent"
                }} />

        </button>

        <Text marginTop={30} textAlign={centered ? "center" : "right"}>{headerMsg}</Text>
        <div className="events-header-left">
            {kioskMode && <button
                ref={kioskMode && firstElemRef}
                className={"event-home-btn2 kiosk-nav"}
                aria-label="חזרה למסך בחירת משתמשים"
                onClick={() => onGoHome()}>
                <Home
                    style={{ fontSize: "inherit" }}
                /></button>}
            <Spacer width={10} />
            {kioskMode && avatarUrl && <img src={avatarUrl} className="events-header-avatar" />}
            <Spacer width={10} />
            <img
                {...handleLongPress}
                className="events-header-logo"
                src={logo}
                onClick={handleClick}
                alt={"לוגו של בית הגלגלים"}
                aria-hidden="true" />
        </div>
    </div>
}
