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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Codec, Format, Transformation } from "@/types";
import { FORMAT_NAMES, FORMATS } from "@/constants";
import { useState, Dispatch, SetStateAction } from "react";
import { VideoDurationWrapper } from "@/util/videoDurationWrapper";
import { Slider } from "../ui/slider";

interface TrimProps {
  videoFormat: Format;
  addTransformation(transformation: Transformation): void;
  videoDuration: VideoDurationWrapper;
}

export const Trim = ({
  videoFormat,
  addTransformation,
  videoDuration,
}: TrimProps) => {
  const [trimFromPercent, setTrimFromPercent] = useState<number>(30.0);
  const [trimToPercent, setTrimToPercent] = useState<number>(60.0);
  const [trimThumbnailPercent, setTrimThumbnailPercent] =
    useState<number>(45.0);

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
                  Convert video to
                </div>
              </div>
            </div>

            <Slider
              defaultValue={[
                trimFromPercent,
                trimThumbnailPercent,
                trimToPercent,
              ]}
              onValueChange={(e: number[]) => {
                console.log(e);
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
