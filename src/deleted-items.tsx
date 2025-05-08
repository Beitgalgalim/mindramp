import { Close } from '@mui/icons-material';
import * as api from './api'
import './css/deleted-items.css'

import { useEffect, useState } from "react";
import dayjs from 'dayjs';
import { DeletedItemsProps } from './types';

export const DeletedItems = ({ onClose, onRefresh, notify }: DeletedItemsProps) => {
    const [deletedEvents, setDeletedEvents] = useState<{
        deleted: any[];
        series: any[];
    } | null>(null);
    const [revision, setRevision] = useState<number>(0);

    const [today] = useState(dayjs().format('YYYY-MM-DD'))

    useEffect(() => {
        const fetchDeletedEvents = async () => {
            const events = await api.getDeletedEvents();
            setDeletedEvents(events);
        };

        fetchDeletedEvents();
    }, [revision]);

    function restoreDeleted(rec: any, dateStr?: string) {
        notify.inProgress();
        api.restoreDeletedEvent(rec, dateStr)
            .then(() => {
                onRefresh();
                setRevision(prev => prev + 1);
                notify.success("אירוע שוחזר בהצלחה");
            })
            .catch(err => notify.error("שחזור נכשל", err))
    }

    const empty = deletedEvents?.deleted?.length == 0 && deletedEvents?.series?.length == 0;
    return (
        <div className="deleted-items-container">
            <div className="deleted-items-close-btn" onClick={onClose}><Close style={{ fontSize: 40 }} /></div>
            <h2>פגישות שנמחקו</h2>
            {empty && <div>אין פגישות שנמחקו לאחרונה</div>}
            {!empty && <div className="deleted-items-table">
                <div className="deleted-items-header-item">פגישה</div>
                <div className="deleted-items-header-item">תאריך</div>
                <div className="deleted-items-header-item">פעולות</div>
                {deletedEvents?.deleted.map((rec, index) => (
                    <>
                        <div className="row-item">{rec.event.title}</div>
                        <div className="row-item">{rec.event.date}</div>
                        <div className="row-item">
                            <button className="restore-button" onClick={() => restoreDeleted(rec)}>שחזר</button>
                        </div>
                    </>
                ))}

                {deletedEvents?.series.flatMap((rec, index) => {
                    // Get today's date in yyyy-mm-dd format


                    // Filter exclude dates that are after today
                    const futureExcludes = rec.event.recurrent?.exclude.filter((dateStr: string) => dateStr >= today);

                    // Return one row per future exclude
                    return futureExcludes?.map((excludeDate: string, i: number) => (
                        <>
                            <div className="row-item">{rec.event.title}</div>
                            <div className="row-item">{excludeDate}</div>
                            <div className="row-item">
                                <button className="restore-button" onClick={() => restoreDeleted(rec, excludeDate)}>שחזר</button>
                            </div>
                        </>
                    ));
                })}
            </div>}
        </div>
    );
};
