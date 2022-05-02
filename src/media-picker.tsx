import { Close } from "@mui/icons-material";
import { Text } from "./elem";
import { Design } from "./theme";
import { MediaResource } from "./types";


export default function MediaPicker({ media, onSelect, onCancel }:
    { media: MediaResource[], onSelect: CallableFunction, onCancel: CallableFunction }) {



    return (
        <div style={{
            display: "flex", flexWrap: "wrap",
            position: 'absolute', top: "10vh",
             right: "15vw", left: "15vw",
             maxHeight:"75vh",
            borderRadius: 10,
            backgroundColor: 'lightgray',
            zIndex: 501,
            overflow:"scroll",
            padding: 10
        }}>
            <Text textAlign="center" fontSize={30}>בחירת תמונה</Text>
            {media.map((m, i) => (<img key={i} src={m.url} 
                style={{ width: Design.eventImageSize, height: Design.eventImageSize, padding: 10 }}
                alt={m.name}
                onClick={() => onSelect(m)}
            />))}
            <div style={{ position: 'absolute', top: "1%", left: "1%" }}>
                <Close onClick={() => onCancel()} style={{fontSize:30}}/>
            </div>
        </div>

    );
}