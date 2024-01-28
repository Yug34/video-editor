import {Toggle} from "@/components/ui/toggle";
import {Transformation, TransformationTypes} from "@/types";
import {SpeakerOffIcon} from "@radix-ui/react-icons";

interface MuteProps {
    addTransformation(transformation: Transformation): void;

    removeTransformation(transformationType: TransformationTypes): void;
}

export const Mute = ({addTransformation, removeTransformation}: MuteProps) => {
    return (
        <Toggle
            className={"max-w-36"}
            aria-label="Toggle Video Grayscale"
            onPressedChange={(pressed: boolean) => {
                if (pressed) {
                    addTransformation({type: "Mute"});
                } else {
                    removeTransformation("Mute");
                }
            }}
        >
            Mute
            <SpeakerOffIcon className={"ml-3"}/>
        </Toggle>
    )
}