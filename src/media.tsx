import { useCallback, useMemo, useRef, useState } from 'react';
import { MediaProps, MediaResource } from './types';

import { Text, HBox, HBoxC, Spacer, FloatingAdd } from './elem';
import * as api from './api'
import "./admin.css"
import EditImage from './edit-image';
import { Add } from '@mui/icons-material';
import { Fab } from '@mui/material';


export default function Media({ media, notify, reload }: MediaProps) {

    const [editedImage, setEditedImage] = useState<MediaResource | undefined>(undefined);
    const _save = useCallback((imageInfo: MediaResource, file?: File) => {
        if (!imageInfo._ref && file) {
            //const keywords = imageInfo.keywords?.map(keyWord => { return keyWord.text} )
            api.addMedia(imageInfo.name, "photo", imageInfo.keywords, file).then(
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

    const _delete = useCallback((imageInfo: MediaResource) => {
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

    function getNewImageInfo(): MediaResource {
        return {
            name: "",
            url: "",
            path: "",
            type: "photo",
        }
    }

    if (editedImage)
        return <EditImage imageInfo={editedImage}
            onSave={(imageInfo: MediaResource, file?: File) => _save(imageInfo, file)}
            onDelete={(imageInfo: MediaResource) => _delete(imageInfo)}
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
        <FloatingAdd onClick={() => setEditedImage(getNewImageInfo()) } />

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
