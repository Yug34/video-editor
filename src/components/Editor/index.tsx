import {ChangeEvent, ReactNode, useEffect, useRef, useState} from "react";

import {FFmpeg} from "@ffmpeg/ffmpeg";
import {toBlobURL, fetchFile} from "@ffmpeg/util";
import {Format, VideoDuration} from "@/types";
import {VideoDurationWrapper} from "@/util";

import {Tabs, TabsTrigger, TabsContent, TabsList} from "@/components/ui/tabs";

import {HoverCard, HoverCardContent, HoverCardTrigger} from "@/components/ui/hover-card";

export const Editor = () => {
    const ffmpegRef = useRef(new FFmpeg());
    const messageRef = useRef<HTMLParagraphElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [video, setVideo] = useState<Uint8Array | null>(null);
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const [videoFormat, setVideoFormat] = useState<Format | null>(null);
    const [videoDuration, setVideoDuration] = useState<VideoDurationWrapper | null>(null);
    const [sourceVideoURL, setSourceVideoURL] = useState<string | null>(null);

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        if (video && isLoaded) {
            ffmpegRef.current.on('log', ({message}) => {
                messageRef.current!.innerHTML = message;
                console.log(message);
            });
        }
    }, [video, isLoaded]);

    const load = async () => {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        const ffmpeg = ffmpegRef.current;

        // toBlobURL is used to bypass CORS issue, urls with the same
        // domain can be used directly.
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
        });

        setIsLoaded(true);
    }

    const initialize = async (e: ChangeEvent) => {
        const file = (e.target as HTMLInputElement)!.files![0];

        const format = file.type.split("/")[1] as Format;
        setVideoFormat(format);

        const fileData = await fetchFile(file);

        const ffmpeg = ffmpegRef.current;

        await ffmpeg.writeFile(`input.${format}`, fileData);

        ffmpeg.on('log', ({message}) => {
            let DurationPattern = /DURATION *: \d+:\d+:\d+.?\d*(?=,*)/ig;
            const msgToMatch = message.split(",")[0];
            if (msgToMatch.match(DurationPattern)) {
                const splitMessage = msgToMatch.split(":");
                let timeStamps = splitMessage.splice(1, splitMessage.length);
                timeStamps = timeStamps.map((timeStamp) => timeStamp.trim());
                const videoDuration: VideoDuration = {
                    hours: parseInt(timeStamps[0]),
                    minutes: parseInt(timeStamps[1]),
                    seconds: parseInt(timeStamps[2])
                }
                setVideoDuration(VideoDurationWrapper.fromVideoDuration(videoDuration));
            }
        });

        // Does nothing, just getting the metadata of the video.
        await ffmpeg.exec([`-i`, `input.${format}`]);

        ffmpeg.readFile(`input.${format}`).then((videoData) => {
            const videoURL = URL.createObjectURL(new Blob([videoData], {type: `video/${format}`}));
            setSourceVideoURL(videoURL);
        });

        setVideo(fileData);
    }

    const VideoPlayer = ({isUnplayable}: { isUnplayable: boolean }) => {
        return (
            <div
                className={`relative flex justify-center items-center h-90 max-h-90 ${isUnplayable ? 'border border-white' : ''} rounded-md`}>
                <video className={"w-full"} ref={videoRef} controls src={sourceVideoURL!}/>
                {isUnplayable && (
                    <>
                        <div>
                            <p>.{videoFormat} videos are unplayable on the browser. Although, your video was edited
                                successfully.</p>
                            <p>Click on the download button to download your video!</p>
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div>
            {video && isLoaded ? (
                <div>
                    <Tabs defaultValue={"complete"} className={"flex-1"}>
                        <div className="container h-full py-6">
                            <div className="grid h-full items-stretch gap-6 md:grid-cols-[1fr_200px]">
                                <div className="hidden flex-col space-y-4 sm:flex md:order-2">
                                    <div className="grid gap-2">
                                        <HoverCard openDelay={200}>
                                            <HoverCardTrigger asChild>
                      <span
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Mode
                      </span>
                                            </HoverCardTrigger>
                                            <HoverCardContent className="w-[320px] text-sm" side="left">
                                                Choose the interface that best suits your task. You can
                                                provide: a simple prompt to complete, starting and ending
                                                text to insert a completion within, or some text with
                                                instructions to edit it.
                                            </HoverCardContent>
                                        </HoverCard>
                                        <TabsList className="grid grid-cols-3">
                                            <TabsTrigger value="complete">
                                                <span className="sr-only">Complete</span>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="none"
                                                    className="h-5 w-5"
                                                >
                                                    <rect
                                                        x="4"
                                                        y="3"
                                                        width="12"
                                                        height="2"
                                                        rx="1"
                                                        fill="currentColor"
                                                    ></rect>
                                                    <rect
                                                        x="4"
                                                        y="7"
                                                        width="12"
                                                        height="2"
                                                        rx="1"
                                                        fill="currentColor"
                                                    ></rect>
                                                    <rect
                                                        x="4"
                                                        y="11"
                                                        width="3"
                                                        height="2"
                                                        rx="1"
                                                        fill="currentColor"
                                                    ></rect>
                                                    <rect
                                                        x="4"
                                                        y="15"
                                                        width="3"
                                                        height="2"
                                                        rx="1"
                                                        fill="currentColor"
                                                    ></rect>
                                                    <rect
                                                        x="8.5"
                                                        y="11"
                                                        width="3"
                                                        height="2"
                                                        rx="1"
                                                        fill="currentColor"
                                                    ></rect>
                                                    <rect
                                                        x="8.5"
                                                        y="15"
                                                        width="3"
                                                        height="2"
                                                        rx="1"
                                                        fill="currentColor"
                                                    ></rect>
                                                    <rect
                                                        x="13"
                                                        y="11"
                                                        width="3"
                                                        height="2"
                                                        rx="1"
                                                        fill="currentColor"
                                                    ></rect>
                                                </svg>
                                            </TabsTrigger>
                                            <TabsTrigger value="insert">
                                                <span className="sr-only">Insert</span>
                                            </TabsTrigger>
                                            <TabsTrigger value="edit">
                                                <span className="sr-only">Edit</span>
                                            </TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="complete" className="mt-0 border-0 p-0">
                                            Complete
                                        </TabsContent>
                                        <TabsContent value="insert" className="mt-0 border-0 p-0">
                                            Insert
                                        </TabsContent>
                                        <TabsContent value="edit" className="mt-0 border-0 p-0">
                                            Edit
                                        </TabsContent>
                                    </div>
                                </div>
                                <div className="md:order-1">
                                    <div className="flex h-full flex-col space-y-4">
                                        <VideoPlayer isUnplayable={false}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Tabs>
                </div>
            ) : (
                <div>
                    <input id="file-upload" type="file" ref={fileInputRef} onChange={initialize}/>
                </div>
            )}
        </div>
    )
};
