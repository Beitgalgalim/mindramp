
const Button = ({ caption, selected, onPress }: { caption: string, selected?: boolean, onPress: CallableFunction }) => {
    return <div style={{
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
        onClick={(e) => onPress(e)}>{caption}</div>
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
                caption={btn.caption}
                selected={props.currentNavigation === i}
                onPress={() => props.onNavigate(i)}
            />))
        }
    </div>
}