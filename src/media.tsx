import { useCallback, useMemo, useRef, useState } from 'react';
import { ImageInfo, MediaProps, MediaResource } from './types';

import { Text, HBox, HBoxC, Spacer } from './elem';
import * as api from './api'
import "./admin.css"
import EditImage from './edit-image';
import { Add } from '@mui/icons-material';
import { Fab } from '@mui/material';


export default function Media({ media, notify, reload }: MediaProps) {

    const [editedImage, setEditedImage] = useState<ImageInfo | undefined>(undefined);
    const _save = useCallback((imageInfo: ImageInfo, file?: File) => {
        if (!imageInfo._ref && file) {
            api.addMedia(imageInfo.name, "photo", file).then(
                (m: MediaResource) => {
                    notify.success(`תמונה עלתה בהצלחה`);
                    setEditedImage(undefined)
                    if (reload) reload();
                },
                (err) => notify.error(err)
            );
        } else if (imageInfo && imageInfo._ref) {
            api.updateMediaInfo(imageInfo).then(() => {
                notify.success(`תמונה עודכנה בהצלחה`);
                setEditedImage(undefined);
                if (reload) reload();
            })
        } else {
            notify.error('חובה לבחור קובץ');
        }
    }, []);

    const _delete = useCallback((imageInfo: ImageInfo) => {
        if (imageInfo._ref) {
            api.deleteDocWithMedia(imageInfo.path, imageInfo._ref).then(
                () => {
                    notify.success("נמחק בהצלחה");
                    setEditedImage(undefined);
                    if (reload) reload();
                },
                (err: Error) => notify.error(err.message)
            )
        }
    }, []);

    function getNewImageInfo(): ImageInfo {
        return {
            name: "",
            url: "",
            path: "",
            type: "photo",
        }
    }

    if (editedImage)
        return <EditImage imageInfo={editedImage}
            onSave={(imageInfo: ImageInfo, file?: File) => _save(imageInfo, file)}
            onDelete={(imageInfo: ImageInfo) => _delete(imageInfo)}
            onCancel={() => setEditedImage(undefined)}
            notify={notify} />;

    return (<div style={{
        display: "flex",
        flexDirection: "column",
        flexWrap: "nowrap",
        overflowY: "scroll",
        height: "100%",
        backgroundColor:"white"

    }}>
        <Fab
            color="primary" aria-label="הוסף"
            variant="circular"
            style={{
                position: "fixed",
                bottom: 60,
                right: 50,
                zIndex: 1000,
                borderRadius: '50%'
            }}
        >
            <Add onClick={() => { setEditedImage(getNewImageInfo()) }} />
        </Fab>


        {media.map((m, i) => (
            <div className="media-entry" key={i} onClick={() => setEditedImage(m)}>
                <Spacer />
                <img src={m.url} alt={m.name} />
                <Spacer />
                <Text width={"50vw"} textAlign="right">{m.name}</Text>
            </div>
        ))}
    </div>);
}
