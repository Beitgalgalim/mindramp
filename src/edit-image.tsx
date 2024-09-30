import { AddPhotoAlternateOutlined, TagFaces } from "@mui/icons-material";
import { Button, Grid } from "@mui/material";
import { useRef, useState } from "react";
import { Text } from "./elem";
import { EditImageProps, MediaResource } from "./types";
import { Tag, WithContext as ReactTags } from 'react-tag-input';
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

interface CroppedImg {
    file: File;
    blob: Blob;
}

const imageScale = 263 / 280;

function getCroppedImg(
    image: HTMLImageElement,
    crop: PercentCrop, // PercentCrop relative to the displayed image element
    fileName: string
): Promise<CroppedImg | undefined> {
    return new Promise<CroppedImg | undefined>((resolve, reject) => {
        // Get the container dimensions (the displayed size of the img element)
        const scale = imageScale * image.naturalHeight > image.naturalWidth ?
            image.naturalHeight / image.height :
            image.naturalWidth / image.width;

        console.log("img n:", imageScale, scale)
        //console.log("scaleX:",scaleX ,"scaleY", scaleY)

        const cropX = (crop.x * image.width * scale / 100);
        const cropY = (crop.y * image.height * scale / 100);
        const cropWidth = (crop.width * image.width * scale) / 100;
        const cropHeight = (crop.height * image.height * scale) / 100;

        // Create a canvas with the scaled crop dimensions
        const canvas = document.createElement("canvas");
        canvas.width = cropWidth;
        canvas.height = cropHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
            reject("Can't create canvas context");
            return;
        }

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw the cropped area of the natural image onto the canvas
        ctx.drawImage(
            image,
            cropX,      // Start X position in the natural image
            cropY,      // Start Y position in the natural image
            cropWidth,  // Width in the natural image
            cropHeight,// Height in the natural image
            0,                // Draw at X=0 on canvas
            0,                // Draw at Y=0 on canvas
            cropWidth,  // Canvas width
            cropHeight  // Canvas height
        );

        // Convert the canvas to a blob and then to a File
        canvas.toBlob((blob) => {
            if (!blob) {
                reject("Failed to convert to blob");
                return;
            }
            // Create a File from the blob
            const file = new File([blob], fileName, { type: blob.type });
            resolve({ file, blob });
        }, "image/jpeg"); // You can specify the image format here
    });
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
    //const [prevImg, setPrevImg] = useState<string | undefined>();
    const [name, setName] = useState<string>(imageInfo.name);
    const [tags, setTags] = useState<Tag[] | undefined>(imageInfo.keywords?.map(k => ({ id: k, text: k })));
    const KeyCodes = {
        comma: 188,
        enter: 13,
    };

    const delimiters = [KeyCodes.comma, KeyCodes.enter];
    const handleAddition = (tag: Tag) => {
        setTags(currentTags => currentTags ? [...currentTags, tag] : [tag]);
    };

    const handleDelete = (i: number) => {
        setTags(tags?.filter((tag, index) => index !== i));
    };

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
        <h2>{imageInfo._ref ? "עדכון תמונה" : "הוספת תמונה"}</h2>
        <div className="edit-image-fields-container">
            <div>שם</div>
            <input type="text" value={name} onChange={(e) => { setName(e.target.value) }} />

            <div>תמונה*</div>
            <div className="edit-image-img-cont">
                {preview && !imageInfo._ref ?
                    <ReactCrop crop={crop} onChange={(c: PixelCrop, p: PercentCrop) => {
                        if (p.width < 10 || p.height < 10) return;
                        console.log("crop", p)
                        setCrop(p)
                        // if (imgRef.current)
                        //     getCroppedImg(imgRef.current, p, "ttt").then(({ blob }: any) => {
                        //         const url = URL.createObjectURL(blob);;
                        //         setPrevImg(url)
                        //     })
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
            {/* {prevImg && <img src={prevImg} />} */}
            <div>מילות חיפוש</div>
            <ReactTags
                tags={tags}
                delimiters={delimiters}
                placeholder="הכנס מילת חיפוש ולחץ אנטר"
                handleDelete={handleDelete}
                handleAddition={handleAddition}
                inputFieldPosition="bottom"
                autocomplete
            />


        </div>

        <div className="edit-image-buttons">
            <Button variant="contained" onClick={() => {
                if (name.length == 0) {
                    notify.error("חסר שם");
                    return;
                }
                //todo validate file name
                if (file && crop && imgRef.current) {
                    getCroppedImg(imgRef.current, crop, name).then(res => {
                        if (res) {
                            onSave({
                                ...imageInfo,
                                name,
                                keywords: tags?.map(t => t.id),
                            }, res.file)
                        }
                    });
                } else {
                    onSave({
                        ...imageInfo,
                        name,
                        keywords: tags?.map(t => t.id),
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
    </div >
}
