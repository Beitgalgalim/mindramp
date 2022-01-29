
import {  useRef } from 'react';

import { setDateFunc } from "./types";
import { HBox, Spacer, ClickableText, ComboBox } from './elem';
import ReactDatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import { DateFormats, getTimes } from './utils/date';

const dayjs = require('dayjs');


const MonthMap: { [id: string]: string; } = {
    Jan: "ינו",
    Feb: "פבר",
    Mar: "מרץ",
    Apr: "אפר",
    May: "מאי",
    Jun: "יוני",
    Jul: "יולי",
    Aug: "אוג",
    Sep: "ספט",
    Oct: "אוק",
    Nov: "נוב",
    Dec: "דצמ",
};

const day2DayName: { [id: number]: string; } = {
    0: "ראשון",
    1: "שני",
    2: "שלישי",
    3: "רביעי",
    4: "חמישי",
    5: "שישי",
    6: "שבת",
};

const times = getTimes();

function getNiceDate(d: Date | null | undefined): string {
    if (!d)
        return "";

    const djs = dayjs(d);
    let res = day2DayName[djs.day()] + ", " + MonthMap[djs.format("MMM")] + "-" + djs.format("DD");
    if (djs.year() !== dayjs().year()) {
        res += ", " + djs.year();
    }
    return res;
}

function getTime(d: Date | null | undefined): string {
    if (!d)
        return "";

    const djs = dayjs(d);
    return djs.format(DateFormats.TIME_AM_PM);
}

function calcDiff(d: Date | null | undefined, newTime: string) {
    if (!d) {
        return 0;
    }
    newTime = newTime.replace("am", " am");
    newTime = newTime.replace("pm", " pm");
    const newStart = dayjs(dayjs(d).format(DateFormats.DATE) + " " + newTime);
    return newStart.diff(d, 'min', true);
}


export default function MyDatePicker({ start, end, setStart, setEnd }:
    { start: Date | null | undefined, end: Date | null | undefined, setStart: setDateFunc, setEnd: setDateFunc }) {

    let datePicker = useRef<ReactDatePicker | null>(null);

    const setStartTime = (newTime: string) => {
        const diffMin = calcDiff(start, newTime);
        if (diffMin !== 0) {
            setStart(dayjs(start).add(diffMin, "min").toDate());
            setEnd(dayjs(end).add(diffMin, "min").toDate());
        }
    }

    const setEndTime = (newTime: string) => {
        const diffMin = calcDiff(end, newTime);
        if (diffMin !== 0) {
            setEnd(dayjs(end).add(diffMin, "min").toDate());
        }
    }

    return (
        <HBox>
            <ReactDatePicker
                ref={datePicker}
                selected={start}
                onChange={(d: any) => setStart(dayjs(d).toDate())}
                shouldCloseOnSelect={true}
                customInput={
                    <ClickableText
                        onClick={() => datePicker?.current?.setOpen(true)}>
                        {getNiceDate(start)}
                    </ClickableText>
                }
            />
            <Spacer width={40} />


            <ComboBox value={getTime(start)} items={times}
                onSelect={(newValue: string) => setStartTime(newValue)} />


            <Spacer />
            -
            <Spacer />
            <ComboBox value={getTime(end)} items={times}
                onSelect={(newValue: string) => setEndTime(newValue)} />

        </HBox>
    );
}