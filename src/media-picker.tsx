import { Modal, Spacer } from "./elem";
import { Design } from "./theme";
import { MediaResource } from "./types";
import { useState, useCallback } from 'react';
import './css/media-picker.css';
import { Checkbox } from "@mui/material";


export default function MediaPicker({ title, media, onSelect, onCancel }:
    { title: string, media: MediaResource[], onSelect: CallableFunction, onCancel: CallableFunction }) {
    const [filter, setFilter] = useState<string>("");
    const [showSystemOrigin, setShowSystemOrigin] = useState<boolean>(true);

    const doFilter = useCallback((mr:MediaResource) => {
        if (showSystemOrigin && mr.origin !== "system") return false;

        if (filter.length === 0 ) return true;

        return mr.name.includes(filter) ||  mr.keywords?.some(keyword => keyword.includes(filter));
    }, [filter, showSystemOrigin]);

    return (<Modal className="media-search-container" onClose={onCancel}>
        <div className="media-search-title">{title}</div>
        <div className="media-search">
            <div>סינון</div>
            <Spacer />
            <input className="media-search-input" autoFocus type="search" onChange={(e) => setFilter(e.target.value)} />
        </div>
        <div>
            <Checkbox checked={showSystemOrigin} onChange={(e) => setShowSystemOrigin(e.currentTarget.checked)} />
            תמונות מערכת
        </div>
        {media.filter(doFilter).map((m, i) => (<img key={i} src={m.url}
                style={{ width: Design.eventImageSize, height: Design.eventImageSize, padding: 10 }}
                alt={m.name}
                onClick={() => onSelect(m)}
            />))}
    </Modal>);
}