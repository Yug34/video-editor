import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import {Button} from "@/components/ui/button";
import {useRef, useState} from "react";
import {VideoDurationWrapper} from "@/util/videoDurationWrapper";
import {Slider} from "../ui/slider";
import {Skeleton} from "@/components/ui/skeleton";
import {Loader} from "lucide-react";
import {ScissorsIcon} from "@radix-ui/react-icons";
import {useVideoDataStore} from "@/store/VideoDataStore";
import {useTransformationsStore} from "@/store/TransformationsStore";

export const Trim = () => {
    const [trimFromPercent, setTrimFromPercent] = useState<number>(30);
    const [trimToPercent, setTrimToPercent] = useState<number>(60);
    const [trimThumbnailPercent, setTrimThumbnailPercent] = useState<number>(45);

    const [isVideoLoading, setIsVideoLoading] = useState(false);
    const thumbnailVideoRef = useRef<HTMLVideoElement>(null);

    const {videoDuration, sourceVideoURL} = useVideoDataStore();
    const {addTransformation} = useTransformationsStore();

    const addTrimTransformation = () => {
        const toSeconds = (trimToPercent / 100) * videoDuration!.toSeconds();
        const toTimeStamp = VideoDurationWrapper.fromSeconds(toSeconds);

        const fromSeconds = (trimFromPercent / 100) * videoDuration!.toSeconds();
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
                <Button
                    variant="outline"
                >
                    Trim
                    <ScissorsIcon className={"ml-3"}/>
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <div className="mx-auto w-full max-w-lg">
                    <DrawerHeader>
                        <DrawerTitle>Trim Video</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4">
                        <div className={"w-full h-60 max-h-60"}>
                            {isVideoLoading ? (
                                <Skeleton className={"flex justify-center items-center w-full h-full"}>
                                    <Loader className={"animate-spin w-full"}/>
                                </Skeleton>
                            ) : (
                                <video
                                    className={"w-full h-full"}
                                    controls
                                    ref={thumbnailVideoRef}
                                    src={sourceVideoURL + `#t=${videoDuration!.toTimeStampAtPercent(trimFromPercent)},${videoDuration!.toTimeStampAtPercent(trimToPercent)}`}
                                />
                            )}
                        </div>
                        <Slider
                            className={"mt-12"}
                            defaultValue={[
                                trimFromPercent,
                                trimThumbnailPercent,
                                trimToPercent,
                            ]}
                            onValueChange={(e: number[]) => {
                                setTrimFromPercent(e[0]);
                                setTrimToPercent(e[1]);
                                setTrimThumbnailPercent(e[2]);

                                setIsVideoLoading(true);
                                setTimeout(() => {
                                    setIsVideoLoading(false);
                                }, 1000);
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
