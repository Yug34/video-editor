import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import {Button} from "@/components/ui/button";
import {Format, Transformation} from "@/types";
import {useRef, useState} from "react";
import {VideoDurationWrapper} from "@/util/videoDurationWrapper";
import {Slider} from "../ui/slider";

interface TrimProps {
    videoFormat: Format;
    videoDuration: VideoDurationWrapper;
    sourceVideoURL: string;

    addTransformation(transformation: Transformation): void;
}

export const Trim = ({
                         videoFormat,
                         addTransformation,
                         videoDuration,
                         sourceVideoURL
                     }: TrimProps) => {
    const [trimFromPercent, setTrimFromPercent] = useState<number>(30);
    const [trimToPercent, setTrimToPercent] = useState<number>(60);
    const [trimThumbnailPercent, setTrimThumbnailPercent] = useState<number>(45);

    const thumbnailVideoRef = useRef<HTMLVideoElement>(null);

    const addTrimTransformation = () => {
        const toSeconds = (trimToPercent / 100) * videoDuration.toSeconds();
        const toTimeStamp = VideoDurationWrapper.fromSeconds(toSeconds);

        const fromSeconds = (trimFromPercent / 100) * videoDuration.toSeconds();
        const fromTimeStamp = VideoDurationWrapper.fromSeconds(fromSeconds);

        addTransformation({
            type: "Trim",
            trim: {
                from: fromTimeStamp,
                to: toTimeStamp,
            },
        });
    };

    return (
        <Drawer>
            <DrawerTrigger asChild>
                <Button variant="outline">Trim Video</Button>
            </DrawerTrigger>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle>Transcode Video</DrawerTitle>
                        <DrawerDescription>
                            Transcode video from <b>{videoFormat}</b> to another format and
                            codec.
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 pb-0">
                        <div className="flex items-center justify-center space-x-2">
                            <div className="flex-1 text-center">
                                <div className="text-[0.70rem] uppercase text-muted-foreground">
                                    Trim video
                                </div>
                            </div>
                        </div>

                        <video
                            className={"w-full h-full"}
                            ref={thumbnailVideoRef}
                            src={sourceVideoURL + `#t=${videoDuration.toTimeStampAtPercent(trimFromPercent)},${videoDuration.toTimeStampAtPercent(trimToPercent)}`}
                        />

                        <Slider
                            defaultValue={[
                                trimFromPercent,
                                trimThumbnailPercent,
                                trimToPercent,
                            ]}
                            onValueChange={(e: number[]) => {
                                setTrimFromPercent(e[0]);
                                setTrimToPercent(e[1]);
                                setTrimThumbnailPercent(e[2]);
                            }}
                        />
                    </div>
                    <DrawerFooter>
                        <Button onClick={addTrimTransformation}>Trim video</Button>
                        <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
};
