import { Close } from "@mui/icons-material";
import { Text } from "./elem";
import { Design } from "./theme";
import { MediaResource } from "./types";
import { useEffect, useState } from 'react';
import './css/media-picker.css';


export default function MediaPicker({ title, media, onSelect, onCancel }:
    { title:string, media: MediaResource[], onSelect: CallableFunction, onCancel: CallableFunction }) {
        const [filter, setFilter] = useState<string>("");
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
            <div className="media-search">
                <div>חיפוש</div>
                <input type="search" onChange={(e)=>setFilter(e.target.value)}/>
            </div>
            <Text textAlign="center" fontSize={30}>{title}</Text>
            { media.filter(m=>filter.length == 0 || m.keywords?.find(keyword => keyword.includes(filter)))
               .map((m, i) => (<img key={i} src={m.url} 
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