import { Text } from './elem';
const logo = require("./logo-small.png");


export default function EventsHeader(props: any) {
    return <div style={{
        height: props.height,
        fontSize: 32,
        color: "white",
        display:"flex",
        justifyContent:"center",
        alignItems:"center",
        marginRight:15,marginLeft:15,
    }}>
        <Text>הי מרטין, בוקר טוב :)</Text>
        
        <img 
        src={logo} 
        style={{ height: 60, borderRadius:7}}
        onClick={() => {}} 
        alt={"לוגו של בית הגלגלים"} 
        aria-hidden="true" />
    </div>
}