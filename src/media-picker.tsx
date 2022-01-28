import { Box, Button, Modal } from "@material-ui/core";
import { Dialog } from "@mui/material";
import { Spacer } from "./elem";
import { MediaResource } from "./types";


export default function MediaPicker({ media, onSelect, onCancel }:
    { media: MediaResource[], onSelect: CallableFunction, onCancel: CallableFunction }) {

   

    return (
        <div style={{
            display: "flex", flexWrap: "wrap",
            position: 'absolute', top: "10%", width: "60%", left: "10%", height: "80%",
            borderRadius: 10,
            backgroundColor: 'lightgray', zIndex: 1000,
            padding:50
        }}>
            {media.map((m, i) => ([<img key={i} src={m.url} style={{ width: 25, height: 25 }}
                onClick={() => onSelect(m)}
            />, <Spacer key={i + "s"} />]))}
            <div style={{ position: 'absolute', top: "1%", left: "1%" }}>
                <Button onClick={() => onCancel()}>בטל</Button>
            </div>
        </div>

    );
}