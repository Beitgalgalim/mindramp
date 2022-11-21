import './css/event.css'
import {Text} from './elem'


export const NavButton = ({ caption, subCaption, selected, badge, onPress, tabMarker, kiosk }:
    { caption: string, 
        subCaption?:string,
        selected?: boolean, 
        badge: number, onPress: CallableFunction, tabMarker?: string, kiosk?: boolean }) => {
    return <button className={"event-nav-button" + (kiosk ? " kiosk-nav" : "")}
        tab-marker={tabMarker}
        style={{
            position: "relative",
            backgroundColor: selected ? "#4EB5D6" : "#DEE6EA",
            borderRadius: 40,
            width: "25vw",
            height: 46,
            color: selected ? "white" : "#495D68",
            //fontFamily: "Assistant",
            //fontWeight: 700,
            fontSize: "0.8em",
            lineHeight: "2.2em",
            textAlign: "center",
            margin:5

        }}
        onClick={(e) => onPress(e)}>
        {badge > 0 &&
            <div style={{
                position: "absolute",
                top: 0,
                right: 0,
                backgroundColor: "red",
                color: "white",
                fontSize: "0.9rem",
                lineHeight: "0.8rem",
                width: 16,
                height: 16,
                borderRadius: 8,
                zIndex: 1000,
            }}
            >{badge}</div>
        }
        <div className="nav-btn">
        {caption}
        
        </div>
    </button>
}

export default function EventsNavigationNew(props: any) {
    return <div style={{
        height: props.height,
        backgroundColor: props.backgroundColor || "white",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center",
        width: "100%",
        borderBottom:3,
        borderBottomColor:"lightgray",
        borderBottomStyle:"solid",
    }}>
        {
            props.buttons.map((btn: any, i: number) => (<NavButton
                kiosk={props.kiosk}
                key={i}
                caption={btn.caption}
                subCaption={btn.subCaption}
                badge={btn.badge}
                selected={props.currentNavigation === i}
                onPress={() => props.onNavigate(i)}
                tabMarker={i === props.buttons.length - 1 ? props.tabMarker : ""}
            />))
        }
    </div>
}