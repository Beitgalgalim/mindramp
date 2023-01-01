
import { useRef, useState, Fragment } from 'react';

import { DatePickerProps, NewDatePickerProps } from "./types";
import { HBox, Spacer, ClickableText, ComboBox } from './elem';
import ReactDatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import "./css/date-picker.css"
import { DateFormats, DateJSParseFormats, day2DayName, getTimes, MonthMap, parseTime, replaceDatePreserveTime2, validTime } from './utils/date';

import dayjs from './localDayJs'

const times = getTimes();



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
    const time = parseTime(newTime);
    const fromDate = dayjs(d);
    const toDate = dayjs(d).hour(time.hours).minute(time.minutes)
    return toDate.diff(fromDate, 'minutes', true);
}


export default function NewDatePicker({
    start, end,
    setStart, setEnd,
    style,
    pickTimes, isDateRange, readOnly }: NewDatePickerProps) {
    const [invalidStart, setInvalidStart] = useState(false);
    const [invalidEnd, setInvalidEnd] = useState(false);
    const [invalidStartDate, setInvalidStartDate] = useState<string | undefined>(undefined);
    const [invalidEndDate, setInvalidEndDate] = useState<string | undefined>(undefined);
    const [startOpen, setStartOpen] = useState<boolean>(false);
    const [endOpen, setEndOpen] = useState<boolean>(false);
    const [startLocal, setStartLocal] = useState<string>(dayjs(start).format(DateFormats.DATE_LOCALE));
    const [endLocal, setEndLocal] = useState<string>(dayjs(end).format(DateFormats.DATE_LOCALE));
    const [startTimeLocal, setStartTimeLocal] = useState<string>(getTime(start));
    const [endTimeLocal, setEndTimeLocal] = useState<string>(getTime(end));
    

    let dateStartPicker = useRef<ReactDatePicker | null>(null);
    let dateEndPicker = useRef<ReactDatePicker | null>(null);

    const setStartTime = (newTime: string) => {
        setStartTimeLocal(newTime);
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
        setEndTimeLocal(newTime);

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
        setStartLocal(newDate);
        const newDatejs = dayjs(newDate, DateJSParseFormats);
        setInvalidStartDate(newDatejs.isValid() ? undefined : newDate);
        if (newDatejs.isValid()) {
            console.log("valid date", newDate)

            const newStart = replaceDatePreserveTime2(start, newDatejs)
            if (newStart) {
                setStart(newStart);
            } else {
                setInvalidStartDate(newDate);
            }
            const newEnd = replaceDatePreserveTime2(end, newDatejs);
            if (newEnd) {
                setEnd(newEnd);
            } else {
                setInvalidEndDate(newEnd);
            }
        }
    }

    const setEndDate = (newEndDate: string) => {
        setEndLocal(newEndDate);
        const valid = dayjs(newEndDate).isValid();
        setInvalidEndDate(valid ? undefined : newEndDate);
        if (valid) {
            if (dayjs(start).isAfter(newEndDate)) {
                newEndDate = start;
            }
            // since all day events don't show the next day, add one day
            setEnd(dayjs(newEndDate).add(1, "days").format(DateFormats.DATE_TIME));
        }
    }

    return (
        <div className="datepicker-container" style={style}>
            <div style={{ width: "100%" }}>
                <ReactDatePicker
                    className="datepicker-dateinput"
                    ref={dateStartPicker}
                    disabled={!!readOnly}
                    selected={dayjs(start).toDate()}
                    onChange={(d: Date) => {
                        console.log("picker change")
                        setDate(dayjs(d).format(DateFormats.DATE))
                    }}
                    shouldCloseOnSelect={true}
                    onCalendarOpen={() => setStartOpen(true)}
                    onCalendarClose={() => setStartOpen(false)}
                    customInput={
                        <ClickableText
                            style={{ textAlign: "center" }}
                            showExpand={!readOnly}
                            onClick={() => dateStartPicker?.current?.setOpen(true)}
                            readOnly={readOnly}
                            setOpen={(o: boolean) => dateStartPicker?.current?.setOpen(o)}
                            onValueChange={(val: string) => {
                                setDate(val)
                            }}
                            open={startOpen}
                            invalid={invalidStartDate != undefined}
                            textValue={invalidStartDate != undefined ? invalidStartDate : startLocal}
                        />
                    }
                    dateFormat={"dd/MM/yy"}
                />
            </div>
            {pickTimes && <div className="datepicker-time-range">
                <ComboBox
                    hideExpandButton={readOnly}
                    listStyle={{ textAlign: "left" }}
                    textStyle={{ textAlign: "center" }}
                    listWidth={100}
                    value={getTime(start)}
                    items={times}
                    onSelect={(newValue: string) => {
                        console.log("time selected", newValue)
                        setStartTime(newValue)
                    }}
                    onChange={(newValue: string) => {
                        console.log("time change", newValue)
                        setStartTime(newValue)
                    }}
                    invalid={invalidStart}
                    readOnly={readOnly}
                />
                <div className="datepicker-time-range-sep">-</div>
                <ComboBox
                    hideExpandButton={readOnly}
                    listStyle={{ textAlign: "left" }}
                    textStyle={{ textAlign: "center" }}
                    listWidth={100}
                    value={endTimeLocal}
                    items={getTimes(dayjs(start))}
                    onSelect={(newValue: string) => setEndTime(newValue)}
                    onChange={(newValue: string) => setEndTime(newValue)}
                    invalid={invalidEnd}
                    readOnly={readOnly}
                />
            </div>}

            {isDateRange &&
                <ReactDatePicker
                    ref={dateEndPicker}

                    selected={dayjs(end).subtract(1, "days").isAfter(start) ?
                        dayjs(end).subtract(1, "days").toDate() :
                        dayjs(start).toDate()
                    }
                    onChange={(d: Date) => setEndDate(dayjs(d).format(DateFormats.DATE))}
                    shouldCloseOnSelect={true}
                    onCalendarOpen={() => setEndOpen(true)}
                    onCalendarClose={() => setEndOpen(false)}

                    customInput={
                        <ClickableText
                            style={{ textAlign: "center" }}
                            showExpand={true}
                            onClick={() => dateEndPicker?.current?.setOpen(true)}
                            readOnly={readOnly}
                            setOpen={(o: boolean) => dateEndPicker?.current?.setOpen(o)}
                            onValueChange={(val: string) => {
                                setEndDate(val)
                            }}
                            open={endOpen}
                            invalid={invalidEndDate != undefined}
                            textValue={invalidEndDate != undefined ? invalidEndDate : endLocal}
                        />
                    }
                    dateFormat={"dd/MM/yy"}
                />
            }
        </div>
    );
}