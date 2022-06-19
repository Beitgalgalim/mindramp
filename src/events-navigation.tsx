
const Button = ({ caption, selected, badge, onPress }: 
    { caption: string, selected?: boolean, badge:number, onPress: CallableFunction }) => {
    return <div style={{
        position:"relative",
        backgroundColor: selected ? "#337F5B" : "#DEE6EA",
        borderRadius: 40,
        width: "25vw",
        height: 46,
        color: selected ? "white" : "#495D68",
        //fontFamily: "Assistant",
        //fontWeight: 700,
        fontSize: "0.8em",
        lineHeight: "2.2em",
        textAlign: "center",
    }}
        onClick={(e) => onPress(e)}>
            {badge > 0 &&
                    <div style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        backgroundColor: "red",
                        color:"white",
                        fontSize:"0.9rem",
                        lineHeight:"0.8rem",
                        width: 16,
                        height: 16, 
                        borderRadius: 8,
                        zIndex:1000,
                    }}
                    >{badge}</div>
                }
            {caption}
        </div>
}

export default function EventsNavigation(props: any) {
    return <div style={{
        height: props.height,
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center",
        width: "100%",

    }}>
        {
            props.buttons.map((btn: any, i: number) => (<Button
                key={i}
                caption={btn.caption}
                badge={btn.badge}
                selected={props.currentNavigation === i}
                onPress={() => props.onNavigate(i)}
            />))
        }
    </div>
}