import { useCallback, useEffect, useState } from "react";
import AudioPlayerRecorder from "./AudioRecorderPlayer";
import { MeetingRequestProps } from "./types";
import { meetingRequest } from "./api";
import dayjs from "dayjs";
import { day2DayName } from "./utils/date";
import { Close, Delete } from "@mui/icons-material";


export function MeetingRequest({ notify, onClose }: MeetingRequestProps) {
    const [audioBlob, setAudioBlob] = useState<Blob | undefined>();
    const [response, setResponse] = useState<string | undefined | any>();
    const [busy, setBusy] = useState<boolean>(false);
    const [title, setTitle] = useState<string | undefined>();
    const [date, setDate] = useState<string | undefined>();
    const [time, setTime] = useState<string | undefined>();
    const [duration, setDuration] = useState<number | undefined>();



    const handleSend = useCallback(async (audioBlob: Blob) => {
        // send gemini the audio and instructions:
        setBusy(true);

        meetingRequest(audioBlob!)
            .then(txt => {
                txt = txt.trim()
                console.error("llm success", txt)
                if (txt.startsWith("```json") && txt.endsWith("```")) {
                    txt = txt.substring(7, txt.length - 3);
                    const eventInfo = JSON.parse(txt);
                    if (eventInfo.title)
                        setTitle(eventInfo.title);

                    if (eventInfo.date)
                        setDate(eventInfo.date);
                    if (eventInfo.startTime)
                        setTime(eventInfo.startTime);
                    if (eventInfo.lengthMinutes)
                        setDuration(eventInfo.lengthMinutes);
                }

                setResponse(txt)
            })
            .catch(err => {
                console.error("llm failed", err)
                setResponse(err)
            })
            .finally(() => setBusy(false));


    }, [audioBlob]);


    return <div style={{display:"flex", flexDirection: "column", alignItems:"center", justifyContent:"center" }}>
        <button style={{ fontSize: 25, margin: 20, justifyContent:"center", display:"flex", alignItems:"center" }} onClick={() => {
            onClose()
        }}><Close/>סגור</button>
        <div style={{ width: "100%", flexDirection: "column", alignItems: "center", justifyContent: "center", display: "flex", margin: 20 }}>
            <RecordButton
                onStart={() => {
                    setAudioBlob(undefined);
                    startRecording((recData) => { })

                }}
                onStop={() => stopRecording((blob) => {
                    setAudioBlob(blob);
                    handleSend(blob);
                })}
                size={200}
            />

        </div>
        <div>לחץ להקליט הוראות ליצירת פגישה</div>

        {busy && <div>מפענח...</div>}

        <div style={{ width:250, textAlign:"right", marginTop:50, fontSize:28}}>
            {title && <div>נושא: {title}</div>}
            {date && <div>בתאריך: {dayjs(date).format("DD/MM")}</div>}
            {date && <div>ביום: {day2DayName[dayjs(date).day()]}</div>}
            {time && <div>שעה: {time}</div>}
            {duration && <div>למשך: {duration} דקות</div>}
        </div>
        <button style={{ fontSize: 25, margin: 20, justifyContent:"center", display:"flex", alignItems:"center" }} onClick={() => {
            setTitle(undefined);
            setDate(undefined);
            setTime(undefined);
            setDuration(undefined);
            setResponse(undefined);
            setAudioBlob(undefined);

        }}><Delete/>התחל מחדש</button>



        <div style={{ height: 200 }} />
        <pre dir="ltr" style={{ textAlign: "left" }}>
            {response?.title ? JSON.stringify(response, undefined, " ") : response}
        </pre>
        <button
            disabled={!audioBlob}
            onClick={() => {
                handleSend(audioBlob!);
            }}>שלח שוב
        </button>
    </div >
}


interface RecordButtonProps {
    size?: number;
    onStart?: () => void;
    onStop?: () => void;
}

export const RecordButton: React.FC<RecordButtonProps> = ({ size = 100, onStart, onStop }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [blink, setBlink] = useState(true);

    useEffect(() => {
        if (isRecording) {
            const interval = setInterval(() => setBlink(prev => !prev), 600);
            return () => clearInterval(interval);
        }
    }, [isRecording]);

    const handleClick = () => {
        if (isRecording) {
            setIsRecording(false);
            onStop?.();
        } else {
            setIsRecording(true);
            onStart?.();
        }
    };

    const outerStyle: React.CSSProperties = {
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "red",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "background-color 0.3s ease",
    };

    const innerSize = size * 0.5;

    const squareStyle: React.CSSProperties = {
        width: innerSize,
        height: innerSize,
        backgroundColor: blink ? "white" : "transparent",
        borderRadius: 6,
        transition: "background-color 0.4s ease",
    };

    const circleDotStyle: React.CSSProperties = {
        width: innerSize,
        height: innerSize,
        borderRadius: "50%",
        backgroundColor: blink ? "white" : "transparent",
        transition: "background-color 0.4s ease",
    };

    return (
        <div style={outerStyle} onClick={handleClick}>
            {isRecording ? (
                <div style={squareStyle} />
            ) : (
                <div style={circleDotStyle} />
            )}
        </div>
    );
};

