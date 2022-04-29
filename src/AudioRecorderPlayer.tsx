import { Clear, Mic, Pause, PlayArrow, Stop } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { HBoxC, HBox, Spacer } from "./elem";
import { RecorderProps } from './types'

const recColor = '#F50257';
const playColor = '#6F9CB6';
const sampleRate = 44100;

// Written using example from here: https://gist.github.com/meziantou/edb7217fddfbb70e899e


const Button = (props: any) => (<div style={{ backgroundColor: props.bg, borderRadius: props.size ? props.size / 2 : 25, height: props.size || 50, width: props.size || 50, alignItems: 'center', display: 'flex', justifyContent: 'center' }}>
    {props.children}
</div>)

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

export default function AudioPlayerRecorder({
    showRecordButton, showPlayButton, showClearButton, notify, audioUrl, audioBlob, onCapture, onClear, buttonSize
}: RecorderProps) {
    const size = buttonSize || 50;
    const [mediaStream, setMediaStream] = useState<MediaStream>();
    const [recorder, setRecorder] = useState<ScriptProcessorNode>();
    const [mediaStreamSource, setMediaStreamSource] = useState<MediaStreamAudioSourceNode>();
    const [audioContext, setAudioContext] = useState<AudioContext>();
    const [recording, setRecording] = useState<boolean>(false);
    const [paused, setPaused] = useState<boolean>(false);
    const [recData, setRecData] = useState<any>();

    useEffect(() => {
        if (recording && navigator.mediaDevices) {
            navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {

                setMediaStream(stream);
                // creates the audio context
                //window.AudioContext = window.AudioContext || window.webkitAudioContext;
                const AudioContext = window.AudioContext || // Default
                    (window as any).webkitAudioContext; // Safari and old versions of Chrome
                const context = new AudioContext();

                // creates an audio node from the microphone incoming stream
                const mss = context.createMediaStreamSource(stream);

                // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createScriptProcessor
                const bufferSize = 2048;
                const numberOfInputChannels = 2;
                const numberOfOutputChannels = 2;
                const rec = context.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);

                setRecData((d: any) => {
                    rec.onaudioprocess = (e) => {
                        setRecData((rd: any) => {
                            const nrd = {
                                leftChannel: [...rd.leftChannel, new Float32Array(e.inputBuffer.getChannelData(0))],
                                rightChannel: [...rd.rightChannel, new Float32Array(e.inputBuffer.getChannelData(1))],
                                length: rd.length + bufferSize
                            }
                            return nrd;
                        });
                    }
                    return {
                        leftChannel: [],
                        rightChannel: [],
                        length: 0,
                    }
                })

                // we connect the recorder with the input stream
                mss.connect(rec);
                rec.connect(context.destination);
                setAudioContext(context);
                setRecorder(rec);
                setMediaStreamSource(mss);
            })
        }
    }, [recording]);

    const start = () => {
        setRecording(true);
        setPaused(false);
    }

    const play = () => {
        if (!recording && !paused && (audioBlob || audioUrl)) {
            const player = new Audio();

            if (audioBlob) {
                player.src = URL.createObjectURL(audioBlob);
                //player.volume = 0
                player.onended = (e) => {
                    console.log("done")
                }
                player.play();
            } else if (audioUrl) {
                player.src = audioUrl;
                player.play();
            }



        }
    }

    const stop = () => {
        if (recording && recorder && mediaStreamSource && audioContext && mediaStream) {
            setRecording(false);
            setPaused(false);

            recorder.disconnect(audioContext.destination);
            mediaStreamSource.disconnect(recorder);
            mediaStream.getAudioTracks().forEach(track => {
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

    const resume = () => {
        if (paused) {
            audioContext?.resume();
            setPaused(false);
        }
    }

    const pause = () => {
        if (recording && !paused) {
            audioContext?.suspend();
            setPaused(true);
        }
    }

    return (<div>
        <HBox style={{ width: '100%', height: '100%', alignItems:"flex-end" }}>
            
            {showRecordButton && !recording && !paused &&
                <Button bg={recColor} size={size}>
                    <Mic style={{ color: 'white', fontSize: 25 }} onClick={() => start()} />
                </Button>
            }
            {showRecordButton && recording &&
                <HBoxC>
                    <Button bg={recColor} size={size}>
                        <Stop style={{ color: 'white' }} onClick={() => stop()} />
                    </Button>
                    <Spacer />
                    {!paused && <Button size={size} bg={recColor}><Pause style={{ color: 'white' }} onClick={() => pause()} /></Button>}
                    {paused && <Button size={size} bg={recColor}><PlayArrow style={{ color: 'white' }} onClick={() => resume()} /></Button>}
                </HBoxC>
            }
            <Spacer />
            {showPlayButton && !recording && !paused &&
                <Button size={size} bg={playColor}>
                    <PlayArrow style={{ color: 'white', fontSize: size/1.3 }} onClick={() => play()} />
                </Button>
            }
            <Spacer />
            {showClearButton && !recording && !paused &&
                <Button bg={recColor} size={size}>
                    <Clear style={{ color: 'white', fontSize: 25 }} onClick={() => onClear && onClear()} />
                </Button>
            }
        </HBox >




    </div>);
}

