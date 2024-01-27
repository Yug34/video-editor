import {Toggle} from "@/components/ui/toggle";
import {Transformation, TransformationTypes} from "@/types";

interface MuteProps {
    addTransformation(transformation: Transformation): void;

    removeTransformation(transformationType: TransformationTypes): void;
}

export const Mute = ({addTransformation, removeTransformation}: MuteProps) => {
    return (
        <Toggle
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
        </Toggle>
    )
}