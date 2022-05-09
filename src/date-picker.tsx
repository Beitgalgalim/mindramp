
import { useRef, useState } from 'react';

import { DatePickerProps } from "./types";
import { HBox, Spacer, ClickableText, ComboBox } from './elem';
import ReactDatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import { DateFormats, day2DayName, getTimes, MonthMap, replaceDatePreserveTime2, validTime } from './utils/date';

//const dayjs = require('dayjs');
import dayjs from './localDayJs'




const times = getTimes();

function getNiceDate(d: string): string {
    if (!d)
        return "";

    const djs = dayjs(d);
    let res = day2DayName[djs.day()] + ", " + MonthMap[djs.format("MMM")] + "-" + djs.format("DD");
    if (djs.year() !== dayjs().year()) {
        res += ", " + djs.year();
    }
    return res;
}

function getTime(d: string): string {
    if (!d)
        return "";

    const djs = dayjs(d);
    return djs.format(DateFormats.TIME_AM_PM);
}

function calcDiff(d: string, newTime: string) {
    if (!d) {
        return 0;
    }
    newTime = newTime.replace("am", " am");
    newTime = newTime.replace("pm", " pm");
    const newStart = dayjs(dayjs(d).format(DateFormats.DATE) + " " + newTime);
    return newStart.diff(dayjs(d), 'minutes', true);
}


export default function MyDatePicker({ start, end, setStart, setEnd, style }: DatePickerProps) {
    const [invalidStart, setInvalidStart] = useState(false);
    const [invalidEnd, setInvalidEnd] = useState(false);

    let datePicker = useRef<ReactDatePicker | null>(null);

    const setStartTime = (newTime: string) => {
        if (!validTime(newTime)) {
            setInvalidStart(true);
            return
        }
        setInvalidStart(false);

        const diffMin = calcDiff(start, newTime);
        if (diffMin !== 0) {
            setStart(dayjs(start).add(diffMin, "minutes").format(DateFormats.DATE_TIME));
            setEnd(dayjs(end).add(diffMin, "minutes").format(DateFormats.DATE_TIME));
        }
    }

    const setEndTime = (newTime: string) => {
        if (!validTime(newTime)) {
            setInvalidEnd(true);
            return
        }
        setInvalidEnd(false);

        const diffMin = calcDiff(end, newTime);
        if (diffMin !== 0) {
            setEnd(dayjs(end).add(diffMin, "minutes").format(DateFormats.DATE_TIME));
        }
    }

    const setDate = (newDate: string) => {
        setStart(replaceDatePreserveTime2(start, newDate));
        setEnd(replaceDatePreserveTime2(end, newDate));
    }

    return (
        <HBox style={style}>
            <div style={{ width: "35%" }}>
                <ReactDatePicker
                    ref={datePicker}

                    selected={dayjs(start).toDate()}
                    onChange={(d: Date) => setDate(dayjs(d).format(DateFormats.DATE))}
                    shouldCloseOnSelect={true}
                    customInput={
                        <ClickableText
                            onClick={() => datePicker?.current?.setOpen(true)}>
                            {getNiceDate(start)}
                        </ClickableText>
                    }
                />
            </div>
            <Spacer width={"5%"} />


            <ComboBox value={getTime(start)} items={times}
                style={{ width: "28%" }}
                onSelect={(newValue: string) => setStartTime(newValue)}
                onChange={(newValue: string) => setStartTime(newValue)}
                invalid={invalidStart} />
            <Spacer width={"2%"} />
            -
            <Spacer width={"2%"} />

            <ComboBox value={getTime(end)} items={getTimes(dayjs(start))}
                style={{ width: "28%" }}
                onSelect={(newValue: string) => setEndTime(newValue)}
                onChange={(newValue: string) => setEndTime(newValue)}
                invalid={invalidEnd} />

        </HBox>
    );
}