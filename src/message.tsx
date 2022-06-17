import { MarkEmailRead, StarRate } from "@mui/icons-material";
import { Spacer, Text, UnRead } from "./elem";
import { Design } from "./theme";
import { MessageProps } from "./types";


export default function Message({ msg, onSetRead }: MessageProps) {
    return <div style={{
        flex: "0 0 auto",
        position: "relative",
        //width: (isSingle ? width : width * 0.7) - 48,
        //width: (isSingle ? widthPixels : widthPixels * 0.7) - 48,
        height: Design.messageHeight,
        background: "white",
        borderRadius: 10,
        marginRight: 24,
        marginLeft: 24,
        marginBottom: 30,
        marginTop: 1,
        boxShadow: Design.boxShadow,
    }}>
        {/**unread */
            msg.unread && <UnRead onSetRead={onSetRead} />
        }

        <Text fontSize="1em" textAlign={"center"}>{msg.title}</Text>
        <Spacer Height={10}/>
        <Text fontSize="0.7em" textAlign={"center"}>{msg.body}</Text>
    </div>;
}