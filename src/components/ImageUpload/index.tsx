"use client";
import React, {ChangeEvent, RefObject} from "react";
// import {UploadIcon} from "@radix-ui/react-icons";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {UploadIcon} from "lucide-react";
import {useFfmpegDataStore} from "@/store/FFmpegStore";
import {Format, VideoDuration} from "@/types";
import {fetchFile} from "@ffmpeg/util";
import {VideoDurationWrapper} from "@/util/videoDurationWrapper";
import {useVideoDataStore} from "@/store/VideoDataStore";

const Loader = () => (
    <svg
        className={"animate-spin"}
        stroke="currentColor"
        fill="none"
        strokeWidth="0"
        viewBox="0 0 24 24"
        height="1em"
        width="1em"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M12 22C17.5228 22 22 17.5228 22 12H19C19 15.866 15.866 19 12 19V22Z"
            fill="currentColor"
        />
        <path
            d="M2 12C2 6.47715 6.47715 2 12 2V5C8.13401 5 5 8.13401 5 12H2Z"
            fill="currentColor"
        />
    </svg>
);

const LoadedCheck = () => (
    <svg
        stroke="currentColor"
        fill="currentColor"
        strokeWidth="0"
        viewBox="0 0 512 512"
        height="1em"
        width="1em"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M170.718 216.482L141.6 245.6l93.6 93.6 208-208-29.118-29.118L235.2 279.918l-64.482-63.436zM422.4 256c0 91.518-74.883 166.4-166.4 166.4S89.6 347.518 89.6 256 164.482 89.6 256 89.6c15.6 0 31.2 2.082 45.764 6.241L334 63.6C310.082 53.2 284.082 48 256 48 141.6 48 48 141.6 48 256s93.6 208 208 208 208-93.6 208-208h-41.6z"/>
    </svg>
);

interface ImageUploadProps {
    fileInputRef: RefObject<HTMLInputElement>;
}

export default function ImageUpload({fileInputRef}: ImageUploadProps) {
    const {isFFmpegLoaded, FFmpeg} = useFfmpegDataStore();
    const {setVideoFormat, setVideoDuration, setVideo, setSourceVideoURL} = useVideoDataStore();

    const initialize = async (input: ChangeEvent | string) => {
        let fileData: Uint8Array;
        let videoFormat: Format;

        // Handle Preloaded video case and ChangeEvent case differently
        if (typeof input === "string") {
            videoFormat = "mp4";
            setVideoFormat(videoFormat);
            fileData = await fetchFile(input);
        } else {
            const file = (input.target as HTMLInputElement)!.files![0];
            videoFormat = file.type.split("/")[1] as Format;
            setVideoFormat(videoFormat);
            fileData = await fetchFile(file);
        }

        await FFmpeg!.writeFile(`input.${videoFormat}`, fileData);

        FFmpeg!.on("log", ({message}) => {
            const DurationPattern = /DURATION *: \d+:\d+:\d+.?\d*(?=,*)/gi;
            const msgToMatch = message.split(",")[0];
            if (msgToMatch.match(DurationPattern)) {
                const splitMessage = msgToMatch.split(":");
                let timeStamps = splitMessage.splice(1, splitMessage.length);
                timeStamps = timeStamps.map((timeStamp) => timeStamp.trim());
                const videoDuration: VideoDuration = {
                    hours: parseInt(timeStamps[0]),
                    minutes: parseInt(timeStamps[1]),
                    seconds: parseInt(timeStamps[2]),
                };
                setVideoDuration(VideoDurationWrapper.fromVideoDuration(videoDuration));
            }
        });

        // Does nothing, just getting the metadata of the video.
        await FFmpeg!.exec([`-i`, `input.${videoFormat}`]);

        FFmpeg!.readFile(`input.${videoFormat}`).then((videoData) => {
            const videoURL = URL.createObjectURL(
                new Blob([videoData], {type: `video/${videoFormat}`})
            );
            setSourceVideoURL(videoURL);
        });

        setVideo(fileData);
    };

    return (
        <div className={"flex flex-col h-full justify-center items-center"}>
            <Card>
                <CardHeader>
                    <CardTitle className="mb-3 flex justify-between items-center">
                        <div>Add a video to edit</div>
                        <small className={"flex gap-x-4 text-green-400"}>
                            {isFFmpegLoaded ? "FFmpeg loaded" : "Loading FFmpeg"}
                            {isFFmpegLoaded ? <LoadedCheck/> : <Loader/>}
                        </small>
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    <Label htmlFor="dropzone-file" className={"cursor-pointer"}>
                        <Card
                            className="flex p-4 items-center justify-center w-full brightness-[0.95] hover:brightness-[0.90] min-w-[300px] md:min-w-[600px] dark:brightness-125 dark:hover:brightness-150">
                            <div className="text-center w-full">
                                <div className="border p-2 rounded-md max-w-min mx-auto">
                                    <UploadIcon/>
                                </div>

                                <p className="my-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-semibold">
                                  Click here to upload a video
                                </span>
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-400">
                                    Formats supported: WebM, MP4, AVI, MOV, WMV
                                </p>
                            </div>
                        </Card>
                    </Label>

                    <Input
                        ref={fileInputRef}
                        id="dropzone-file"
                        accept="video/*"
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                            if (isFFmpegLoaded) {
                                initialize(e);
                            }
                        }}
                    />

                    <div className="relative mt-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t"/>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or pick one of these
                        </span>
                        </div>
                    </div>

                    <div className="flex gap-x-4 max-w-full px-2 pt-4">
                        {["/videos/bunny.mp4", "/videos/rickroll.mp4", "/videos/yee.mp4"].map((videoSource: string) => (
                            <video
                                key={videoSource}
                                autoPlay={true}
                                loop={true}
                                muted={true}
                                className={"max-w-[200px] rounded-lg cursor-pointer hover:brightness-[1.15]"}
                                src={videoSource}
                                onClick={async () => {
                                    if (isFFmpegLoaded) {
                                        await initialize(videoSource);
                                    }
                                }}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
