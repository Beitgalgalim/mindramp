import React from 'react'
import './css/event-navigation.css'


export const NavButton = ({ caption, isLast, selected, widthPercent, onPress, tabMarker, kiosk }:
    {
        caption: string,
        subCaption?: string,
        selected?: boolean,
        badge: number,
        isLast: boolean,
        onPress: CallableFunction, tabMarker?: string, kiosk?: boolean, widthPercent: number
    }) => {
    return <div style={{ display:"flex", width: widthPercent + "%", flexDirection:"row" }}>
        <button className={"event-nav-button2" + (kiosk ? " kiosk-nav" : "")}
            tab-marker={tabMarker}
            onClick={(e) => onPress(e)}>

            <div className="day-nav-button">
                {caption}
            </div>
            {selected && <div className="nav-underline" />}
        </button>
        {!isLast && <div className="horiz-seperator" />}
    </div>
}

export default function EventsNavigationNew(props: any) {
    return <div className="event-nav">
        {
            props.buttons.map((btn: any, i: number) => (
                <NavButton
                    key={i}
                    isLast={i == props.buttons.length - 1}
                    kiosk={props.kiosk}

                    widthPercent={btn.widthPercent}
                    caption={btn.caption}
                    subCaption={btn.subCaption}
                    badge={btn.badge}
                    selected={props.currentNavigation === i}
                    onPress={() => props.onNavigate(i)}
                    tabMarker={i === props.buttons.length - 1 ? props.tabMarker : ""}
                />

            ))
        }
    </div>
}