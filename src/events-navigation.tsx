
const Button = ({caption, selected, onPress}:{caption:string, selected?:boolean, onPress:CallableFunction})=> {
    return <div style={{
        backgroundColor: selected?"#337F5B":"#DEE6EA",
        borderRadius: 40,
        width: "25vw",
        height: 46,
        color: selected? "white":"#495D68",
        //fontFamily: "Assistant",
        //fontWeight: 700,
        fontSize: "1em",
        lineHeight: "1.8em",
        textAlign: "center",
    }} 
    onClick={(e)=>onPress(e)}>{caption}</div>
}

export default function EventsNavigation(props:any) {
    return <div style={{
        height: props.height,
        display:"flex",
        flexDirection: "row",
        justifyContent:"space-evenly",
        alignItems:"center",
        width:"100%",
        
    }}>
        <Button caption={"היום"} selected={props.currentNavigation === 0} onPress={()=>props.onNavigate(0)}/>
        <Button caption={"מחר"} selected={props.currentNavigation === 1} onPress={()=>props.onNavigate(1)}/>
        <Button caption={"מחרתיים"} selected={props.currentNavigation === 2} onPress={()=>props.onNavigate(2)}/>
    </div>
}