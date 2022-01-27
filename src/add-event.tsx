import React, { useState, useEffect } from 'react';
import { Button, TextField } from '@mui/material';
import { HBoxC, VBox, Text , Card} from './elem';
import { DateFormats } from './utils/date';
import DateFnsUtils from "@date-io/dayjs";

import {
    MuiPickersUtilsProvider,
    KeyboardDatePicker,

} from '@material-ui/pickers';

const dayjs = require('dayjs');

export default function AddEvent({ date, onSave, onCancel }: { date: Date, onSave: CallableFunction, onCancel: CallableFunction }) {
    const [newEvent, setNewEvent] = useState<Date | null | undefined>(undefined);
    const [inDate, setInDate] = useState<string>("");
    const [title, setTitle] = useState<string>("");
    const [start, setStart] = useState<string>("");
    const [end, setEnd] = useState<string>("");

    useEffect(() => {
        setInDate(dayjs(date).format(DateFormats.DATE));
    }, [date]);


    useEffect(() => {
        setStart(dayjs(inDate).format(DateFormats.DATE) + "T08:00");
        setEnd(dayjs(inDate).format(DateFormats.DATE) + "T09:00");
    }, [inDate]);

    return (
        <div dir="rtl" style={{ position: 'absolute', bottom: 0, height: 150, width: '100%', backgroundColor:'white',zIndex:500 }}>
            <Card>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <HBoxC>
                    <Button variant="outlined" onClick={() => {
                        onSave(
                            {
                                date: dayjs(date).format(DateFormats.DATE),
                                title,
                                start,
                                end,
                            });
                    }}>שמור</Button>
                    <Button variant="outlined" onClick={() => onCancel()} >בטל</Button>

                </HBoxC>
                <VBox>
                    <Text fontSize={12}>{dayjs(inDate).format(DateFormats.DATE)}</Text>
                    <KeyboardDatePicker
                        InputProps={{
                            disableUnderline: true,

                        }}
                        style={{ width: 0, right: 20 }}
                        // labelFunc={(value, errString)=>getNiceDate(value)}

                        margin="dense"
                        variant="inline"
                        autoOk
                        format={"yyyy-MM-dd"}
                        value={inDate}
                        onChange={(d: any) => setInDate(dayjs(d).format(DateFormats.DATE))}
                    />
                </VBox>
                <TextField variant="outlined" label={'תיאור'} onChange={(e => setTitle(e.currentTarget.value))} value={title} />
            </MuiPickersUtilsProvider>
            </Card>
        </div>
    );
}