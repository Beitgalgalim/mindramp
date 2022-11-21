import './css/event.css'
import { NavButton } from './events-navigation'



const buttons = [{ caption: "א" }, { caption: "ב" }, { caption: "ג" }, { caption: "ד" },{ caption: "ה" },{ caption: "ו" },{ caption: "ש" }]

export default function EventsNavigationEx(props: any) {
    return <div style={{
        height: props.height,
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center",
        width: "100%",

    }}>
        {
            buttons.map((btn: any, i: number) => (<NavButton
                kiosk={false}
                key={i}
                caption={btn.caption}
                badge={btn.badge}
                selected={props.currentNavigation === i}
                onPress={() => props.onNavigate(i)}
                
            />))
        }
    </div>
}