const sampleRate = 44100;

let mediaStream: any
let audioContext: any
let recorder: any
let mediaStreamSource: any
let recData: any

function startRecording(setRecData: (recData: any) => void) {
    if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {

            mediaStream = stream;
            // creates the audio context
            const AudioContext = window.AudioContext || // Default
                (window as any).webkitAudioContext; // Safari and old versions of Chrome
            audioContext = new AudioContext({
                sampleRate,
            });

            // creates an audio node from the microphone incoming stream
            mediaStreamSource = audioContext.createMediaStreamSource(stream);

            // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createScriptProcessor
            const bufferSize = 2048;
            const numberOfInputChannels = 2;
            const numberOfOutputChannels = 2;
            recorder = audioContext.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
            recData = {
                leftChannel: [],
                rightChannel: [],
                length: 0,
            }
            setRecData(recData)

            recorder.onaudioprocess = (e: any) => {
                recData = {
                    leftChannel: [...recData.leftChannel, new Float32Array(e.inputBuffer.getChannelData(0))],
                    rightChannel: [...recData.rightChannel, new Float32Array(e.inputBuffer.getChannelData(1))],
                    length: recData.length + bufferSize
                }
                setRecData(recData);
            }


            // we connect the recorder with the input stream
            mediaStreamSource.connect(recorder);
            recorder.connect(audioContext.destination);
        })
    }
}

function stopRecording(onCapture: (blob: Blob) => void) {
    if (mediaStreamSource && audioContext && mediaStream && recData) {

        recorder.disconnect(audioContext.destination);
        mediaStreamSource.disconnect(recorder);
        mediaStream.getAudioTracks().forEach((track: any) => {
            track.stop();
        })
        audioContext.close();

        // we flat the left and right channels down
        // Float32Array[] => Float32Array

        var leftBuffer = flattenArray(recData.leftChannel, recData.length);
        var rightBuffer = flattenArray(recData.rightChannel, recData.length);

        // we interleave both channels together
        // [left[0],right[0],left[1],right[1],...]
        var interleaved = interleave(leftBuffer, rightBuffer);

        // we create our wav file
        var buffer = new ArrayBuffer(44 + interleaved.length * 2);
        var view = new DataView(buffer);

        // RIFF chunk descriptor
        writeUTFBytes(view, 0, 'RIFF');
        view.setUint32(4, 44 + interleaved.length * 2, true);
        writeUTFBytes(view, 8, 'WAVE');

        // FMT sub-chunk
        writeUTFBytes(view, 12, 'fmt ');
        view.setUint32(16, 16, true);             // chunkSize
        view.setUint16(20, 1, true);              // wFormatTag
        view.setUint16(22, 2, true);              // wChannels: stereo (2 channels)
        view.setUint32(24, sampleRate, true);     // dwSamplesPerSec
        view.setUint32(28, sampleRate * 4, true); // dwAvgBytesPerSec
        view.setUint16(32, 4, true);              // wBlockAlign
        view.setUint16(34, 16, true);             // wBitsPerSample

        // data sub-chunk
        writeUTFBytes(view, 36, 'data');
        view.setUint32(40, interleaved.length * 2, true);

        // write the PCM samples
        var index = 44;
        var volume = 1;
        for (var i = 0; i < interleaved.length; i++) {
            view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
            index += 2;
        }

        // our final blob
        var blob = new Blob([view], { type: 'audio/wav' });
        // setUrl(audioURL);
        if (onCapture) {
            onCapture(blob);
        }
    }
}

function flattenArray(channelBuffer: Float32Array[], recordingLength: number): Float32Array {
    var result = new Float32Array(recordingLength);
    var offset = 0;
    for (var i = 0; i < channelBuffer.length; i++) {
        var buffer = channelBuffer[i];
        result.set(buffer, offset);
        offset += buffer.length;
    }
    return result;
}

function interleave(leftChannel: Float32Array, rightChannel: Float32Array): Float32Array {
    var length = leftChannel.length + rightChannel.length;
    var result = new Float32Array(length);

    var inputIndex = 0;

    for (var index = 0; index < length;) {
        result[index++] = leftChannel[inputIndex];
        result[index++] = rightChannel[inputIndex];
        inputIndex++;
    }
    return result;
}

function writeUTFBytes(view: any, offset: number, str: string) {
    for (var i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}
