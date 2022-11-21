import { AddPhotoAlternateOutlined } from "@mui/icons-material";
import { Button, Grid } from "@mui/material";
import { useRef, useState } from "react";
import { Text } from "./elem";
import { EditImageProps, ImageInfo } from "./types";
import ReactCrop, {
    centerCrop,
    makeAspectCrop,
    Crop,
    PixelCrop,
    PercentCrop,
} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

import "./css/edit-image.css";

function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number,
) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    )
}

function getCroppedImg(image: HTMLImageElement, crop: PercentCrop, fileName: string): Promise<File | undefined> {
    return new Promise<File | undefined>((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        const cropX = crop.x * image.width / 100;
        const cropY = crop.y * image.height / 100;
        const cropWidth = crop.width * image.width / 100;
        const cropHeight = crop.height * image.height / 100;;

        canvas.width = cropWidth;
        canvas.height = cropHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.drawImage(
                image,
                cropX * scaleX,
                cropY * scaleY,
                cropWidth * scaleX,
                cropHeight * scaleY,
                0,
                0,
                cropWidth,
                cropHeight
            )

            const reader = new FileReader()
            canvas.toBlob(blob => {
                if (blob) {
                    reader.readAsDataURL(blob)
                    reader.onloadend = () => {
                        resolve(dataURLtoFile(reader.result as string, fileName));
                    }
                } else {
                    reject("Failed to convert to blob");
                }
            })
        } else {
            reject("can't create canvas context");
        }
    });

}

function dataURLtoFile(dataurl: string, filename: string): File | undefined {
    console.log(dataurl)
    let arr = dataurl.split(',');
    if (arr.length == 2) {
        const regEx = arr[0].match(/:(.*?);/);
        if (regEx && regEx.length > 1) {
            let mime = regEx[1],
                bstr = atob(arr[1]),
                n = bstr.length,
                u8arr = new Uint8Array(n);

            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new File([u8arr], filename, { type: mime });
        }
    }
}

const aspect = 80 / 85;

export default function EditImage(
    { notify, imageInfo, onSave, onDelete, onCancel }: EditImageProps) {
    const inputEl = useRef<HTMLInputElement | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const [preview, setPreview] = useState<string | undefined>(imageInfo?.url);
    const [crop, setCrop] = useState<PercentCrop>();
    const [file, setFile] = useState<File | undefined>(undefined);
    const [dirty, setDirty] = useState<boolean>(false);
    const [name, setName] = useState<string>(imageInfo.name);
    const [keywords, setKeywords] = useState<string[] | undefined>(imageInfo.keywords);


    function onSelectedFile(f: any) {
        if (!f.target.files || f.target.files.length === 0) {
            setPreview(undefined);
        } else {
            const objectUrl = URL.createObjectURL(f.target.files[0]);
            setPreview(objectUrl);
            setFile(f.target.files[0]);
            if (name == "") {
                // todo remove extension
                setName(f.target.files[0].name)
            }
        }
        setDirty(true);
    }

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget
        setCrop(centerAspectCrop(width, height, aspect))
    }

    return <div className="edit-image-container">

        <input className="custom-file-input" type="file" ref={inputEl} style={{ visibility: "hidden" }} onChange={onSelectedFile} />
        <h1>{imageInfo._ref ? "עדכון תמונה" : "הוספת תמונה"}</h1>
        <div className="edit-image-fields-container">
            <div>שם</div>
            <input type="text" value={name} onChange={(e) => { setName(e.target.value) }} />

            <div>תמונה*</div>
            <div className="edit-image-img-cont">
                {preview && !imageInfo._ref ?
                    <ReactCrop crop={crop} onChange={(c: PixelCrop, p: PercentCrop) => { 
                        if (p.width < 10 || p.height < 10) return;
                        setCrop(p) 
                    }}
                        aspect={aspect}>
                        <img ref={imgRef} className="edit-image-img" src={preview} onLoad={onImageLoad}
                        />
                    </ReactCrop>
                    : preview ?
                        <img ref={imgRef} className="edit-image-img" src={preview} />
                        :
                        <div className="edit-image-img border" />}
                {!imageInfo._ref && <AddPhotoAlternateOutlined style={{ fontSize: 35 }}
                    onClick={() => inputEl?.current?.click()} />}
            </div>
            <div>מילות חיפוש</div>
            <input type="text" value={keywords} onChange={(e) => { }} />
        </div>

        <div className="edit-image-buttons">
            <Button variant="contained" onClick={() => {
                if (name.length == 0) {
                    notify.error("חסר שם");
                    return;
                }
                //todo validate file name
                if (file && crop && imgRef.current) {
                    getCroppedImg(imgRef.current, crop, name).then((f: File | undefined) => onSave({
                        ...imageInfo,
                        name,
                        keywords
                    }, f)
                    );
                } else {
                    onSave({
                        ...imageInfo,
                        name,
                        keywords
                    })
                }
            }}>שמור</Button>
            {imageInfo._ref && <Button variant="contained" onClick={
                () => notify.ask("האם למחוק?", undefined, [
                    {
                        caption: "כן",
                        callback: () => onDelete(imageInfo)
                    },
                    {
                        caption: "לא",
                        callback: () => { }
                    }
                ])
            } >מחיקה</Button>}

            <Button variant="contained" onClick={onCancel}>ביטול</Button>
        </div>
    </div>
}
